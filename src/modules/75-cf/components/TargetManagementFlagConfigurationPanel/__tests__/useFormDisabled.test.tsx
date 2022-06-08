/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook as render, RenderHookResult } from '@testing-library/react-hooks'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import * as useFeaturesHook from '@common/hooks/useFeatures'
import * as usePermissionHook from '@rbac/hooks/usePermission'
import * as usePlanEnforcementHook from '@cf/hooks/usePlanEnforcement'
import useFormDisabled, { UseFormDisabledPayload } from '../useFormDisabled'

const renderHook = (): RenderHookResult<any, UseFormDisabledPayload> => render(() => useFormDisabled(mockTarget))

describe('useFormDisabled', () => {
  const usePlanEnforcementMock = jest.spyOn(usePlanEnforcementHook, 'default')
  const useFeatureMock = jest.spyOn(useFeaturesHook, 'useFeature')
  const usePermissionMock = jest.spyOn(usePermissionHook, 'usePermission')

  beforeEach(() => {
    jest.resetAllMocks()

    usePlanEnforcementMock.mockReturnValue({ isPlanEnforcementEnabled: false, isFreePlan: false })
    useFeatureMock.mockReturnValue({ enabled: false })
    usePermissionMock.mockReturnValue([true])
  })

  test('it should disable the form when lacking permission', async () => {
    usePermissionMock.mockReturnValue([false])
    const { result } = renderHook()

    expect(result.current.disabled).toBeTruthy()
    expect(result.current.planEnforcementProps).toEqual({})
  })

  test('it should disable the form when plan enforcement is enabled, on a free plan and useFeature returns not enabled', async () => {
    usePlanEnforcementMock.mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: true })
    useFeatureMock.mockReturnValue({ enabled: false })
    const { result } = renderHook()

    expect(result.current.disabled).toBeTruthy()
    expect(result.current.planEnforcementProps).toEqual({
      featuresProps: {
        featuresRequest: {
          featureNames: [FeatureIdentifier.MAUS]
        }
      }
    })
  })

  test('it should not disable the form when plan enforcement is enabled, not on a free plan and useFeature returns enabled', async () => {
    usePlanEnforcementMock.mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: false })
    useFeatureMock.mockReturnValue({ enabled: true })
    const { result } = renderHook()

    expect(result.current.disabled).toBeFalsy()
    expect(result.current.planEnforcementProps).toEqual({
      featuresProps: {
        featuresRequest: {
          featureNames: [FeatureIdentifier.MAUS]
        }
      }
    })
  })

  test('it should not disable the form and return empty props when plan enforcement is disabled', async () => {
    usePlanEnforcementMock.mockReturnValue({ isPlanEnforcementEnabled: false, isFreePlan: true })
    useFeatureMock.mockReturnValue({ enabled: true })
    const { result } = renderHook()

    expect(result.current.disabled).toBeFalsy()
    expect(result.current.planEnforcementProps).toEqual({})
  })
})
