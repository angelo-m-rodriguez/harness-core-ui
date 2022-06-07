/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { CSSProperties } from 'react'
import type { IconName, SelectOption } from '@wings-software/uicore'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import type { NodeRunInfo } from 'services/pipeline-ng'

// TODO: should be replaced with type-shape of the box (like: Stage, Step, Approval)
export enum ExecutionPipelineNodeType {
  DIAMOND = 'DIAMOND',
  NORMAL = 'NORMAL',
  ICON = 'ICON',
  MATRIX = 'MATRIX'
}

export interface StageOptions extends SelectOption {
  value: string
  disabled?: boolean
}

export interface ExecutionPipelineItem<T> {
  [x: string]: any
  iconStyle?: CSSProperties
  iconSize?: number
  identifier: string
  name: string
  type: ExecutionPipelineNodeType
  status: ExecutionStatus
  icon: IconName
  skipCondition?: string
  when?: NodeRunInfo
  barrierFound?: boolean
  disableClick?: boolean
  cssProps?: CSSProperties
  data?: T
  pipeline?: ExecutionPipeline<T>
  itemType?: 'step' | 'service-dependency' | string
}

export interface ExecutionPipelineGroupInfo<T> {
  identifier: string
  name: string
  data: T
  cssProps?: CSSProperties
  icon: IconName
  skipCondition?: string
  when?: NodeRunInfo
  containerCss?: CSSProperties
  textCss?: CSSProperties
  verticalStepGroup?: boolean
  status: ExecutionStatus
  isOpen: boolean
  items: Array<ExecutionPipelineNode<T>>
}
export interface ExecutionPipelineNode<T> {
  item?: ExecutionPipelineItem<T>
  parallel?: Array<ExecutionPipelineNode<T>>
  group?: ExecutionPipelineGroupInfo<T>
}

export interface ExecutionPipeline<T> {
  items: Array<ExecutionPipelineNode<T>>
  identifier: string
  status?: ExecutionStatus
  allNodes: string[]
}
