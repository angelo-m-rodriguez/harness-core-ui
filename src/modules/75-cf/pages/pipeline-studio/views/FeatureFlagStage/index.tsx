/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import type { UseStringsReturn } from 'framework/strings'
import { StageType } from '@pipeline/utils/stageHelpers'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import type { StageAttributes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { FeatureFlagStage } from './FeatureFlagStage'

/* istanbul ignore next */
const getStageAttributes = (getString: UseStringsReturn['getString']): StageAttributes => ({
  name: getString('pipelineSteps.feature.create.featureStageName'),
  type: StageType.FEATURE,
  icon: 'cf-main',
  iconColor: 'var(--pipeline-feature-stage-color)',
  isApproval: false,
  openExecutionStrategy: false
})
/* istanbul ignore next */
const getStageEditorImplementation = (isEnabled: boolean, getString: UseStringsReturn['getString']): ReactElement => (
  <FeatureFlagStage
    icon={'cf-main'}
    hoverIcon={'feature-flag-stage'}
    iconsStyle={{ color: 'var(--pipeline-feature-stage-color)' }}
    name={getString('pipelineSteps.feature.create.featureStageName')}
    type={StageType.FEATURE}
    title={getString('pipelineSteps.feature.create.featureStageName')}
    description={getString('pipeline.pipelineSteps.featureStageDescription')}
    isDisabled={false}
    isHidden={!isEnabled}
    isApproval={false}
    isTemplateSupported={true}
  />
)

export function registerFeatureFlagPipelineStage(): void {
  stagesCollection.registerStageFactory(StageType.FEATURE, getStageAttributes, getStageEditorImplementation)
}
