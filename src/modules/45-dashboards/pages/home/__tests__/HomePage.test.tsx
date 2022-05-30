/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import * as customDashboardServices from 'services/custom-dashboards'
import * as dashboardsContext from '../../DashboardsContext'
import HomePage from '../HomePage'

const renderComponent = (): RenderResult => {
  return render(
    <TestWrapper
      path={routes.toCustomDashboardHome({ ...accountPathProps, folderId: ':folderId' })}
      pathParams={{ accountId: 'accountId', folderId: 'folder' }}
    >
      <HomePage />
    </TestWrapper>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(customDashboardServices, 'useGetFolderDetail')
      .mockReturnValue({ data: { resource: 'folder_name' }, refetch: jest.fn() } as any)
    jest.spyOn(customDashboardServices, 'useSearch').mockReturnValue({ data: { resource: '' }, loading: false } as any)
    jest
      .spyOn(customDashboardServices, 'useGetAllTags')
      .mockReturnValue({ data: { resource: { tags: 'first_tag,other_tag' } }, loading: false } as any)
    jest.spyOn(dashboardsContext, 'useDashboardsContext').mockReturnValue({ includeBreadcrumbs: jest.fn() } as any)
  })

  test('it should show an empty message when there are no dashboards', () => {
    renderComponent()

    expect(screen.getByText('dashboardLabel')).toBeInTheDocument()
  })

  test('it should change the sort order when a sort option is clicked', async () => {
    renderComponent()

    const sortByButton = screen.getByRole('button', { name: 'dashboards.sortBy Select Option chevron-down' })
    userEvent.click(sortByButton)
    await waitFor(() => expect(screen.getByText('Most Viewed')).toBeInTheDocument())

    const mostViewedButton = screen.getByText('Most Viewed')
    userEvent.click(mostViewedButton)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'dashboards.sortBy Most Viewed chevron-down' })).toBeInTheDocument()
    )
  })

  test('it should display selected tags when clicked', async () => {
    renderComponent()

    const tagButton = screen.getByRole('button', { name: 'first_tag' })
    userEvent.click(tagButton)

    await waitFor(() => expect(screen.getByRole('button', { name: 'filters.clearAll' })).toBeInTheDocument())
  })
})
