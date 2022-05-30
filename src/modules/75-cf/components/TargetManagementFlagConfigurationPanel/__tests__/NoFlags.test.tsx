/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import NoFlags, { NoFlagsProps } from '../NoFlags'

const renderComponent = (props: Partial<NoFlagsProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <NoFlags message="NO FLAGS" {...props} />
    </TestWrapper>
  )

describe('NoFlags', () => {
  test('it should display the correct message', async () => {
    const message = 'There are no flags to display'
    renderComponent({ message })

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  test('it should display a button and call the onClick callback when clicked', async () => {
    const buttonText = 'Add Flag'
    const onClickMock = jest.fn()
    renderComponent({ buttonText, onClick: onClickMock })

    const btn = screen.getByRole('button', { name: buttonText })
    expect(btn).toBeInTheDocument()
    expect(onClickMock).not.toHaveBeenCalled()

    userEvent.click(btn)

    await waitFor(() => expect(onClickMock).toHaveBeenCalled())
  })
})
