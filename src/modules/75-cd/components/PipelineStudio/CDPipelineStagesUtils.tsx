/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { UseStringsReturn } from 'framework/strings'
import { PipelineStages, PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { StageType } from '@pipeline/utils/stageHelpers'

interface GetCDPipelineStagesArgs {
  args: Omit<PipelineStagesProps, 'children'>
  getString: UseStringsReturn['getString']
  isCIEnabled?: boolean
  isCDEnabled?: boolean
  isCFEnabled?: boolean
  isSTOEnabled?: boolean
  isApprovalStageEnabled?: boolean
  isCustomStageEnabled?: boolean
}

export const getCDPipelineStages: (args: GetCDPipelineStagesArgs) => React.ReactElement<PipelineStagesProps> = ({
  args,
  getString,
  isCIEnabled = false,
  isCDEnabled = false,
  isCFEnabled = false,
  isSTOEnabled = false,
  isApprovalStageEnabled = false,
  isCustomStageEnabled = false
}) => {
  return (
    <PipelineStages {...args}>
      {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
      {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
      {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
      {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
      {stagesCollection.getStage(StageType.SECURITY, isSTOEnabled, getString)}
      {/* 
      Chained pipeline is hidden as of now, uncomment below statement to unhide it.
      {stagesCollection.getStage(StageType.PIPELINE, false, getString)} 
      */}
      {stagesCollection.getStage(StageType.CUSTOM, isCustomStageEnabled, getString)}
      {stagesCollection.getStage(StageType.Template, false, getString)}
    </PipelineStages>
  )
}
