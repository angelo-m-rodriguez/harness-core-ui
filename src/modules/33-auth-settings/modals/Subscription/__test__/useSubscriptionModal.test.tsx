/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import { Editions } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import * as useGetUsageAndLimit from '@common/hooks/useGetUsageAndLimit'
import { useSubscribeModal } from '../useSubscriptionModal'

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

const TestComponent = (): React.ReactElement => {
  const { openSubscribeModal } = useSubscribeModal()
  return (
    <>
      <button
        className="open"
        onClick={() => openSubscribeModal({ _plan: Editions.TEAM, _module: 'cf', _time: TIME_TYPE.MONTHLY })}
      />
    </>
  )
}

describe('useSubscriptionModal', () => {
  test('render', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('.open')!)
    await waitFor(() => {
      expect(getByText('authSettings.costCalculator.step')).toBeInTheDocument()
    })
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
  })

  test('BillingInfo', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('.open')!)
    fireEvent.click(getByText('authSettings.costCalculator.next'))
    await waitFor(() => {
      expect(getByText('authSettings.billing.step')).toBeInTheDocument()
    })
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
  })

  test('FinalReview', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('.open')!)
    fireEvent.click(getByText('authSettings.costCalculator.next'))
    fireEvent.click(getByText('authSettings.billing.next'))
    await waitFor(() => {
      expect(getByText('authSettings.finalReview.step')).toBeInTheDocument()
    })
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
  })

  test('Success', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('.open')!)
    fireEvent.click(getByText('authSettings.costCalculator.next'))
    fireEvent.click(getByText('authSettings.billing.next'))
    fireEvent.click(getByText('authSettings.billing.subscribeNPay'))
    await waitFor(() => {
      expect(getByText('authSettings.success.msg')).toBeInTheDocument()
    })
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
  })
})
