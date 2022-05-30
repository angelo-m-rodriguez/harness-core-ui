/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getByRole, queryByRole, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from '@harness/uicore'
import { merge } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import type { Features } from 'services/cf'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import { mockFeatures } from '@cf/pages/target-group-detail/__tests__/mocks'
import { AddFlagsToTargetGroupDialogStatus } from '@cf/pages/target-group-detail/TargetGroupDetailPage.types'
import ListingWithSearchAndPagination, { ListingWithSearchAndPaginationProps } from '../ListingWithSearchAndPagination'

const mockFlagWithPagination: Features = {
  features: mockFeatures,
  pageSize: CF_DEFAULT_PAGE_SIZE,
  pageIndex: 0,
  pageCount: Math.ceil(mockFeatures.length / CF_DEFAULT_PAGE_SIZE),
  itemCount: mockFeatures.length
}

const renderComponent = (props: Partial<ListingWithSearchAndPaginationProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <Formik formName="test-form" initialValues={{ flags: {} }} onSubmit={jest.fn()}>
        <ListingWithSearchAndPagination
          flags={mockFlagWithPagination}
          isFlagAdded={jest.fn().mockReturnValue(false)}
          state={AddFlagsToTargetGroupDialogStatus.ok}
          onSearch={jest.fn()}
          setPageNumber={jest.fn()}
          {...props}
        />
      </Formik>
    </TestWrapper>
  )

describe('ListingWithSearchAndPagination', () => {
  describe('search', function () {
    test('it should call the onSearch callback when the user searches', async () => {
      const onSearchMock = jest.fn()
      const searchString = 'TEST SEARCH'

      renderComponent({ onSearch: onSearchMock })

      expect(onSearchMock).not.toHaveBeenCalled()

      await userEvent.type(screen.getByRole('searchbox'), searchString)

      await waitFor(() => expect(onSearchMock).toHaveBeenCalledWith(searchString))
    })
  })

  describe('pagination', function () {
    const getPaginationEl = (): HTMLElement | null => document.querySelector('[class*="Pagination"]')

    test('it should hide the pagination when the state is noSearchResults', async () => {
      renderComponent({ state: AddFlagsToTargetGroupDialogStatus.noSearchResults })

      expect(getPaginationEl()).not.toBeInTheDocument()
    })

    test.each([
      ['show', 1, true],
      ['show', 4, true],
      ['hide', 5, false],
      ['hide', 20, false]
    ])('it should %s the page numbers when there are %s pages', async (_, pageCount, inDocument) => {
      const flags = merge(mockFlagWithPagination, { pageCount })

      renderComponent({ flags })

      const el = queryByRole(getPaginationEl() as HTMLElement, 'button', { name: '1' })
      if (inDocument) {
        expect(el).toBeInTheDocument()
      } else {
        expect(el).not.toBeInTheDocument()
      }
    })

    test('it should call the setPageNumber callback when the page is changed', async () => {
      const flags = merge(mockFlagWithPagination, { pageCount: 2 })
      const setPageNumberMock = jest.fn()

      renderComponent({ flags, setPageNumber: setPageNumberMock })

      expect(setPageNumberMock).not.toHaveBeenCalled()

      userEvent.click(getByRole(getPaginationEl() as HTMLElement, 'button', { name: '2' }))

      await waitFor(() => {
        // sent page number is 0 indexed, so 1 lower than button clicked
        expect(setPageNumberMock).toHaveBeenCalledWith(1)
      })
    })
  })
})
