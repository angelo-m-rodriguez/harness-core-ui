/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { TemplateSummaryResponse } from 'services/template-ng'

export interface EditStageViewProps {
  data?: StageElementWrapper<DeploymentStageElementConfig>
  template?: TemplateSummaryResponse
  onSubmit?: (values: StageElementWrapper<DeploymentStageElementConfig>, identifier?: string) => void
  onChange?: (values: DeploymentStageElementConfig) => void
  context?: string
  isReadonly: boolean
  updateDeploymentType?: (deploymentType: ServiceDeploymentType, isDeleteStage?: boolean) => void
}

export interface EditStageFormikType {
  identifier: string
  name: string
  description?: string
  tags?: { [key: string]: string }
  serviceType: string
  deploymentType?: string
  gitOpsEnabled?: boolean
}
