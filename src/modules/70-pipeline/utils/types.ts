/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StoreType } from '@common/constants/GitSyncTypes'
import type { StringNGVariable, NumberNGVariable, SecretNGVariable, PipelineInfoConfig } from 'services/cd-ng'
import type { NodeRunInfo, EntityGitDetails, EntityValidityDetails, InputSetResponse } from 'services/pipeline-ng'

export type AllNGVariables = StringNGVariable | NumberNGVariable | SecretNGVariable

export interface ExecutionPageQueryParams {
  view?: 'log' | 'graph'
  stage?: string
  step?: string
  retryStep?: string
}

export interface ExpressionBlock {
  expression?: string
  expressionValue?: string
}

export interface ConditionalExecutionNodeRunInfo extends NodeRunInfo {
  expressions?: ExpressionBlock[]
}

export type StatusType = 'SUCCESS' | 'FAILURE' | 'ERROR'

export type CreateUpdateInputSetsReturnType = Promise<{
  status?: StatusType
  nextCallback: () => void
}>

export interface InputSetType {
  name: string
  tags?: { [key: string]: string }
  identifier: string
  description: string
  orgIdentifier: string
  projectIdentifier: string
  pipeline: PipelineInfoConfig
  gitDetails: EntityGitDetails
  entityValidityDetails: EntityValidityDetails
  outdated?: boolean
  storeType?: StoreType.INLINE | StoreType.REMOTE
}

export interface InputSetDTO extends Omit<InputSetResponse, 'identifier' | 'pipeline'> {
  pipeline?: PipelineInfoConfig
  identifier?: string
  repo?: string
  branch?: string
}

export interface SaveInputSetDTO {
  inputSet: InputSetDTO
}

export interface Pipeline {
  pipeline: PipelineInfoConfig
}
