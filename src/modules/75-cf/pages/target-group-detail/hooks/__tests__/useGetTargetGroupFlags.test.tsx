/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { act, renderHook as render, RenderHookResult } from '@testing-library/react-hooks'
import type { Feature, Features } from 'services/cf'
import * as cfServices from 'services/cf'
import { mockFeatures, mockSegmentFlags, mockTargetGroup } from '@cf/pages/target-group-detail/__tests__/mocks'
import useGetTargetGroupFlags, {
  UseGetTargetGroupFlagsPayload
} from '@cf/pages/target-group-detail/hooks/useGetTargetGroupFlags'

const mockResponse = (flags: Feature[] = mockFeatures): Features =>
  ({
    features: flags,
    pageIndex: 0,
    pageSize: flags.length,
    itemCount: flags.length,
    pageCount: 1,
    version: 1
  } as Features)

const renderHook = (): RenderHookResult<any, UseGetTargetGroupFlagsPayload> =>
  render(() =>
    useGetTargetGroupFlags({
      targetGroup: mockTargetGroup,
      projectIdentifier: 'p1',
      orgIdentifier: 'o1',
      accountIdentifier: 'a1'
    })
  )

describe('useGetTargetGroupFlags', () => {
  const useGetAllFeaturesMock = jest.spyOn(cfServices, 'useGetAllFeatures')
  const useGetSegmentFlagsMock = jest.spyOn(cfServices, 'useGetSegmentFlags')

  beforeEach(() => {
    jest.resetAllMocks()

    useGetSegmentFlagsMock.mockReturnValue({
      data: mockSegmentFlags,
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue(undefined)
    } as any)
  })

  describe('loading', () => {
    test('it should return loading true when get segment flags is loading', async () => {
      useGetSegmentFlagsMock.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      } as any)

      const { result } = renderHook()

      expect(result.current.loading).toBeTruthy()
    })

    test('it should return loading true when get all features is loading', async () => {
      useGetAllFeaturesMock.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn().mockResolvedValue(undefined)
      } as any)

      const { result, waitForNextUpdate } = renderHook()
      await waitForNextUpdate()

      expect(result.current.loading).toBeTruthy()
    })
  })

  describe('error', () => {
    test('it should return the segments error when get segment flags call fails', async () => {
      const message = 'SEGMENTS CALL FAILED'

      useGetSegmentFlagsMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message },
        refetch: jest.fn()
      } as any)

      const { result } = renderHook()

      expect(result.current.error).toHaveProperty('message', message)
    })

    test('it should return the features error when get all features call fails', async () => {
      const message = 'GET ALL FEATURES CALL FAILED'

      useGetAllFeaturesMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message },
        refetch: jest.fn().mockRejectedValue(undefined)
      } as any)

      const { result, waitForNextUpdate } = renderHook()
      await waitForNextUpdate()

      expect(result.current.error).toHaveProperty('message', message)
    })
  })

  describe('data', () => {
    test('it should return null when loading', async () => {
      useGetSegmentFlagsMock.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn()
      } as any)

      const { result } = renderHook()

      expect(result.current.data).toBeNull()
    })

    test('it should return an empty array when there are no segment flags', async () => {
      useGetSegmentFlagsMock.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: jest.fn()
      } as any)

      const { result } = renderHook()

      expect(result.current.data).toEqual([])
    })

    test('it should return an an array of flags when get all features call succeeds', async () => {
      const { result, waitForNextUpdate } = renderHook()
      await waitForNextUpdate()

      expect(result.current.data).toEqual(mockFeatures)
    })
  })

  describe('refetch', () => {
    test('it should go into a loading state when refetched', async () => {
      const { result, waitForNextUpdate } = renderHook()

      expect(result.current.loading).toBeTruthy()

      await waitForNextUpdate()
      expect(result.current.loading).toBeFalsy()

      await act(() => result.current.refetch())
      expect(result.current.loading).toBeTruthy()
    })
  })
})
