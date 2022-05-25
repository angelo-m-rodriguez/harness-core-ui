/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect } from 'react'
import { Layout, PageSpinner } from '@wings-software/uicore'
import { defaultTo, get, isEmpty, isEqual, set } from 'lodash-es'
import produce from 'immer'
import { useParams } from 'react-router-dom'
import type { AllNGVariables as Variable } from '@pipeline/utils/types'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { usePipelineVariables } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import type {
  CustomVariablesData,
  CustomVariableEditableExtraProps
} from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableEditable'

import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import {
  NGServiceConfig,
  ServiceResponseDTO,
  StageElementConfig,
  StageElementWrapperConfig,
  useGetServiceV2
} from 'services/cd-ng'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import type { AbstractStepFactory } from '../AbstractSteps/AbstractStepFactory'
import { getFlattenedStages, getStageIndexFromPipeline } from '../PipelineStudio/StageBuilder/StageBuilderUtil'
import { StepViewType } from '../AbstractSteps/Step'
import { StepWidget } from '../AbstractSteps/StepWidget'

export interface WorkflowVariablesProps {
  isPropagating?: boolean
  tabName?: string
  formName?: string
  factory: AbstractStepFactory
  readonly?: boolean
}

export default function WorkflowVariables({
  isPropagating = false,
  tabName,
  formName,
  factory,
  readonly: isReadOnlyServiceMode
}: WorkflowVariablesProps): JSX.Element {
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    getStageFromPipeline,
    updateStage,
    isReadonly
  } = usePipelineContext()

  const { accountId, orgIdentifier, projectIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const serviceConfig = stage?.stage?.spec?.serviceConfig || {}
  const parentStage = serviceConfig.useFromStage?.stage
  const { metadataMap } = usePipelineVariables()
  const [parentStageData, setParentStageData] = React.useState<StageElementWrapperConfig>()

  /*************************************Service Entity Related code********************************************************/
  //This is temporary code to fetch the WORKFLOW data from service api. It will be replaced once caching is implemented for service entity
  const {
    data: selectedServiceResponse,
    refetch: refetchServiceData,
    loading: serviceLoading
  } = useGetServiceV2({
    serviceIdentifier: (stage?.stage?.spec as any)?.service?.serviceRef,
    queryParams: { accountIdentifier: accountId, orgIdentifier: orgIdentifier, projectIdentifier: projectIdentifier },
    lazy: true
  })

  useEffect(() => {
    if (!isReadonly && isReadOnlyServiceMode) {
      refetchServiceData()
    }
  }, [isReadOnlyServiceMode, (stage?.stage?.spec as any)?.service?.serviceRef])

  /*************************************Service Entity Related code********************************************************/

  React.useEffect(() => {
    if (isEmpty(parentStageData) && parentStage) {
      const { stages } = getFlattenedStages(pipeline)
      const { index } = getStageIndexFromPipeline(pipeline, parentStage)
      setParentStageData(stages[index])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceConfig.useFromStage?.stage, pipeline])

  const stageSpec = defaultTo(serviceConfig.serviceDefinition?.spec, {})
  const predefinedSetsPath = defaultTo(serviceConfig.stageOverrides, {})

  const updateVariableData = (vars: Variable[]): void => {
    const yamlPath = isPropagating
      ? 'stage.spec.serviceConfig.stageOverrides.variables'
      : 'stage.spec.serviceConfig.serviceDefinition.spec.variables'
    if (stage) {
      updateStage(
        produce(stage, draft => {
          set(draft, yamlPath, vars)
        }).stage as StageElementConfig
      )
    }
  }
  const updateVariables = (vars: Variable[]): void => {
    if (stageSpec || predefinedSetsPath) {
      if (isPropagating) {
        predefinedSetsPath.variables = [...vars]
        updateVariableData(vars)
        return
      }
    }
    updateVariableData(vars)
  }

  const getInitialValues = useCallback((): Variable[] => {
    //This is temporary code to fetch the WORKFLOW data from service api. It will be replaced once caching is implemented for service entity
    if (!isReadonly && isReadOnlyServiceMode) {
      const serviceData = selectedServiceResponse?.data?.service as ServiceResponseDTO
      if (!isEmpty(serviceData?.yaml)) {
        const parsedYaml = yamlParse<NGServiceConfig>(defaultTo(serviceData.yaml, ''))
        const serviceInfo = parsedYaml.service?.serviceDefinition
        return serviceInfo?.spec.variables as Variable[]
      }
      return []
    }

    if (isPropagating) {
      return (predefinedSetsPath?.variables || []) as Variable[]
    }
    return (stageSpec?.variables || []) as Variable[]
  }, [isPropagating, predefinedSetsPath, stageSpec?.variables])

  const getYamlPropertiesForVariables = (): Variable[] => {
    if (isPropagating) {
      return get(predefinedSetsPath, 'variables', []) as Variable[]
    }
    return []
  }

  if (serviceLoading) {
    return <PageSpinner />
  }

  return (
    <Layout.Vertical style={{ borderRadius: '5px' }}>
      <section>
        <StepWidget<CustomVariablesData, CustomVariableEditableExtraProps>
          factory={factory}
          stepViewType={StepViewType.StageVariable}
          initialValues={{
            variables: getInitialValues(),
            isPropagating,
            canAddVariable: true
          }}
          allowableTypes={allowableTypes}
          readonly={isReadOnlyServiceMode}
          type={StepType.CustomVariable}
          onUpdate={({ variables }: { variables: Variable[] }) => {
            if (!isEqual(getInitialValues(), variables)) {
              updateVariables(variables)
            }
          }}
          customStepProps={{
            tabName,
            formName,
            yamlProperties: getYamlPropertiesForVariables().map(
              variable => metadataMap[variable.value || '']?.yamlProperties || {}
            ),
            enableValidation: true
          }}
        />
      </section>
    </Layout.Vertical>
  )
}
