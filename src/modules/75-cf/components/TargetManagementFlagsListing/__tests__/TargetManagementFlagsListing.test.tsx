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
import { mockFeatures } from '@cf/pages/target-group-detail/__tests__/mocks'
import TargetManagementFlagsListing, { TargetManagementFlagsListingProps } from '../TargetManagementFlagsListing'

const renderComponent = (props: Partial<TargetManagementFlagsListingProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <Formik initialValues={{ flags: {} }} onSubmit={jest.fn()}>
        <TargetManagementFlagsListing flags={mockFeatures} {...props} />
      </Formik>
    </TestWrapper>
  )

describe('TargetManagementFlagsListing', () => {
  test('it should display a row for each flag', async () => {
    renderComponent()

    expect(screen.getAllByRole('row')).toHaveLength(mockFeatures.length + 1)

    for (const flag of mockFeatures) {
      expect(screen.getByText(flag.name)).toBeInTheDocument()
    }
  })

  describe('includeAddFlagCheckbox', function () {
    test('it should not display the add flag checkbox if includeAddFlagCheckbox is not included', async () => {
      renderComponent()

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
      for (const input of document.querySelectorAll('input')) {
        expect(input).toBeEnabled()
      }
    })

    test('it should display the add flag checkbox if includeAddFlagCheckbox is set', async () => {
      renderComponent({ includeAddFlagCheckbox: true })

      expect(screen.queryAllByRole('checkbox')).toHaveLength(mockFeatures.length)
    })

    test('it should enable variations selection when the add flag checkbox is not checked', async () => {
      renderComponent({ includeAddFlagCheckbox: true, flags: [mockFeatures[0]] })

      for (const input of document.querySelectorAll('input:not([type="checkbox"])')) {
        expect(input).toBeDisabled()
      }

      userEvent.click(screen.getByRole('checkbox'))

      await waitFor(() => {
        for (const input of document.querySelectorAll('input:not([type="checkbox"])')) {
          expect(input).toBeEnabled()
        }
      })
    })
  })

  describe('onRowDelete', () => {
    test('it should not show the delete icon when onRowDelete is not passed', async () => {
      renderComponent()

      expect(screen.queryAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })).toHaveLength(
        0
      )
    })

    test('it should show the delete icon when onRowDelete not passed', async () => {
      renderComponent({ onRowDelete: jest.fn() })

      expect(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })).toHaveLength(
        mockFeatures.length
      )
    })
  })
})
