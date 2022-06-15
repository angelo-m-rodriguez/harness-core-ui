/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import TimeRangePicker from '../TimeRangePicker'

jest.mock('framework/strings', () => ({
  useStrings: () => ({
    getString: (key: string) => key
  })
}))

describe('Tests for Perspective Time Range Picker', () => {
  test('Should be able to render and open Perspective Time Range Picker', () => {
    const { getByText } = render(
      <TimeRangePicker timeRange={{ from: '2022-04-01', to: '2022-04-07' }} setTimeRange={jest.fn()} />
    )

    expect(getByText('2022-04-01 - 2022-04-07')).toBeDefined()

    act(() => {
      fireEvent.click(getByText('2022-04-01 - 2022-04-07'))
    })

    expect('ce.perspectives.timeRange.recommended').toBeDefined()
  })
})
