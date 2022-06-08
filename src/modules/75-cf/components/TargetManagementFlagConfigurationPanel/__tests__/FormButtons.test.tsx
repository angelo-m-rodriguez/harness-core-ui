/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import { Formik } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import { STATUS } from '../types'
import FormButtons, { FormButtonsProps } from '../FormButtons'

const renderComponent = (props: Partial<FormButtonsProps> = {}, initialErrors = {}): RenderResult =>
  render(
    <TestWrapper>
      <Formik initialValues={{ flags: {} }} onSubmit={jest.fn()} initialErrors={initialErrors}>
        <FormButtons state={STATUS.ok} {...props} />
      </Formik>
    </TestWrapper>
  )

describe('FormButtons', () => {
  test('it should display the submit and reset buttons', async () => {
    renderComponent()

    expect(screen.getByRole('button', { name: 'saveChanges' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'cancel' })).toBeEnabled()
    expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument()
  })

  test('it should disable the buttons and show the spinner if the state is submitting', async () => {
    renderComponent({ state: STATUS.submitting })

    expect(screen.getByRole('button', { name: 'saveChanges' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'cancel' })).toBeDisabled()
    expect(screen.getByTestId('saving-spinner')).toBeInTheDocument()
  })

  test('it should disable the save button if there are form errors', async () => {
    renderComponent({}, { flags: true })

    expect(screen.getByRole('button', { name: 'saveChanges' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'cancel' })).toBeEnabled()
    expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument()
  })
})
