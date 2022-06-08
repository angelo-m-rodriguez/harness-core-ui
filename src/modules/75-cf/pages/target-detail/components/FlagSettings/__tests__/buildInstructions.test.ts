/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, omit } from 'lodash-es'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import buildInstructions from '../buildInstructions'

describe('buildInstructions', () => {
  const initialValues: FormValues = {
    flags: {
      flag1: { variation: 'true' },
      flag2: { variation: 'false' }
    }
  }

  test('it should return an empty array when no changes are made', async () => {
    expect(buildInstructions(initialValues, initialValues)).toEqual([])
  })

  test('it should build an instruction to update existing flag variations', async () => {
    const newValues = cloneDeep<FormValues>(initialValues)
    newValues.flags.flag1.variation = 'false'

    expect(buildInstructions(newValues, initialValues)).toEqual([
      {
        kind: 'addTargetToFlagsVariationTargetMap',
        parameters: {
          features: [{ identifier: 'flag1', variation: 'false' }]
        }
      }
    ])
  })

  test('it should build an instruction to remove existing flags', async () => {
    const newValues = omit(initialValues, 'flags.flag1')

    expect(buildInstructions(newValues, initialValues)).toEqual([
      {
        kind: 'removeTargetFromFlagsVariationTargetMap',
        parameters: {
          features: [{ identifier: 'flag1', variation: 'true' }]
        }
      }
    ])
  })

  test('it should build an instruction to add a new flag', async () => {
    const newValues = cloneDeep(initialValues)
    newValues.flags.newFlag = {
      variation: 'false'
    }

    expect(buildInstructions(newValues, initialValues)).toEqual([
      {
        kind: 'addTargetToFlagsVariationTargetMap',
        parameters: {
          features: [{ identifier: 'newFlag', variation: 'false' }]
        }
      }
    ])
  })

  test('it should build instructions to update and remove flags', async () => {
    const newValues = omit(initialValues, 'flags.flag1')
    newValues.flags.flag2.variation = 'true'

    const result = buildInstructions(newValues, initialValues)

    expect(result).toContainEqual({
      kind: 'removeTargetFromFlagsVariationTargetMap',
      parameters: {
        features: [{ identifier: 'flag1', variation: 'true' }]
      }
    })

    expect(result).toContainEqual({
      kind: 'addTargetToFlagsVariationTargetMap',
      parameters: {
        features: [{ identifier: 'flag2', variation: 'true' }]
      }
    })
  })
})
