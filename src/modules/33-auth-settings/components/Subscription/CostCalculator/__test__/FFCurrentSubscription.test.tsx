/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { FFCurrentSubscription } from '../FFCurrentSubscription'

describe('FFCurrentSubscription', () => {
  test('loading', () => {
    const usageAndLimitInfo = {
      limitData: {
        loadingLimit: true
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

    const { container, queryByText } = render(
      <TestWrapper>
        <FFCurrentSubscription usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )
    expect(queryByText('authSettings.costCalculator.developerLicenses')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('error', () => {
    const usageAndLimitInfo = {
      limitData: {
        loadingLimit: false
      },
      usageData: {
        usageErrorMsg: 'error'
      }
    }

    const { container, queryByText } = render(
      <TestWrapper>
        <FFCurrentSubscription usageAndLimitInfo={usageAndLimitInfo} />
      </TestWrapper>
    )
    expect(queryByText('authSettings.costCalculator.maus')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
