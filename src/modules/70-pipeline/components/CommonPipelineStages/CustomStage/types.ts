/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { tagsType } from '@wings-software/uicore'
import type { CustomStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { TemplateSummaryResponse } from 'services/template-ng'

export interface CustomStageMinimalModeProps {
  data?: StageElementWrapper<CustomStageElementConfig>
  template?: TemplateSummaryResponse
  onSubmit?: (values: StageElementWrapper<CustomStageElementConfig>, identifier: string) => void
  onChange?: (values: CustomStageMinimalValues) => void
}

export interface CustomStageMinimalValues {
  identifier: string
  name: string
  description?: string
  tags?: tagsType
  // approvalType: string
}

export interface CustomStageOverviewProps {
  name?: string
  children: React.ReactNode
}
