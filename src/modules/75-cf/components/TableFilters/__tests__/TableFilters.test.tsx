/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import type { StringKeys } from 'framework/strings'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import { TableFilters, TableFiltersProps } from '../TableFilters'

const filters = [
  {
    queryProps: {},
    label: 'cf.pathTo.testFilter1' as StringKeys,
    total: 12
  },
  {
    queryProps: { key: 'enabled', value: 'true' },
    label: 'cf.pathTo.testFilter2' as StringKeys,
    total: 4
  },
  {
    queryProps: { key: 'status', value: 'active' },
    label: 'cf.pathTo.testFilter3' as StringKeys,
    total: 8
  }
]

const renderComponent = (props: Partial<TableFiltersProps>): RenderResult =>
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <TableFilters filters={filters} currentFilter={{}} updateTableFilter={jest.fn()} {...props} />
    </TestWrapper>
  )

describe('TableFilters', () => {
  beforeAll(() => {
    mockImport('services/cf', {
      useGetAllFeatures: () => ({ data: undefined, refetch: jest.fn() })
    })

    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({
        data: mockEnvironments,
        loading: false,
        error: undefined,
        refetch: jest.fn()
      })
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  test('TableFilters should render correctly the filters for feature flags', async () => {
    renderComponent({})

    // check each filter label & total
    await waitFor(() => {
      const filter1 = screen.getByText(filters[0].label)
      const filter2 = screen.getByText(filters[1].label)
      const filter3 = screen.getByText(filters[2].label)

      // Three cards should be rendered
      expect(document.getElementsByClassName('Card--card')).toHaveLength(3)

      expect(filter1).toBeInTheDocument()
      expect(filter1.nextSibling?.textContent).toBe(filters[0].total.toString())
      // default selected
      expect(filter1.closest('.Card--card')).toHaveClass('Card--selected')

      // Filter Two, not selected
      expect(filter2).toBeInTheDocument()
      expect(filter2.nextSibling?.textContent).toBe(filters[1].total.toString())
      expect(filter2.closest('.Card--card')).not.toHaveClass('Card--selected')

      // Filter Three, not selected
      expect(filter3).toBeInTheDocument()
      expect(filter3.nextSibling?.textContent).toBe(filters[2].total.toString())
      expect(filter3.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })

  test('The selected card should match the current filter', async () => {
    renderComponent({ currentFilter: filters[1] })

    const filter1 = screen.getByText(filters[0].label)
    const filter2 = screen.getByText(filters[1].label)
    const filter3 = screen.getByText(filters[2].label)
    // check each filter label & total
    await waitFor(() => {
      expect(document.getElementsByClassName('Card--card')).toHaveLength(3)
      // default NOT selected
      expect(filter1.closest('.Card--card')).not.toHaveClass('Card--selected')

      // Filter Two selected
      expect(filter2.closest('.Card--card')).toHaveClass('Card--selected')

      // Filter Three not selected
      expect(filter3.closest('.Card--card')).not.toHaveClass('Card--selected')
    })
  })

  test('It renders no cards if filters array empty', async () => {
    renderComponent({ filters: [], currentFilter: filters[1] })

    await waitFor(() => {
      expect(document.getElementsByClassName('Card--card')).toHaveLength(0)
    })
  })
})
