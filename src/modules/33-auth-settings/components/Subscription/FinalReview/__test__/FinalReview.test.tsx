/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, waitFor, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, SubscribeViews, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import { FinalReview } from '../FinalReview'

describe('FinalReview', () => {
  test('render', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <FinalReview module="cf" setView={jest.fn()} plan={Editions.ENTERPRISE} paymentFreq={TIME_TYPE.MONTHLY} />
      </TestWrapper>
    )
    expect(getByText('authSettings.finalReview.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('footer', async () => {
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <FinalReview module="cf" setView={setViewMock} plan={Editions.TEAM} paymentFreq={TIME_TYPE.MONTHLY} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('back'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.CALCULATE)
    })
    act(() => {
      fireEvent.click(getByText('authSettings.finalReview.next'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.BILLINGINFO)
    })
  })
})
