/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { ValueType } from '@secrets/components/TextReference/TextReference'
import type { PlainEntity } from '../CustomHealthConnector/components/CustomHealthHeadersAndParams/CustomHealthHeadersAndParams.types'

export const DefaultHeadersInitialValues: Array<PlainEntity> = [
  {
    key: '',
    value: {
      textField: '',
      fieldType: ValueType.TEXT
    }
  }
]

export const HeadersKey = 'headers'
