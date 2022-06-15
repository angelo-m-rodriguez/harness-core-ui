/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import { FilterCard, FilterCardProps } from '../FilterCard'

const updateTableFilter = jest.fn()

const renderComponent = (props: Partial<FilterCardProps>): RenderResult => {
  return render(
    <TestWrapper>
      <FilterCard filter={{} as any} updateTableFilter={updateTableFilter} selected={false} {...props} />
    </TestWrapper>
  )
}

describe('FilterCard', () => {
  beforeEach(() => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('FilterCard should render the card values correctly', async () => {
    renderComponent({
      filter: {
        queryProps: { key: 'enabled', value: 'true' },
        label: 'cf.flagFilters.enabled',
        total: 4
      }
    })

    // check each filter label & total
    await waitFor(() => {
      const filterCard = screen.getByText('cf.flagFilters.enabled')
      expect(filterCard).toBeInTheDocument()
      expect(filterCard.nextSibling?.textContent).toBe('4')
      expect(filterCard.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })

  test('It should show card as selected when true', async () => {
    renderComponent({
      filter: {
        queryProps: { key: 'status', value: 'active' },
        label: 'cf.flagFilters.active',
        total: 6
      },
      selected: true
    })

    // check each filter label & total
    await waitFor(() => {
      const filterCard = screen.getByText('cf.flagFilters.active')
      expect(filterCard).toBeInTheDocument()
      expect(filterCard.nextSibling?.textContent).toBe('6')
      expect(filterCard.closest('.Card--card')).toHaveClass('Card--selected')
    })
  })

  test('It should call updateTableFilter on click of card', async () => {
    renderComponent({
      filter: {
        queryProps: { key: 'status', value: 'active' },
        label: 'cf.flagFilters.active',
        total: 6
      },
      selected: true
    })

    // check each filter label & total
    const filterCard = screen.getByText('cf.flagFilters.active')
    await waitFor(() => {
      expect(filterCard).toBeInTheDocument()
      expect(filterCard.closest('.Card--card')).toHaveClass('Card--selected')
    })

    await act(async () => {
      userEvent.click(filterCard)
    })

    await waitFor(() => expect(updateTableFilter).toBeCalled())
  })
})
