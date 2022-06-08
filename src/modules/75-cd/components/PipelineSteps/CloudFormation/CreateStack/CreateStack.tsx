/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { forwardRef } from 'react'
import * as Yup from 'yup'
import { isEmpty, map, set, unset, isNull, forOwn } from 'lodash-es'
import { IconName, MultiTypeInputType, getMultiTypeFromValue } from '@harness/uicore'
import { yupToFormErrors, FormikErrors } from 'formik'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { StringsMap } from 'stringTypes'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type {
  CreateStackStepInfo,
  CreateStackData,
  CreateStackVariableStepProps
} from '../CloudFormationInterfaces.types'
import { CreateStack } from './CreateStackRef'
import { CreateStackVariableStep } from './VariableView/VariableView'
import CreateStackInputStep from './InputSteps/InputStep'
const CloudFormationCreateStackWithRef = forwardRef(CreateStack)

export class CFCreateStack extends PipelineStep<CreateStackStepInfo> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected type = StepType.CloudFormationCreateStack
  protected stepIcon: IconName = 'cloud-formation-create'
  protected stepName = 'CloudFormation Create Stack'
  protected stepDescription: keyof StringsMap = 'cd.cloudFormation.createDescription'
  protected stepIconSize = 32

  protected defaultValues: CreateStackStepInfo = {
    type: StepType.CloudFormationCreateStack,
    name: '',
    identifier: '',
    timeout: '10m',
    spec: {
      provisionerIdentifier: '',
      configuration: {
        stackName: '',
        connectorRef: '',
        region: '',
        templateFile: {
          type: 'Remote',
          spec: {}
        }
      }
    }
  }
  /* istanbul ignore next */
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<CreateStackStepInfo>): FormikErrors<CreateStackStepInfo> {
    const errors = {} as any
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })

      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })

      try {
        timeout.validateSync(data)
      } catch (e) {
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)
          Object.assign(errors, err)
        }
      }
    }

    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }
  /* istanbul ignore next */
  processFormData(data: any): CreateStackStepInfo {
    const awsConnRef = data?.spec?.configuration?.connectorRef?.value || data?.spec?.configuration?.connectorRef
    let templateFile = data.spec.configuration.templateFile

    if (data?.spec?.configuration?.templateFile?.type === 'Remote') {
      const connectorRef =
        data?.spec?.configuration?.templateFile?.spec?.store?.spec?.connectorRef?.value ||
        data?.spec?.configuration?.templateFile?.spec?.store?.spec?.connectorRef
      templateFile = {
        ...data.spec.configuration.templateFile,
        spec: {
          store: {
            ...data.spec.configuration.templateFile?.spec?.store,
            spec: {
              ...data?.spec?.configuration?.templateFile?.spec?.store?.spec,
              connectorRef
            }
          }
        }
      }
    }
    if (!isEmpty(data.spec.configuration?.parameters)) {
      const params = data.spec.configuration.parameters
      set(
        data,
        'spec.configuration.parameters',
        map(params, param => ({
          ...param,
          store: {
            ...param?.store,
            spec: {
              connectorRef: param.store.spec.connectorRef,
              ...(param?.store?.spec?.region
                ? {
                    urls: param?.store?.spec?.paths || param?.store?.spec?.urls,
                    region: param?.store?.spec.region
                  }
                : { paths: param?.store?.spec?.paths, ...param?.store?.spec })
            }
          }
        }))
      )
    }

    if (!isEmpty(data?.spec?.configuration?.skipOnStackStatuses)) {
      let statuses = data?.spec?.configuration?.skipOnStackStatuses
      if (getMultiTypeFromValue(statuses) === MultiTypeInputType.FIXED) {
        statuses = map(statuses, status => status?.value || status)
      }
      set(data, 'spec.configuration.skipOnStackStatuses', statuses)
    }

    if (!isEmpty(data?.spec?.configuration?.capabilities)) {
      let capabilities = data.spec.configuration.capabilities
      if (getMultiTypeFromValue(capabilities) === MultiTypeInputType.FIXED) {
        capabilities = map(capabilities, cap => cap?.value || cap)
      }
      set(data, 'spec.configuration.capabilities', capabilities)
    }

    if (!isEmpty(data.spec.configuration?.parameterOverrides)) {
      set(
        data,
        'spec.configuration.parameterOverrides',
        map(data.spec.configuration?.parameterOverrides, ({ name, value }) => ({ name, value, type: 'String' }))
      )
    }

    if (!isEmpty(data.spec.configuration?.tags)) {
      set(data, 'spec.configuration.tags.type', 'Inline')
    }

    return {
      ...data,
      spec: {
        ...data.spec,
        configuration: {
          ...data.spec.configuration,
          connectorRef: awsConnRef,
          templateFile
        }
      }
    }
  }

  /* istanbul ignore next */
  private getInitialValues(data: CreateStackStepInfo): CreateStackData {
    const config = data?.spec?.configuration
    let capabilities, skipOnStackStatuses, parameters
    capabilities = config?.capabilities
    if (!isEmpty(capabilities) && getMultiTypeFromValue(capabilities) === MultiTypeInputType.FIXED) {
      capabilities = map(data?.spec?.configuration?.capabilities, item => ({ label: item, value: item }))
      set(data, 'spec.configuration.capabilities', capabilities)
    }

    skipOnStackStatuses = config?.skipOnStackStatuses
    if (!isEmpty(skipOnStackStatuses) && getMultiTypeFromValue(skipOnStackStatuses) === MultiTypeInputType.FIXED) {
      skipOnStackStatuses = map(config?.skipOnStackStatuses, item => ({ label: item, value: item }))
      set(data, 'spec.configuration.skipOnStackStatuses', skipOnStackStatuses)
    }

    parameters = config?.parameters
    if (!isEmpty(parameters)) {
      parameters = map(config?.parameters, param => ({
        ...param,
        store: {
          ...param?.store,
          spec: {
            ...param?.store?.spec,
            connectorRef: param.store.spec.connectorRef,
            ...(param?.store?.spec?.region ? { urls: param?.store?.spec?.urls } : { paths: param?.store?.spec?.paths })
          }
        }
      }))
      set(data, 'spec.configuration.parameters', parameters)
    }
    // empty values returned from api removed
    // causes issues with yup having null values for strings/arrays
    forOwn(config, (value, key) => isNull(value) && unset(config, key))

    return {
      ...data,
      spec: {
        ...data?.spec,
        provisionerIdentifier: data?.spec?.provisionerIdentifier || '',
        configuration: {
          ...config,
          connectorRef: config?.connectorRef || '',
          region: config?.region || '',
          stackName: config?.stackName || '',
          templateFile: config?.templateFile || {
            type: 'Remote',
            spec: {}
          }
        }
      }
    }
  }

  renderStep({
    initialValues,
    onUpdate,
    onChange,
    allowableTypes,
    stepViewType,
    formikRef,
    isNewStep,
    readonly,
    inputSetData,
    path,
    customStepProps
  }: StepProps<CreateStackStepInfo>): JSX.Element {
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <CreateStackInputStep
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          allValues={inputSetData?.allValues}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          inputSetData={inputSetData}
          path={path}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <CreateStackVariableStep {...(customStepProps as CreateStackVariableStepProps)} initialValues={initialValues} />
      )
    }

    return (
      <CloudFormationCreateStackWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={(data: any) => onUpdate?.(this.processFormData(data))}
        onChange={(data: any) => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        ref={formikRef}
        readonly={readonly}
        stepViewType={stepViewType}
      />
    )
  }
}
