/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import DialogFooter, { DialogFooterProps } from '../DialogFooter'
import { STATUS } from '../types'

const renderComponent = (
  props: Partial<DialogFooterProps> = {},
  initialValues: FormValues = { flags: { f1: { added: true, variation: 'v1' }, f2: { added: true, variation: 'v2' } } },
  initialErrors = {},
  onSubmit: () => void = jest.fn()
): RenderResult =>
  render(
    <TestWrapper>
      <Formik initialValues={initialValues} initialErrors={initialErrors} onSubmit={onSubmit}>
        <DialogFooter
          flags={{ itemCount: 30, pageCount: 2, pageSize: CF_DEFAULT_PAGE_SIZE, pageIndex: 0, features: [] }}
          state={STATUS.ok}
          setPageNumber={jest.fn()}
          onCancel={jest.fn()}
          {...props}
        />
      </Formik>
    </TestWrapper>
  )

describe('DialogFooter', () => {
  describe('pagination', () => {
    test.each([STATUS.ok, STATUS.loading, STATUS.submitting])(
      'it should display the pagination if there are flags and state is %s',
      async state => {
        renderComponent({ state })

        expect(document.querySelector('.pagination')).toBeInTheDocument()
      }
    )

    test.each([STATUS.initialLoading, STATUS.error, STATUS.noFlags, STATUS.noSearchResults])(
      'it should not display the pagination if there are flags and state is %s',
      async state => {
        renderComponent({ state })

        expect(document.querySelector('.pagination')).not.toBeInTheDocument()
      }
    )

    test('it should not show the pagination if there are no flags', async () => {
      renderComponent({ flags: undefined })

      expect(document.querySelector('.pagination')).not.toBeInTheDocument()
    })

    test('it should call the setPageNumber callback when the page is changed', async () => {
      const setPageNumberMock = jest.fn()
      renderComponent({ setPageNumber: setPageNumberMock })

      expect(setPageNumberMock).not.toHaveBeenCalled()

      userEvent.click(screen.getByRole('button', { name: /Next/ }))

      await waitFor(() => expect(setPageNumberMock).toHaveBeenCalledWith(1))
    })
  })

  describe('submit button', () => {
    test('it should disable the submit button when submitting', async () => {
      renderComponent({ state: STATUS.submitting })

      expect(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })).toBeDisabled()
    })

    test('it should disable the submit button when no flags have been added', async () => {
      renderComponent({}, { flags: {} })

      expect(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })).toBeDisabled()
    })

    test('it should disable the submit button when there are errors', async () => {
      renderComponent(
        {},
        { flags: { f1: { added: true, variation: 'v1' }, f2: { added: true, variation: 'v2' } } },
        { flags: { message: 'Test' } }
      )

      expect(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })).toBeDisabled()
    })

    test('it should enable the submit button and try to submit the form when not submitting, has flags and no errors', async () => {
      const onSubmitMock = jest.fn()
      renderComponent(
        {},
        { flags: { f1: { added: true, variation: 'v1' }, f2: { added: true, variation: 'v2' } } },
        {},
        onSubmitMock
      )

      const btn = screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })
      expect(btn).toBeEnabled()
      expect(onSubmitMock).not.toHaveBeenCalled()

      userEvent.click(btn)

      await waitFor(() => expect(onSubmitMock).toHaveBeenCalled())
    })
  })

  test('it should call the onCancel callback when the cancel button is clicked', async () => {
    const onCancelMock = jest.fn()
    renderComponent({ onCancel: onCancelMock })

    const btn = screen.getByRole('button', { name: 'cancel' })
    expect(btn).toBeInTheDocument()
    expect(onCancelMock).not.toHaveBeenCalled()

    userEvent.click(btn)

    await waitFor(() => expect(onCancelMock).toHaveBeenCalled())
  })

  describe('saving spinner', () => {
    test.each([STATUS.noFlags, STATUS.noSearchResults, STATUS.ok, STATUS.loading, STATUS.initialLoading, STATUS.error])(
      'it should not show the saving spinner when the state is %s',
      async state => {
        renderComponent({ state })

        expect(screen.queryByTestId('saving-spinner')).not.toBeInTheDocument()
      }
    )

    test('it should show the saving spinner when the state is SUBMITTING', async () => {
      renderComponent({ state: STATUS.submitting })

      expect(screen.getByTestId('saving-spinner')).toBeInTheDocument()
    })
  })
})
