/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { Billing } from '../Billing'

describe('Billing', () => {
  test('Billing', async () => {
    const { container, getByText, queryByText } = render(
      <TestWrapper>
        <Billing module="cf" initialTime={TIME_TYPE.YEARLY} />
      </TestWrapper>
    )
    expect(queryByText('authSettings.costCalculator.yearlySave')).not.toBeInTheDocument()
    fireEvent.click(getByText('Monthly'))
    await waitFor(() => {
      expect(getByText('authSettings.costCalculator.yearlySave')).toBeInTheDocument()
    })
    expect(container).toMatchSnapshot()
  })
})
