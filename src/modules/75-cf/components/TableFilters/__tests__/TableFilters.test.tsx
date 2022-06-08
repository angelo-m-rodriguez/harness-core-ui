/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import { TableFilters } from '../TableFilters'

describe('TableFilters', () => {
  const filters = [
    {
      queryProps: {},
      label: 'All Items',
      total: 12
    },
    {
      queryProps: { key: 'enabled', value: 'true' },
      label: 'Filter Two',
      total: 4
    },
    {
      queryProps: { key: 'status', value: 'active' },
      label: 'Filter Three',
      total: 8
    }
  ]

  test('TableFilters should render correctly the filters for feature flags', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TableFilters filters={filters} currentFilter={{}} updateTableFilter={jest.fn()} />
      </TestWrapper>
    )

    // check each filter label & total
    await waitFor(() => {
      // default selected
      const allItemsFilter = screen.getByText('All Items')
      const filter2 = screen.getByText('Filter Two')
      const filter3 = screen.getByText('Filter Three')

      expect(allItemsFilter).toBeInTheDocument()
      expect(allItemsFilter.nextSibling?.textContent).toBe('12')
      expect(allItemsFilter.closest('.Card--card')).toHaveClass('Card--selected')

      // Filter Two, not selected
      expect(filter2).toBeInTheDocument()
      expect(filter2.nextSibling?.textContent).toBe('4')
      expect(filter2.closest('.Card--card')).not.toHaveClass('Card--selected')

      // Filter Three, not selected
      expect(filter3).toBeInTheDocument()
      expect(filter3.nextSibling?.textContent).toBe('8')
      expect(filter3.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })

  test('The selected card should match the current filter', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TableFilters filters={filters} currentFilter={filters[1]} updateTableFilter={jest.fn()} />
      </TestWrapper>
    )

    const allItemsFilter = screen.getByText('All Items')
    const filter2 = screen.getByText('Filter Two')
    const filter3 = screen.getByText('Filter Three')
    // check each filter label & total
    await waitFor(() => {
      // default NOT selected
      expect(allItemsFilter).toBeInTheDocument()
      expect(allItemsFilter.nextSibling?.textContent).toBe('12')
      expect(allItemsFilter.closest('.Card--card')).not.toHaveClass('Card--selected')

      // Filter Two selected
      expect(filter2).toBeInTheDocument()
      expect(filter2.nextSibling?.textContent).toBe('4')
      expect(filter2.closest('.Card--card')).toHaveClass('Card--selected')

      // Filter Three, not selected
      expect(filter3).toBeInTheDocument()
      expect(filter3.nextSibling?.textContent).toBe('8')
      expect(filter3.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })
})
