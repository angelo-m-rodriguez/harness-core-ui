/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, waitFor, screen } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { TestWrapper } from '@common/utils/testUtils'
import * as cvServices from 'services/cv'
import CVSLOsListingPage from '../CVSLOsListingPage'
import type { CVSLOsListingPageProps, SLOCardHeaderProps } from '../CVSLOsListingPage.types'
import {
  testWrapperProps,
  pathParams,
  errorMessage,
  dashboardWidgetsResponse,
  dashboardWidgetsContent,
  userJourneyResponse
} from './CVSLOsListingPage.mock'

jest.mock('@cv/pages/slos/SLOCard/SLOCardHeader.tsx', () => ({
  __esModule: true,
  default: function SLOCardHeader({ onDelete }: SLOCardHeaderProps) {
    return (
      <span data-testid="slo-card-header">
        <button onClick={() => onDelete(dashboardWidgetsContent.sloIdentifier, dashboardWidgetsContent.title)}>
          Delete
        </button>
      </span>
    )
  }
}))

jest.mock('@cv/pages/slos/SLOCard/SLOCardContent.tsx', () => ({
  __esModule: true,
  default: function SLOCardContent() {
    return <span data-testid="slo-card-content" />
  }
}))

const ComponentWrapper: React.FC<CVSLOsListingPageProps> = ({ monitoredService }) => {
  return (
    <TestWrapper {...testWrapperProps}>
      <CVSLOsListingPage monitoredService={monitoredService} />
    </TestWrapper>
  )
}

describe('CVSLOsListingPage', () => {
  let useGetAllJourneys: jest.SpyInstance
  let useGetSLODashboardWidgets: jest.SpyInstance
  let useDeleteSLOData: jest.SpyInstance
  let refetchUserJourneys: jest.Mock
  let refetchDashboardWidgets: jest.Mock

  beforeEach(() => {
    refetchUserJourneys = jest.fn()
    refetchDashboardWidgets = jest.fn()
    useGetAllJourneys = jest.spyOn(cvServices, 'useGetAllJourneys').mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    useGetSLODashboardWidgets = jest.spyOn(cvServices, 'useGetSLODashboardWidgets').mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch: refetchDashboardWidgets
    } as any)

    jest.spyOn(cvServices, 'useGetAllMonitoredServicesWithTimeSeriesHealthSources').mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cvServices, 'useGetServiceLevelObjectivesRiskCount').mockReturnValue({
      data: {
        data: {
          riskCounts: [
            {
              displayName: 'Healthy',
              identifier: 'HEALTHY',
              count: 2
            }
          ],
          totalCount: 3
        }
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    useDeleteSLOData = jest
      .spyOn(cvServices, 'useDeleteSLOData')
      .mockReturnValue({ mutate: jest.fn(), loading: false, error: null } as any)

    jest.spyOn(cvServices, 'useResetErrorBudget').mockReturnValue({ mutate: jest.fn(), loading: false } as any)
  })

  test('Without monitoredServiceIdentifier it should render the page headers', () => {
    render(<ComponentWrapper />)

    expect(screen.queryByText('cv.slos.title')).toBeInTheDocument()
    expect(screen.getByText('cv.slos.createSLO')).toBeInTheDocument()
    expect(document.title).toBe('cv.srmTitle | cv.slos.title | harness')
  })

  test('With monitoredServiceIdentifier it should not render with the page headers', () => {
    render(
      <ComponentWrapper
        monitoredService={{ identifier: 'monitored_service_identifier', name: 'monitored_service_identifier' }}
      />
    )

    expect(screen.queryByText('cv.slos.title')).not.toBeInTheDocument()
    expect(screen.getByText('cv.slos.createSLO')).toBeInTheDocument()
  })

  test('add new SLO should go to create page', async () => {
    render(<ComponentWrapper />)

    userEvent.click(screen.getByText('cv.slos.createSLO'))

    expect(screen.getByText(routes.toCVCreateSLOs({ ...pathParams, module: 'cv' }))).toBeInTheDocument()
  })

  test('it should have monitored service identifier query param when adding new SLO from MS details page', () => {
    render(
      <ComponentWrapper
        monitoredService={{ identifier: 'monitored_service_identifier', name: 'monitored_service_identifier' }}
      />
    )

    userEvent.click(screen.getByText('cv.slos.createSLO'))

    expect(
      screen.getByText(
        routes.toCVCreateSLOs({ ...pathParams, module: 'cv' }) +
          '?monitoredServiceIdentifier=monitored_service_identifier'
      )
    ).toBeInTheDocument()
  })

  test('it should show the loader while fetching the user journeys', () => {
    useGetAllJourneys.mockReturnValue({ data: {}, loading: true, error: null, refetch: jest.fn() })

    render(<ComponentWrapper />)

    expect(screen.getByText('Loading, please wait...')).toBeInTheDocument()
    expect(screen.queryByText('First Journey')).not.toBeInTheDocument()
  })

  test('it should show the loader while fetching the dashboard widgets', () => {
    useGetSLODashboardWidgets.mockReturnValue({ data: {}, loading: true, error: null, refetch: jest.fn() })

    render(<ComponentWrapper />)

    expect(screen.getByText('Loading, please wait...')).toBeInTheDocument()
    expect(screen.queryByTestId('slo-card-container')).not.toBeInTheDocument()
  })

  test('it should show the loader while deleting a widget', () => {
    useGetAllJourneys.mockReturnValue({ data: userJourneyResponse, loading: false, error: null, refetch: jest.fn() })
    useDeleteSLOData.mockReturnValue({ mutate: jest.fn(), loading: true, error: null })
    useGetSLODashboardWidgets.mockReturnValue({
      data: dashboardWidgetsResponse,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    render(<ComponentWrapper />)

    expect(screen.getByText('Loading, please wait...')).toBeInTheDocument()
    expect(screen.getAllByTestId('slo-card-container')).toHaveLength(1)
  })

  test('page retry should trigger both dashboard widget and user journey APIs when both returned error response', () => {
    useGetAllJourneys.mockReturnValue({
      data: {},
      loading: false,
      error: { message: errorMessage },
      refetch: refetchUserJourneys
    })
    useGetSLODashboardWidgets.mockReturnValue({
      data: {},
      loading: false,
      error: { message: errorMessage },
      refetch: refetchDashboardWidgets
    })

    render(<ComponentWrapper />)

    const onRetryButton = screen.getByRole('button', { name: 'Retry' })

    expect(onRetryButton).toBeInTheDocument()
    expect(refetchUserJourneys).not.toHaveBeenCalled()
    expect(refetchDashboardWidgets).not.toHaveBeenCalled()

    userEvent.click(onRetryButton)

    expect(refetchUserJourneys).toHaveBeenCalled()
    expect(refetchDashboardWidgets).toHaveBeenCalled()
  })

  test('page retry should only trigger the user journey API when dashboard widget API returned success response', () => {
    useGetAllJourneys.mockReturnValue({
      data: {},
      loading: false,
      error: { message: errorMessage },
      refetch: refetchUserJourneys
    })

    render(<ComponentWrapper />)

    const onRetryButton = screen.getByRole('button', { name: 'Retry' })

    expect(onRetryButton).toBeInTheDocument()
    expect(refetchUserJourneys).not.toHaveBeenCalled()

    userEvent.click(onRetryButton)

    expect(refetchUserJourneys).toHaveBeenCalled()
    expect(refetchDashboardWidgets).not.toHaveBeenCalled()
  })

  test('page retry should only trigger the dashboard widget API when userJourney API returned success response', () => {
    useGetSLODashboardWidgets.mockReturnValue({
      data: {},
      loading: false,
      error: { message: errorMessage },
      refetch: refetchDashboardWidgets
    })

    render(<ComponentWrapper />)

    const onRetryButton = screen.getByRole('button', { name: 'Retry' })

    expect(onRetryButton).toBeInTheDocument()
    expect(refetchDashboardWidgets).not.toHaveBeenCalled()

    userEvent.click(onRetryButton)

    expect(refetchUserJourneys).not.toHaveBeenCalled()
    expect(refetchDashboardWidgets).toHaveBeenCalled()
  })

  test('it should render page body no data state only if dashboard widgets and selected user journey are empty', () => {
    render(<ComponentWrapper />)

    expect(screen.getByText('cv.slos.noMatchingData')).toBeInTheDocument()
    expect(screen.queryByText('First Journey')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slo-card-container')).not.toBeInTheDocument()
  })

  test('it should only render dashboard widgets when user journeys are empty', () => {
    useGetSLODashboardWidgets.mockReturnValue({
      data: dashboardWidgetsResponse,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    render(<ComponentWrapper />)

    expect(screen.queryByText('First Journey')).not.toBeInTheDocument()
    expect(screen.getByTestId('slo-card-container')).toBeInTheDocument()
  })

  test('Risk filter select and deselect', async () => {
    useGetAllJourneys.mockReturnValue({ data: userJourneyResponse, loading: false, error: null, refetch: jest.fn() })
    useGetSLODashboardWidgets.mockReturnValue({
      data: dashboardWidgetsResponse,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    const { container } = render(<ComponentWrapper />)

    expect(container).toMatchSnapshot()

    expect(screen.getAllByTestId('slo-card-container')).toHaveLength(1)
    expect(screen.getAllByTestId('slo-card-header')).toHaveLength(1)
    expect(screen.getAllByTestId('slo-card-content')).toHaveLength(1)

    expect(container.querySelector('div[data-tooltip-id="Healthy_tooltip"]')?.parentElement).not.toHaveClass(
      'Card--selected'
    )

    userEvent.click(screen.getByText('Healthy'))
    expect(container.querySelector('div[data-tooltip-id="Healthy_tooltip"]')?.parentElement).toHaveClass(
      'Card--selected'
    )

    userEvent.click(screen.getByText('Healthy'))
    expect(container.querySelector('div[data-tooltip-id="Healthy_tooltip"]')?.parentElement).not.toHaveClass(
      'Card--selected'
    )
  })

  test('deleting a widget', async () => {
    const deleteMutate = jest.fn()
    const refetch = jest.fn()

    useGetAllJourneys.mockReturnValue({ data: userJourneyResponse, loading: false, error: null, refetch: jest.fn() })
    useDeleteSLOData.mockReturnValue({ mutate: deleteMutate, loading: false, error: null })
    useGetSLODashboardWidgets.mockReturnValue({
      data: dashboardWidgetsResponse,
      loading: false,
      error: null,
      refetch: refetch
    })

    render(<ComponentWrapper />)

    expect(screen.getByTestId('slo-card-container')).toBeInTheDocument()

    userEvent.click(screen.getByText('Delete'))

    expect(deleteMutate).toHaveBeenCalledWith(dashboardWidgetsContent.sloIdentifier)

    await waitFor(() => expect(refetch).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('cv.slos.sloDeleted')).toBeInTheDocument())
  })

  describe('Filters', () => {
    test('should check whether all the filters are present', () => {
      useGetSLODashboardWidgets.mockReturnValue({
        data: dashboardWidgetsResponse,
        loading: false,
        error: null,
        refetch: jest.fn()
      })
      render(<ComponentWrapper />)

      const userJourneyFilter = screen.getByTestId('userJourney-filter')
      const monitoredServicesFilter = screen.getByTestId('monitoredServices-filter')
      const sloTargetAndBudgetFilter = screen.getByTestId('sloTargetAndBudget-filter')
      const sliTypeFilter = screen.getByTestId('sliType-filter')

      expect(userJourneyFilter).toBeInTheDocument()
      expect(monitoredServicesFilter).toBeInTheDocument()
      expect(sloTargetAndBudgetFilter).toBeInTheDocument()
      expect(sliTypeFilter).toBeInTheDocument()
    })
  })
})
