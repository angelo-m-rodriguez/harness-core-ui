/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StringsMap } from 'stringTypes'

export enum LoopingStrategyEnum {
  Matrix = 'matrix',
  For = 'for',
  Parallelism = 'parallelism'
}

export interface Strategy {
  label: string
  value: LoopingStrategyEnum
  helperText: keyof StringsMap
  helperLink: string
}

export const AvailableStrategies: Strategy[] = [
  {
    label: 'Matrix',
    value: LoopingStrategyEnum.Matrix,
    helperText: 'pipeline.loopingStrategy.helperText.matrix',
    helperLink: 'https://www.google.com'
  },
  {
    label: 'For Loop',
    value: LoopingStrategyEnum.For,
    helperText: 'pipeline.loopingStrategy.helperText.for',
    helperLink: 'https://www.google.com'
  },
  {
    label: 'Parallelism',
    value: LoopingStrategyEnum.Parallelism,
    helperText: 'pipeline.loopingStrategy.helperText.parallelism',
    helperLink: 'https://www.google.com'
  }
]
