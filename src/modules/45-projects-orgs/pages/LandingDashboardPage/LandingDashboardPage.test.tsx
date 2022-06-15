/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { act, render, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import routes from '@common/RouteDefinitions'
import * as dashboardServices from 'services/dashboard-service'
import { TestWrapper } from '@common/utils/testUtils'
import overviewCountMock from '@projects-orgs/components/OverviewGlanceCards/__tests__/overviewMock.json'
import topProjectsData from '@projects-orgs/components/LandingDashboardSummaryWidget/__tests__/topProjectsMock.json'
import LandingDashboardPage from './LandingDashboardPage'

const OverViewCountError = {
  status: 'SUCCESS',
  data: {
    executionStatus: 'FAILED',
    executionMessage: 'Failed to fetched data'
  },
  metaData: {},
  correlationId: ''
}

const OverViewCountWithNoProjects = {
  status: 'SUCCESS',
  data: {
    executionStatus: 'SUCCESS',
    executionMessage: 'Successfully fetched data'
  },
  metaData: {},
  correlationId: ''
}

const getData = jest.fn(() => {
  return Promise.resolve(overviewCountMock)
})

const getTopProjectsData = jest.fn(() => {
  return Promise.resolve(topProjectsData)
})

jest
  .spyOn(dashboardServices, 'useGetTopProjects')
  .mockImplementation(() => ({ mutate: getTopProjectsData, refetch: getTopProjectsData, data: topProjectsData } as any))

describe('Landing Dashboard Page', () => {
  test('render landing page and welcome page by swtich', async () => {
    jest
      .spyOn(dashboardServices, 'useGetCounts')
      .mockImplementation(() => ({ mutate: getData, refetch: getData, data: overviewCountMock } as any))
    const { container, getByText } = render(
      <TestWrapper path={routes.toLandingDashboard({ accountId: ':accountId' })} pathParams={{ accountId: 'dummy' }}>
        <LandingDashboardPage />
      </TestWrapper>
    )
    await waitFor(() => expect('projectsOrgs.landingDashboard.dashboardTitle').not.toBeNull())

    expect(getByText('projectsOrgs.landingDashboard.dashboardTitle')).toBeDefined()
    expect(getByText('common.welcome')).toBeDefined()
    expect(getByText('projectsOrgs.landingDashboard.atAGlance')).toBeDefined()
    expect(container).toMatchSnapshot()
    // Switching to Welcome view
    act(() => {
      fireEvent.click(getByText('common.welcome'))
    })

    await waitFor(() => expect('projectsOrgs.landingDashboard.welcomeMessageWithoutName').not.toBeNull())
    expect(getByText('projectsOrgs.welcomeSecondLine')).toBeDefined()
    expect(getByText('projectLabel')).toBeDefined()
    expect(container).toMatchSnapshot()

    // Switching to Landing Page view
    act(() => {
      fireEvent.click(getByText('common.goBack'))
    })

    await waitFor(() => expect('projectsOrgs.landingDashboard.dashboardTitle').not.toBeNull())

    expect(getByText('projectsOrgs.landingDashboard.dashboardTitle')).toBeDefined()
    expect(getByText('common.welcome')).toBeDefined()
    expect(getByText('projectsOrgs.landingDashboard.atAGlance')).toBeDefined()
    await waitFor(() => expect(document.title).toEqual('dashboardLabel | harness'))
  })

  test('Render Page Error', async () => {
    jest
      .spyOn(dashboardServices, 'useGetCounts')
      .mockImplementation(() => ({ mutate: getData, refetch: getData, data: OverViewCountError } as any))
    const { getByText } = render(
      <TestWrapper path={routes.toLandingDashboard({ accountId: ':accountId' })} pathParams={{ accountId: 'dummy' }}>
        <LandingDashboardPage />
      </TestWrapper>
    )
    await waitFor(() => expect(getByText('Retry')).not.toBeNull())
    act(() => {
      fireEvent.click(getByText('Retry'))
    })

    await waitFor(() => expect(getData).toHaveBeenCalled())
  })

  test('Render Welcome Page when Lading Page api is success but no projects to show', async () => {
    jest
      .spyOn(dashboardServices, 'useGetCounts')
      .mockImplementation(() => ({ mutate: getData, refetch: getData, data: OverViewCountWithNoProjects } as any))
    const { container, getByText } = render(
      <TestWrapper path={routes.toLandingDashboard({ accountId: ':accountId' })} pathParams={{ accountId: 'dummy' }}>
        <LandingDashboardPage />
      </TestWrapper>
    )

    await waitFor(() => expect('projectsOrgs.landingDashboard.welcomeMessageWithoutName').not.toBeNull())
    expect(getByText('projectsOrgs.welcomeSecondLine')).toBeDefined()
    expect(getByText('projectLabel')).toBeDefined()
    expect(container).toMatchSnapshot()
  })
})
