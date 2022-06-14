/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { PremiumSupport } from '../PremiumSupport'

describe('PremiumSupport', () => {
  test('switch to yearly', async () => {
    const setTimeMock = jest.fn()
    const onChangeMock = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <PremiumSupport
          value={false}
          setTime={setTimeMock}
          time={TIME_TYPE.MONTHLY}
          disabled={true}
          onChange={onChangeMock}
        />
      </TestWrapper>
    )
    fireEvent.click(getByText('authSettings.costCalculator.switchToYearly'))
    expect(setTimeMock).toHaveBeenCalledWith(TIME_TYPE.YEARLY)
  })

  test('toggle value', async () => {
    const setTimeMock = jest.fn()
    const onChangeMock = jest.fn()
    const { getByRole } = render(
      <TestWrapper>
        <PremiumSupport
          value={true}
          setTime={setTimeMock}
          time={TIME_TYPE.YEARLY}
          disabled={false}
          onChange={onChangeMock}
        />
      </TestWrapper>
    )
    fireEvent.click(getByRole('checkbox'))
    expect(onChangeMock).toHaveBeenCalledWith(false)
  })
})
