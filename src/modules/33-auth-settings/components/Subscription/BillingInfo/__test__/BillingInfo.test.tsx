/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { SubscribeViews, TIME_TYPE, Editions } from '@common/constants/SubscriptionTypes'
import { useCreateFfSubscription } from 'services/cd-ng'
import { BillingInfo } from '../BillingInfo'

const subscriptionProps = {
  edition: Editions.ENTERPRISE,
  premiumSupport: false,
  paymentFreq: TIME_TYPE.MONTHLY,
  numberOfDevelopers: 25,
  numberOfMau: 12
}
const subscriptionData = {
  clientSecret: 'pi_3L9E7qIqk5P9Eha30B1Vpt0Z_secret_qXFya58HXLP0e3rIQEVzK3iyd'
}
const createNewSubscriptionMock = jest.fn(() => Promise.resolve({ data: subscriptionData }))

jest.mock('services/cd-ng')
const useCreateFfSubscriptionMock = useCreateFfSubscription as jest.MockedFunction<any>
useCreateFfSubscriptionMock.mockImplementation(() => {
  return {
    mutate: createNewSubscriptionMock,
    loading: false
  }
})

describe('BillingInfo', () => {
  test('render', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <BillingInfo module="cf" setView={jest.fn()} subscriptionProps={subscriptionProps} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(getByText('authSettings.billing.step')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })

  test('footer', async () => {
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <BillingInfo module="cf" setView={setViewMock} subscriptionProps={subscriptionProps} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('back'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.FINALREVIEW)
    })
    act(() => {
      fireEvent.click(getByText('authSettings.billing.subscribeNPay'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.SUCCESS)
    })
  })
})
