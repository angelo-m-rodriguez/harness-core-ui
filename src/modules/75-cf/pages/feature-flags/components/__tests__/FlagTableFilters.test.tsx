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
import mockFeatureFlags from '../../__tests__/mockFeatureFlags'
import { FlagTableFilters, FlagTableFiltersProps } from '../FlagTableFilters'

const updateTableFilter = jest.fn()

const renderComponent = (props?: Partial<FlagTableFiltersProps>): RenderResult =>
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <FlagTableFilters
        features={mockFeatureFlags as any}
        currentFilter={{}}
        updateTableFilter={updateTableFilter}
        {...props}
      />
    </TestWrapper>
  )

const permanentFlagsFilter = {
  queryProps: { key: 'lifetime', value: 'permanent' },
  label: 'cf.flagFilters.permanent',
  total: mockFeatureFlags.featureCounts.totalPermanent,
  tooltipId: 'ff_flagFilters_permanentFlags'
}

describe('FlagTableFilters', () => {
  beforeAll(() => {
    mockImport('services/cf', {
      useGetAllFeatures: () => ({ data: mockFeatureFlags, loading: false, refetch: jest.fn() })
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

  test('FlagTableFilters should render correctly the filters for feature flags', async () => {
    renderComponent()

    const { featureCounts } = mockFeatureFlags

    await waitFor(() => {
      const filterCards = document.getElementsByClassName('Card--card')
      expect(filterCards).toHaveLength(6)
      expect(filterCards[0].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.allFlags')
      expect(filterCards[0].getElementsByTagName('p')[1].textContent).toBe(featureCounts.totalFeatures.toString())
      expect(filterCards[0].closest('.Card--card')).toHaveClass('Card--selected')
      expect(filterCards[1].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.enabled')
      expect(filterCards[1].getElementsByTagName('p')[1].textContent).toBe(featureCounts.totalEnabled.toString())
      expect(filterCards[2].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.permanent')
      expect(filterCards[2].getElementsByTagName('p')[1].textContent).toBe(featureCounts.totalPermanent.toString())
      expect(filterCards[3].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.last24')
      expect(filterCards[3].getElementsByTagName('p')[1].textContent).toBe(
        featureCounts.totalRecentlyAccessed.toString()
      )
      expect(filterCards[4].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.active')
      expect(filterCards[4].getElementsByTagName('p')[1].textContent).toBe(featureCounts.totalActive.toString())
      expect(filterCards[5].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.potentiallyStale')
      expect(filterCards[5].getElementsByTagName('p')[1].textContent).toBe(
        featureCounts.totalPotentiallyStale.toString()
      )
    })
  })

  test('It should apply selected style to the filter card that matches currentFilter', async () => {
    renderComponent({ currentFilter: permanentFlagsFilter })

    await waitFor(() => {
      expect(screen.getByText('cf.flagFilters.allFlags')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.enabled')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.permanent')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.permanent').closest('.Card--card')).toHaveClass('Card--selected')
      expect(screen.getByText('cf.flagFilters.last24')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.active')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.potentiallyStale')).toBeInTheDocument()
    })
  })

  test('It should call update filter method on click of a filter card', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('cf.flagFilters.allFlags')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.enabled')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.permanent')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.last24')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.active')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.potentiallyStale')).toBeInTheDocument()
    })

    await act(async () => {
      userEvent.click(screen.getByText('cf.flagFilters.permanent'))
    })
    await waitFor(() => expect(updateTableFilter).toBeCalledWith(permanentFlagsFilter))
  })

  test('It should display totals as 0 when there are no feature flags', async () => {
    renderComponent({ features: null })

    await waitFor(() => {
      const filterCards = document.getElementsByClassName('Card--card')
      expect(filterCards).toHaveLength(6)
      expect(filterCards[0].getElementsByTagName('p')[0].textContent).toBe('cf.flagFilters.allFlags')
      expect(filterCards[0].getElementsByTagName('p')[1].textContent).toBe('0')
      expect(filterCards[0].closest('.Card--card')).toHaveClass('Card--selected')
      expect(filterCards[1].getElementsByTagName('p')[1].textContent).toBe('0')
      expect(filterCards[2].getElementsByTagName('p')[1].textContent).toBe('0')
      expect(filterCards[3].getElementsByTagName('p')[1].textContent).toBe('0')
      expect(filterCards[4].getElementsByTagName('p')[1].textContent).toBe('0')
      expect(filterCards[5].getElementsByTagName('p')[1].textContent).toBe('0')
    })
  })
})
