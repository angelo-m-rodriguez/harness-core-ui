/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Intent, Layout, useConfirmationDialog } from '@harness/uicore'
import { debounce, defaultTo, get } from 'lodash-es'
import produce from 'immer'
import cx from 'classnames'
import type { ServiceDefinition, StageElementConfig } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { getStageIndexFromPipeline } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import type { K8SDirectServiceStep } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpecInterface'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  deleteStageData,
  doesStageContainOtherData,
  getStepTypeByDeploymentType,
  ServiceDeploymentType
} from '@pipeline/utils/stageHelpers'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { useServiceContext } from '@cd/context/ServiceContext'
import { setupMode } from '../PropagateWidget/PropagateWidget'
import SelectDeploymentType from '../SelectDeploymentType'
import css from './DeployServiceDefinition.module.scss'

function DeployServiceDefinition(): React.ReactElement {
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updateStage,
    allowableTypes,
    isReadonly
  } = usePipelineContext()
  const { isServiceEntityModalView } = useServiceContext()

  const { index: stageIndex } = getStageIndexFromPipeline(pipeline, selectedStageId || '')
  const { getString } = useStrings()
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  const getDeploymentType = (): ServiceDeploymentType => {
    return get(stage, 'stage.spec.serviceConfig.serviceDefinition.type')
  }
  const [selectedDeploymentType, setSelectedDeploymentType] = useState<ServiceDeploymentType | undefined>(
    getDeploymentType()
  )
  const [currStageData, setCurrStageData] = useState<DeploymentStageElementConfig | undefined>()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceUpdateStage = useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* istanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )

  useEffect(() => {
    //This is required when serviceDefinition is rendered inside service entity
    if (!selectedDeploymentType) {
      setSelectedDeploymentType(getDeploymentType())
    }
  }, [stage?.stage?.spec?.serviceConfig?.serviceDefinition?.type])

  const { openDialog: openStageDataDeleteWarningDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('pipeline.stageDataDeleteWarningText'),
    titleText: getString('pipeline.stageDataDeleteWarningTitle'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        deleteStageData(currStageData)
        await debounceUpdateStage(currStageData)
        setSelectedDeploymentType(currStageData?.spec?.serviceConfig?.serviceDefinition?.type as ServiceDeploymentType)
      }
    }
  })

  const handleDeploymentTypeChange = useCallback(
    (deploymentType: ServiceDeploymentType): void => {
      if (deploymentType !== selectedDeploymentType) {
        const stageData = produce(stage, draft => {
          const serviceDefinition = get(draft, 'stage.spec.serviceConfig.serviceDefinition', {})
          serviceDefinition.type = deploymentType
        })
        if (doesStageContainOtherData(stageData?.stage)) {
          setCurrStageData(stageData?.stage)
          openStageDataDeleteWarningDialog()
        } else {
          setSelectedDeploymentType(deploymentType)
          updateStage(stageData?.stage as StageElementConfig)
        }
      }
    },
    [stage, updateStage]
  )
  return (
    <div className={cx(css.contentSection, isServiceEntityModalView ? css.editServiceModal : css.nonModalView)}>
      <div className={css.tabHeading} id="serviceDefinition">
        {getString('pipelineSteps.deploy.serviceSpecifications.serviceDefinition')}
      </div>
      <SelectDeploymentType
        selectedDeploymentType={selectedDeploymentType}
        isReadonly={isReadonly}
        handleDeploymentTypeChange={handleDeploymentTypeChange}
      />
      <Layout.Horizontal>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          readonly={isReadonly}
          initialValues={{
            stageIndex,
            setupModeType: setupMode.DIFFERENT,
            deploymentType: selectedDeploymentType as ServiceDefinition['type']
          }}
          allowableTypes={allowableTypes}
          type={getStepTypeByDeploymentType(defaultTo(selectedDeploymentType, ''))}
          stepViewType={StepViewType.Edit}
        />
      </Layout.Horizontal>
    </div>
  )
}

export default DeployServiceDefinition
