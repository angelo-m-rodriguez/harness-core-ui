/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { BillingInfo } from '../BillingInfo'

describe('BillingInfo', () => {
  test('render', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <BillingInfo module="cf" setView={jest.fn()} time={TIME_TYPE.MONTHLY} />
      </TestWrapper>
    )
    expect(getByText('authSettings.billing.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('footer', async () => {
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <BillingInfo module="cf" setView={setViewMock} time={TIME_TYPE.YEARLY} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('back'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.CALCULATE)
    })
    act(() => {
      fireEvent.click(getByText('authSettings.billing.next'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.FINALREVIEW)
    })
  })
})
