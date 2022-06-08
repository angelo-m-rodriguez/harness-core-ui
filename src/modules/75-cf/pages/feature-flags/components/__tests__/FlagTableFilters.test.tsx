/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import mockFeatureFlags from '../../__tests__/mockFeatureFlags'
import { FlagTableFilters } from '../FlagTableFilters'

describe('FlagTableFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockImport('services/cf', {
      useGetAllFeatures: () => ({ data: mockFeatureFlags, refetch: jest.fn() })
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

  test('FlagTableFilters should render correctly the filters for feature flags', async () => {
    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FlagTableFilters features={mockFeatureFlags as any} currentFilter={{}} updateTableFilter={jest.fn()} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('cf.flagFilters.allFlags')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.enabled')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.permanent')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.last24')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.active')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.potentiallyStale')).toBeInTheDocument()
    })
  })

  test('Clicking a filter should refetch feature flags', async () => {
    const updateTableFilter = jest.fn()

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FlagTableFilters features={mockFeatureFlags as any} currentFilter={{}} updateTableFilter={updateTableFilter} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('cf.flagFilters.allFlags')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.enabled')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.permanent')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.last24')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.active')).toBeInTheDocument()
      expect(screen.getByText('cf.flagFilters.potentiallyStale')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('cf.flagFilters.permanent'))
    await waitFor(() => expect(updateTableFilter).toBeCalled())
  })
})
