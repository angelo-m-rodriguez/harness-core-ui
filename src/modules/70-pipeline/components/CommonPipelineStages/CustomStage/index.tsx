/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { UseStringsReturn } from 'framework/strings'
import { StageType } from '@pipeline/utils/stageHelpers'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import type { StageAttributes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { CustomStage } from './CustomStage'

const getStageAttributes = (_getString: UseStringsReturn['getString']): StageAttributes => ({
  name: 'Custom',
  type: StageType.CUSTOM,
  icon: 'custom-stage-icon',
  iconColor: 'var(--pipeline-custom-stage-color)',
  isApproval: false,
  openExecutionStrategy: false
})

const getStageEditorImplementation = (isEnabled: boolean, _getString: UseStringsReturn['getString']): JSX.Element => (
  <CustomStage
    icon={'custom-stage-icon'}
    name={_getString('pipeline.pipelineSteps.customStage')}
    title={_getString('pipeline.pipelineSteps.customStage')}
    description={_getString('pipeline.pipelineSteps.customStageDescription')}
    type={StageType.CUSTOM}
    isComingSoon={false}
    hoverIcon="custom-stage"
    isDisabled={!isEnabled}
    isApproval={false}
    isTemplateSupported={true}
  />
)

stagesCollection.registerStageFactory(StageType.CUSTOM, getStageAttributes, getStageEditorImplementation)
