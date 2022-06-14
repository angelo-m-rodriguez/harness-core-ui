/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions } from '@common/constants/SubscriptionTypes'
import { FFNewSubscription } from '../FFNewSubscription'

describe('FFNewSubscription', () => {
  test('update licenses', async () => {
    const usageAndLimitInfo = {
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

    const { container, getByRole } = render(
      <TestWrapper>
        <FFNewSubscription plan={Editions.TEAM} usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )
    await fireEvent.change(getByRole('textbox'), { target: { value: '35' } })
    expect(container).toMatchSnapshot()
  })

  test('loading', () => {
    const usageAndLimitInfo = {
      limitData: {
        limit: {
          ff: {
            totalFeatureFlagUnits: 250,
            totalClientMAUs: 100000
          }
        }
      },
      usageData: {
        loadingUsage: true
      }
    }

    const { container } = render(
      <TestWrapper>
        <FFNewSubscription plan={Editions.TEAM} usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('error', () => {
    const refetchMock = jest.fn()
    const usageAndLimitInfo = {
      limitData: {
        limit: {
          ff: {
            totalFeatureFlagUnits: 250,
            totalClientMAUs: 100000
          }
        }
      },
      usageData: {
        usageErrorMsg: 'error',
        refetchUsage: refetchMock
      }
    }

    const { container, getByText } = render(
      <TestWrapper>
        <FFNewSubscription plan={Editions.TEAM} usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    fireEvent.click(getByText('Retry'))
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  test('dropdown', () => {
    const usageAndLimitInfo = {
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

    const { container } = render(
      <TestWrapper>
        <FFNewSubscription plan={Editions.TEAM} usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )

    const filterDropdown = container.querySelector('[data-testid="slider-dropdown"]')
    if (filterDropdown) {
      fireEvent.click(filterDropdown)
    }

    const listItem = document.body.getElementsByClassName('DropDown--menuItem')[0]
    fireEvent.click(listItem)
    expect(listItem).toHaveTextContent('100')
    expect(container).toMatchSnapshot()
  })
})
