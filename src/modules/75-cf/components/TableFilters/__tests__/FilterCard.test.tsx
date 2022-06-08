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
import { FilterCard } from '../FilterCard'

describe('FilterCard', () => {
  test('FilterCard should render the card correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const filter = {
      queryProps: { key: 'enabled', value: 'true' },
      label: 'Filter Two',
      total: 4
    }

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FilterCard filter={filter} updateTableFilter={jest.fn()} selected={false} />
      </TestWrapper>
    )

    // check each filter label & total
    await waitFor(() => {
      const filter2 = screen.getByText('Filter Two')
      expect(filter2).toBeInTheDocument()
      expect(filter2.nextSibling?.textContent).toBe('4')
      expect(filter2.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })
  test('FilterCard should show card as selected when true', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })

    const filter = {
      queryProps: { key: 'enabled', value: 'true' },
      label: 'Filter Two',
      total: 4
    }

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FilterCard filter={filter} updateTableFilter={jest.fn()} selected={true} />
      </TestWrapper>
    )

    // check each filter label & total
    await waitFor(() => {
      const filter2 = screen.getByText('Filter Two')
      expect(filter2).toBeInTheDocument()
      expect(filter2.nextSibling?.textContent).toBe('4')
      expect(filter2.closest('.Card--card')).toHaveClass('Card--selected')
    })
  })
})
