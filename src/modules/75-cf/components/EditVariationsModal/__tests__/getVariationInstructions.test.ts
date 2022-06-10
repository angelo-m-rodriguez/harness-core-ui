/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep } from 'lodash-es'
import type { Variation } from 'services/cf'
import {
  getAddedInstructions,
  getRemovedInstructions,
  getUpdatedInstructions,
  getVariationInstructions
} from '../getVariationInstructions'

const variations: Variation[] = [
  {
    identifier: 'var1',
    name: 'Var 1',
    value: 'v1'
  },
  {
    identifier: 'var2',
    name: 'Var 2',
    value: 'v2'
  },
  {
    identifier: 'var3',
    name: 'Var 3',
    value: 'v3'
  }
]

describe('getVariationInstructions', () => {
  test('it should return an empty array when there are no removed, added or updated variations', async () => {
    expect(getVariationInstructions(variations, variations)).toEqual([])
  })

  test('it should return a mixture of remove, add and update instructions based on the changes made', async () => {
    const newVariation: Variation = {
      identifier: 'NEW IDENTIFIER',
      name: 'NEW NAME',
      value: 'NEW VALUE'
    }

    const updatedVariations = cloneDeep(variations.slice(1))
    updatedVariations[0].name = 'UPDATED VARIATION'

    const result = getVariationInstructions(variations, [...updatedVariations, newVariation])
    expect(result).toHaveLength(3)
    expect(result).toContainEqual({ kind: 'addVariation', parameters: newVariation })
    expect(result).toContainEqual({ kind: 'deleteVariation', parameters: { identifier: variations[0].identifier } })
    expect(result).toContainEqual({ kind: 'updateVariation', parameters: updatedVariations[0] })
  })
})

describe('getRemovedInstructions', () => {
  test('it should return an empty array when there are no removed variations', async () => {
    expect(getRemovedInstructions(variations, variations)).toEqual([])
  })

  test('it should return a single instruction when one variation is removed', async () => {
    const newVariations = variations.slice(1)

    const result = getRemovedInstructions(variations, newVariations)
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('kind', 'deleteVariation')
    expect(result[0]).toHaveProperty('parameters', expect.objectContaining({ identifier: variations[0].identifier }))
  })

  test('it should return multiple instructions when two variations are removed', async () => {
    const newVariations = variations.slice(2)

    const result = getRemovedInstructions(variations, newVariations)
    expect(result).toHaveLength(2)
  })
})

describe('getAddedInstructions', () => {
  test('it should return an empty array when there are no added variations', async () => {
    expect(getAddedInstructions(variations, variations)).toEqual([])
  })

  test('it should return a single instruction when one variation is added', async () => {
    const newVariation: Variation = {
      identifier: 'NEW ID',
      name: 'NEW NAME',
      value: 'NEW VALUE'
    }

    const result = getAddedInstructions(variations, [...variations, newVariation])
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('kind', 'addVariation')
    expect(result[0]).toHaveProperty('parameters', newVariation)
  })

  test('it should return multiple instructions when two variations are added', async () => {
    const newVariations: Variation[] = [
      {
        identifier: 'NEW ID 1',
        name: 'NEW NAME 1',
        value: 'NEW VALUE 1'
      },
      {
        identifier: 'NEW ID 2',
        name: 'NEW NAME 2',
        value: 'NEW VALUE 2'
      }
    ]

    const result = getAddedInstructions(variations, [...variations, ...newVariations])
    expect(result).toHaveLength(2)
  })
})

describe('getUpdatedInstructions', () => {
  test('it should return an empty array when there are no updated variations', async () => {
    expect(getUpdatedInstructions(variations, variations)).toEqual([])
  })

  test('it should return a single instruction when one variation is updated', async () => {
    const updatedVariation = cloneDeep(variations[0])
    updatedVariation.name = 'UPDATED VARIATION'

    const result = getUpdatedInstructions(variations, [updatedVariation, ...variations.slice(1)])
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('kind', 'updateVariation')
    expect(result[0]).toHaveProperty('parameters', updatedVariation)
  })

  test('it should return multiple instructions when two variations are updated', async () => {
    const updatedVariations = cloneDeep(variations)
    updatedVariations[0].name = 'UPDATED VARIATION 1'
    updatedVariations[1].name = 'UPDATED VARIATION 2'

    const result = getUpdatedInstructions(variations, updatedVariations)
    expect(result).toHaveLength(2)
  })
})
