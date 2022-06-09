/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, SubscribeViews, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import * as useGetUsageAndLimit from '@common/hooks/useGetUsageAndLimit'
import { useRetrieveProductPrices } from 'services/cd-ng/index'
import { CostCalculator } from '../CostCalculator'

jest.mock('services/cd-ng')
const useRetrieveProductPricesMock = useRetrieveProductPrices as jest.MockedFunction<any>

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
useRetrieveProductPricesMock.mockImplementation(() => {
  return {
    refetch: jest.fn(),
    data: priceData,
    loading: false
  }
})

describe('CostCalculator', () => {
  test('render', () => {
    const subscriptionProps = {
      edition: Editions.TEAM,
      premiumSupport: false,
      paymentFreq: TIME_TYPE.MONTHLY,
      quantities: {
        cf: {
          numberOfDevelopers: 25,
          numberOfMau: 12
        }
      }
    }

    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
        />
      </TestWrapper>
    )
    expect(getByText('authSettings.costCalculator.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('not cf module', () => {
    const subscriptionProps = {
      edition: Editions.TEAM,
      premiumSupport: false,
      paymentFreq: TIME_TYPE.MONTHLY,
      quantities: {
        cf: {
          numberOfDevelopers: 25,
          numberOfMau: 12
        }
      }
    }
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cd"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
        />
      </TestWrapper>
    )
    expect(getByText('authSettings.costCalculator.step')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('yearly and enterprise', () => {
    const subscriptionProps = {
      edition: Editions.ENTERPRISE,
      premiumSupport: false,
      paymentFreq: TIME_TYPE.YEARLY,
      quantities: {
        cf: {
          numberOfDevelopers: 25,
          numberOfMau: 12
        }
      }
    }
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('footer', async () => {
    const subscriptionProps = {
      edition: Editions.ENTERPRISE,
      premiumSupport: false,
      paymentFreq: TIME_TYPE.YEARLY,
      quantities: {
        cf: {
          numberOfDevelopers: 25,
          numberOfMau: 12
        }
      }
    }
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={setViewMock}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
        />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('authSettings.costCalculator.next'))
    })
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.FINALREVIEW)
    })
  })
})
