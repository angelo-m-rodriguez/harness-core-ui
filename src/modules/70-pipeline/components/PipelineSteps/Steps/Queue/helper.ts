/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType } from '@wings-software/uicore'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig } from 'services/cd-ng'
import type { StringsMap } from 'stringTypes'

export const SCOPE_KEYS = {
  PIPELINE: 'Pipeline',
  STAGE: 'Stage',
  STEP_GROUP: 'StepGroup',
  PLAN: 'Plan'
}

export interface QueueData extends StepElementConfig {
  spec: {
    key: string
    scope: string
  }
}

export interface QueueProps {
  initialValues: QueueData
  onUpdate?: (data: QueueData) => void
  stepViewType: StepViewType
  allowableTypes: MultiTypeInputType[]
  isNewStep?: boolean
  inputSetData?: {
    template?: QueueData
    path?: string
    readonly?: boolean
  }
  onChange?: (data: QueueData) => void
  readonly?: boolean
}

export const getScopeOptions = (
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string
) => [
  { label: getString('common.pipeline'), value: SCOPE_KEYS.PIPELINE },
  { label: getString('common.stage'), value: SCOPE_KEYS.STAGE },
  { label: getString('stepGroup'), value: SCOPE_KEYS.STEP_GROUP },
  { label: getString('common.subscriptions.overview.plan'), value: SCOPE_KEYS.PLAN }
]
