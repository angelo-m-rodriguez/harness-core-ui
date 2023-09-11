/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import produce from 'immer'
import {
  Formik,
  getMultiTypeFromValue,
  MultiTypeInputType,
  AllowedTypes,
  RUNTIME_INPUT_VALUE,
  EXECUTION_TIME_INPUT_VALUE,
  useToaster
} from '@harness/uicore'
import { defaultTo, get, isNil, noop, isBoolean, set } from 'lodash-es'
import type { FormikProps } from 'formik'
import type { ServiceDefinition, ServiceYamlV2, TemplateLinkConfig, ServicesYaml } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useStageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { isMultiTypeExpression, isMultiTypeRuntime, isValueExpression, isValueRuntimeInput } from '@common/utils/utils'
import { useDeepCompareEffect } from '@common/hooks'
import {
  DeployServiceEntityData,
  DeployServiceEntityCustomProps,
  FormState,
  getValidationSchema,
  getAllFixedServices,
  getAllFixedServicesFromValues
} from './DeployServiceEntityUtils'
import { useGetServicesData } from './useGetServicesData'
import { setupMode } from '../PipelineStepsUtil'
import BaseDeployServiceEntity from './BaseDeployServiceEntity'

export interface DeployServiceEntityWidgetProps extends DeployServiceEntityCustomProps {
  initialValues: DeployServiceEntityData
  readonly: boolean
  allowableTypes: AllowedTypes
  customStepProps?: DeployServiceEntityCustomProps
  serviceLabel?: string
  onUpdate?(data: DeployServiceEntityData): void
}

function getInitialValues(data: DeployServiceEntityData): FormState {
  const parallelValue = get(data, 'services.metadata.parallel')
  const parallelValueToBeUpdated =
    isValueRuntimeInput(parallelValue as string) || isBoolean(parallelValue) ? parallelValue : true

  if (data.service && data.service.serviceRef) {
    return {
      service: data.service.serviceRef,
      serviceInputs:
        getMultiTypeFromValue(data.service.serviceRef) === MultiTypeInputType.FIXED
          ? { [data.service.serviceRef]: data.service.serviceInputs }
          : isValueExpression(data.service.serviceRef)
          ? { service: { expression: data.service.serviceInputs } }
          : {}
    }
  } else if (data.services) {
    if (Array.isArray(data.services.values)) {
      return {
        services: data.services.values.map(svc => ({
          value: defaultTo(svc.serviceRef, ''),
          label: defaultTo(svc.serviceRef, '')
        })),
        serviceInputs: data.services.values.reduce(
          (p, c) => ({ ...p, [defaultTo(c.serviceRef, '')]: c.serviceInputs }),
          {}
        ),
        parallel: parallelValueToBeUpdated as boolean
      }
    }

    return {
      services: data.services.values,
      serviceInputs: {},
      parallel: parallelValueToBeUpdated as boolean
    }
  }

  return { parallel: parallelValueToBeUpdated as boolean }
}

export default function DeployServiceEntityWidget({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes,
  serviceLabel,
  deploymentType,
  gitOpsEnabled,
  deploymentMetadata,
  stageIdentifier,
  setupModeType
}: DeployServiceEntityWidgetProps): React.ReactElement {
  const [isFetchingMergeServiceInputs, setIsFetchingMergeServiceInputs] = React.useState<boolean>(false)

  const { getString } = useStrings()
  const { showWarning } = useToaster()

  const { CDS_SUPPORT_SERVICE_INPUTS_AS_EXECUTION_INPUTS: areServiceInputsSupportedAsExecutionInputs } =
    useFeatureFlags()

  const { subscribeForm, unSubscribeForm } = useStageErrorContext<FormState>()
  const formikRef = React.useRef<FormikProps<FormState> | null>(null)
  const [allServices, setAllServices] = useState(
    setupModeType === setupMode.DIFFERENT ? getAllFixedServices(initialValues) : ['']
  )
  const {
    state: {
      selectionState: { selectedStageId }
    },
    getStageFromPipeline
  } = usePipelineContext()
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const { templateRef: deploymentTemplateIdentifier, versionLabel } =
    (get(stage, 'stage.spec.customDeploymentRef') as TemplateLinkConfig) || {}
  const shouldAddCustomDeploymentData =
    deploymentType === ServiceDeploymentType.CustomDeployment && deploymentTemplateIdentifier

  const [serviceInputType, setServiceInputType] = React.useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues?.service?.serviceRef)
  )
  const useGetServicesDataReturn = useGetServicesData({
    gitOpsEnabled,
    deploymentMetadata,
    serviceIdentifiers: allServices,
    deploymentType: deploymentType as ServiceDefinition['type'],
    ...(shouldAddCustomDeploymentData ? { deploymentTemplateIdentifier, versionLabel } : {}),
    lazyService: isMultiTypeExpression(serviceInputType)
  })

  const { nonExistingServiceIdentifiers, loadingServicesList, loadingServicesData } = useGetServicesDataReturn

  useEffect(() => {
    subscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDeepCompareEffect(() => {
    setAllServices(getAllFixedServices(initialValues))
  }, [initialValues])

  useDeepCompareEffect(() => {
    if (nonExistingServiceIdentifiers.length) {
      showWarning(
        getString('cd.identifiersDoNotExist', {
          entity: getString('service'),
          nonExistingIdentifiers: nonExistingServiceIdentifiers.join(', ')
        })
      )
    }
  }, [nonExistingServiceIdentifiers])

  const loading = loadingServicesList || loadingServicesData || isFetchingMergeServiceInputs

  function handleUpdate(values: FormState): void {
    // For multi service propagation, only metadata parallel field can be updated in yaml
    if (setupModeType === setupMode.PROPAGATE) {
      const existingServicesConfiguration = get(stage, 'stage.spec.services') as ServicesYaml
      if (!isNil(values.services) && !isNil(existingServicesConfiguration)) {
        const updatedServicesConfiguration = produce(existingServicesConfiguration, draft => {
          set(draft, 'metadata.parallel', isValueRuntimeInput(values.parallel) ? values.parallel : !!values.parallel)
        })
        onUpdate?.({
          services: updatedServicesConfiguration
        } as DeployServiceEntityData)
      }
      return
    }
    /* istanbul ignore else */
    if (!isNil(values.services)) {
      onUpdate?.({
        services: {
          values: Array.isArray(values.services)
            ? values.services.map(
                (opt): ServiceYamlV2 => ({
                  serviceRef: opt.value as string,
                  serviceInputs: get(values.serviceInputs, opt.value)
                })
              )
            : values.services,
          metadata: {
            parallel: isValueRuntimeInput(values.parallel) ? values.parallel : !!values.parallel
          }
        }
      })
    } else if (!isNil(values.service)) {
      const typeOfService = getMultiTypeFromValue(values.service)
      let serviceInputs = undefined

      if (typeOfService === MultiTypeInputType.FIXED) {
        serviceInputs = get(values.serviceInputs, values.service)
      } else if (isMultiTypeRuntime(typeOfService)) {
        serviceInputs = RUNTIME_INPUT_VALUE
      } else if (isMultiTypeExpression(typeOfService)) {
        serviceInputs = areServiceInputsSupportedAsExecutionInputs
          ? EXECUTION_TIME_INPUT_VALUE
          : get(values.serviceInputs, 'service.expression')
      }

      onUpdate?.({
        service: {
          serviceRef: values.service,
          serviceInputs
        }
      })
    }

    setAllServices(getAllFixedServicesFromValues(values))
  }

  return (
    <>
      <Formik<FormState>
        formName="deployServiceStepForm"
        onSubmit={noop}
        validate={handleUpdate}
        initialValues={getInitialValues(initialValues)}
        validationSchema={setupModeType === setupMode.DIFFERENT && getValidationSchema(getString)}
        enableReinitialize
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.SERVICE }))
          formikRef.current = formik

          return (
            <BaseDeployServiceEntity
              initialValues={initialValues}
              readonly={readonly}
              allowableTypes={allowableTypes}
              setupModeType={setupModeType}
              serviceLabel={serviceLabel}
              stageIdentifier={stageIdentifier}
              deploymentType={deploymentType}
              gitOpsEnabled={gitOpsEnabled}
              deploymentMetadata={deploymentMetadata}
              serviceInputType={serviceInputType}
              setServiceInputType={setServiceInputType}
              setIsFetchingMergeServiceInputs={setIsFetchingMergeServiceInputs}
              loading={loading}
              useGetServicesDataReturn={useGetServicesDataReturn}
              allServices={allServices}
              setAllServices={setAllServices}
            />
          )
        }}
      </Formik>
    </>
  )
}
