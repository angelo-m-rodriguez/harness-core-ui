/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StringsMap } from 'stringTypes'

export const AvailableStrategies: { label: string; value: string; helperText: keyof StringsMap; helperLink: string }[] =
  [
    {
      label: 'Matrix',
      value: 'matrix',
      helperText: 'pipeline.loopingStrategy.helperText.matrix',
      helperLink: 'https://www.google.com'
    },
    {
      label: 'For Loop',
      value: 'for',
      helperText: 'pipeline.loopingStrategy.helperText.for',
      helperLink: 'https://www.google.com'
    }
  ]
