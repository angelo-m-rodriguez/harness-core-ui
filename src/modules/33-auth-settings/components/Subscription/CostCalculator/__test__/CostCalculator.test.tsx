/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, SubscribeViews } from '@common/constants/SubscriptionTypes'
import * as useGetUsageAndLimit from '@common/hooks/useGetUsageAndLimit'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { CostCalculator } from '../CostCalculator'

const useGetUsageAndLimitReturnMock = {
  limitData: {
    limit: {
      ff: {
        totalFeatureFlagUnits: 250,
        totalClientMAUs: 100000
      }
    }
  },
  usageData: {
    usage: {
      ff: {
        activeFeatureFlagUsers: {
          count: 20
        },
        activeClientMAUs: {
          count: 10000
        }
      }
    }
  }
}

jest.spyOn(useGetUsageAndLimit, 'useGetUsageAndLimit').mockReturnValue(useGetUsageAndLimitReturnMock)

const defaultLicenseStoreValues = {
  licenseInformation: {
    CF: {
      edition: Editions.FREE
    }
  }
}

describe('CostCalculator', () => {
  test('render', () => {
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator module="cf" setView={jest.fn()} newPlan={Editions.TEAM} time={TIME_TYPE.MONTHLY} />
      </TestWrapper>
    )
    expect(getByText('authSettings.costCalculator.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('not cf module', () => {
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator module="cd" setView={jest.fn()} newPlan={Editions.TEAM} time={TIME_TYPE.MONTHLY} />
      </TestWrapper>
    )
    expect(getByText('authSettings.costCalculator.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('yearly and enterprise', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator module="cf" setView={jest.fn()} newPlan={Editions.ENTERPRISE} time={TIME_TYPE.YEARLY} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('footer', async () => {
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator module="cf" setView={setViewMock} newPlan={Editions.ENTERPRISE} time={TIME_TYPE.YEARLY} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('authSettings.costCalculator.next'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.BILLINGINFO)
    })
  })
})
