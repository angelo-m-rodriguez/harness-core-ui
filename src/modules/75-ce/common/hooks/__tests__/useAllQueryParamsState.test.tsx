/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { act } from 'react-dom/test-utils'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { useAllQueryParamsState } from '../useAllQueryParamsState'

const defaultParams = {
  search: { value: 'test' },
  sort: { value: { field: 'name', type: 'asc' }, parseAsObject: true },
  page: { value: 1, parseAsNumeric: true }
}

describe('query params hook tests', () => {
  test('should get all params with default value', () => {
    const {
      result: {
        current: [state]
      }
    } = renderHook(() => useAllQueryParamsState(defaultParams), { wrapper: TestWrapper })
    expect(state.search.value).toBe('test')
    expect(state.sort.value).toStrictEqual({ field: 'name', type: 'asc' })
    expect(state.page.value).toBe(1)
  })

  test('should set the value of query param', async () => {
    const { result } = renderHook(() => useAllQueryParamsState(defaultParams), { wrapper: TestWrapper })
    const [, setState] = result.current
    act(() => {
      setState({ page: { value: 2 }, search: { value: 'do' }, sort: { value: { field: 'savings', type: 'asc' } } })
    })
    const [state] = result.current
    await waitFor(() => {
      expect(state.page.value).toBe(2)
      expect(state.search.value).toBe('do')
      expect(state.sort.value).toStrictEqual({ field: 'savings', type: 'asc' })
    })
  })
})
