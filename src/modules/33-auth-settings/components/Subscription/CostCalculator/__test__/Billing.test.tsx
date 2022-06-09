/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import { useRetrieveProductPrices } from 'services/cd-ng/index'
import { Billing } from '../Billing'

jest.mock('services/cd-ng')
const useRetrieveProductPricesMock = useRetrieveProductPrices as jest.MockedFunction<any>

beforeEach(() => {
  jest.clearAllMocks()
})

const priceData = {
  data: {
    prices: [
      {
        priceId: 'price_1Kr5q6Iqk5P9Eha3D1tSUsgh',
        currency: 'usd',
        unitAmount: 9000,
        lookupKey: 'FF_ENTERPRISE_DEVELOPERS_MONTHLY',
        productId: 'prod_LYCEWCG8ktzYDz',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5q6Iqk5P9Eha3OAjIxtMT',
        currency: 'usd',
        unitAmount: 90000,
        lookupKey: 'FF_ENTERPRISE_DEVELOPERS_YEARLY',
        productId: 'prod_LYCEWCG8ktzYDz',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5rwIqk5P9Eha30PlTPbCz',
        currency: 'usd',
        unitAmount: 12000,
        lookupKey: 'FF_ENTERPRISE_MAU_MONTHLY',
        productId: 'prod_LYCGtHkNPO18pl',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5rwIqk5P9Eha3hhy0qeVW',
        currency: 'usd',
        unitAmount: 120000,
        lookupKey: 'FF_ENTERPRISE_MAU_YEARLY',
        productId: 'prod_LYCGtHkNPO18pl',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5mdIqk5P9Eha3fn1qSEmg',
        currency: 'usd',
        unitAmount: 5000,
        lookupKey: 'FF_TEAM_DEVELOPERS_MONTHLY',
        productId: 'prod_LYCAVe32XXzVlt',
        metaData: {
          type: 'DEVELOPERS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5mdIqk5P9Eha30wsoBxtZ',
        currency: 'usd',
        unitAmount: 50000,
        lookupKey: 'FF_TEAM_DEVELOPERS_YEARLY',
        productId: 'prod_LYCAVe32XXzVlt',
        metaData: {
          type: 'DEVELOPERS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSX',
        currency: 'usd',
        unitAmount: 9000,
        lookupKey: 'FF_TEAM_MAU_MONTHLY',
        productId: 'prod_LYCFgTjtkejp0K',
        metaData: {
          type: 'MAUS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5rQIqk5P9Eha3uzYZEPws',
        currency: 'usd',
        unitAmount: 90000,
        lookupKey: 'FF_TEAM_MAU_YEARLY',
        productId: 'prod_LYCFgTjtkejp0K',
        metaData: {
          type: 'MAUS'
        },
        active: true
      }
    ]
  }
}

describe('Billing', () => {
  test('Billing', async () => {
    const refetchMock = jest.fn()
    useRetrieveProductPricesMock.mockImplementation(() => {
      return {
        refetch: refetchMock,
        data: priceData,
        loading: false
      }
    })

    const quantities = {
      numberOfDevelopers: 234,
      numberOfMau: 34
    }
    const setPaymentFreqMock = jest.fn()
    const { container, getByText, queryByText } = render(
      <TestWrapper>
        <Billing
          module="cf"
          paymentFreq={TIME_TYPE.YEARLY}
          quantities={quantities}
          plan={Editions.ENTERPRISE}
          setDueToday={jest.fn()}
          setPaymentFreq={setPaymentFreqMock}
          prem
          setPrem={jest.fn()}
        />
      </TestWrapper>
    )
    expect(queryByText('authSettings.costCalculator.yearlySave')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
    fireEvent.click(getByText('Monthly'))
    await waitFor(() => expect(setPaymentFreqMock).toHaveBeenCalledWith(TIME_TYPE.MONTHLY))
  })
})
