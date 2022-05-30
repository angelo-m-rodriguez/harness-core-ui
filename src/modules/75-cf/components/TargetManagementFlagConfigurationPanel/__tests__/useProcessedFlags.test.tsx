/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook } from '@testing-library/react-hooks'
import { cloneDeep, random } from 'lodash-es'
import type { Feature } from 'services/cf'
import useProcessedFlags from '../useProcessedFlags'

const mockFlags = [
  { identifier: 'flag1', name: 'Flag 1' },
  { identifier: 'flag2', name: 'Flag 2' },
  { identifier: 'flag3', name: 'Flag 3' },
  { identifier: 'flag4', name: 'Flag 4' },
  { identifier: 'flag5', name: 'Flag 5' }
] as Feature[]

describe('useProcessedFlags', () => {
  test('it should return filtered flags, searchedFlags and pagedFlags', async () => {
    const { result } = renderHook(() => useProcessedFlags({ flags: mockFlags }))

    expect(result.current).toHaveProperty('filteredFlags', mockFlags)
    expect(result.current).toHaveProperty('searchedFlags', mockFlags)
    expect(result.current).toHaveProperty('pagedFlags', mockFlags)
  })

  test('it should reorder flags alphabetically', async () => {
    const randomisedFlags = cloneDeep(mockFlags).sort(() => random(-1, 1, false))

    const { result } = renderHook(() => useProcessedFlags({ flags: randomisedFlags }))

    expect(result.current).toHaveProperty('filteredFlags', mockFlags)
    expect(result.current).toHaveProperty('searchedFlags', mockFlags)
    expect(result.current).toHaveProperty('pagedFlags', mockFlags)
  })

  test('it should reorder flags taking into account numbers', async () => {
    const flag10 = { identifier: 'flag10', name: 'Flag 10' } as Feature
    const outOfOrder = [flag10, ...mockFlags]
    const inOrder = [...mockFlags, flag10]

    const { result } = renderHook(() => useProcessedFlags({ flags: outOfOrder }))

    expect(result.current).toHaveProperty('filteredFlags', inOrder)
    expect(result.current).toHaveProperty('searchedFlags', inOrder)
    expect(result.current).toHaveProperty('pagedFlags', inOrder)
  })

  test('it should filter out removed flags', async () => {
    const removedFlag = mockFlags[2]

    const { result } = renderHook(() => useProcessedFlags({ flags: mockFlags, removedFlags: [removedFlag] }))

    expect(result.current.filteredFlags).not.toContain(removedFlag)
    expect(result.current.filteredFlags).toHaveLength(mockFlags.length - 1)
  })

  test('it should search for flags matching the search term', async () => {
    const { result } = renderHook(() => useProcessedFlags({ flags: mockFlags, searchTerm: '2' }))

    expect(result.current).toHaveProperty('filteredFlags', mockFlags)
    expect(result.current).toHaveProperty('searchedFlags', [mockFlags[1]])
    expect(result.current).toHaveProperty('pagedFlags', [mockFlags[1]])
  })

  test('it should page flags starting from page 0', async () => {
    const lotsOfFlags = [...new Array(30)].map((_, index) => ({
      identifier: `flag${index + 1}`,
      name: `Flag ${index + 1}`
    })) as Feature[]

    const { result } = renderHook(() => useProcessedFlags({ flags: lotsOfFlags }))

    expect(result.current).toHaveProperty('filteredFlags', lotsOfFlags)
    expect(result.current).toHaveProperty('searchedFlags', lotsOfFlags)
    expect(result.current).toHaveProperty('pagedFlags', lotsOfFlags.slice(0, 15))
  })

  test('it should page flags using the pageNumber', async () => {
    const lotsOfFlags = [...new Array(45)].map((_, index) => ({
      identifier: `flag${index + 1}`,
      name: `Flag ${index + 1}`
    })) as Feature[]

    const { result } = renderHook(() => useProcessedFlags({ flags: lotsOfFlags, pageNumber: 1 }))

    expect(result.current).toHaveProperty('filteredFlags', lotsOfFlags)
    expect(result.current).toHaveProperty('searchedFlags', lotsOfFlags)
    expect(result.current).toHaveProperty('pagedFlags', lotsOfFlags.slice(15, 30))
  })
})
