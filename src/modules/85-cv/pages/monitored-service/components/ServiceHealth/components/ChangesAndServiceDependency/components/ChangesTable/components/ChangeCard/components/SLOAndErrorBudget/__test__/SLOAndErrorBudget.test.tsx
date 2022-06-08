/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import * as cvServices from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { responseSLODashboardDetail } from '@cv/pages/slos/CVSLODetailsPage/__test__/CVSLODetailsPage.mock'
import SLOAndErrorBudget from '../SLOAndErrorBudget'
import { monitoredServiceChangeDetailSLOResponse } from './SLOAndErrorBudget.mock'
import type { SLOAndErrorBudgetProps } from '../SLOAndErrorBudget.types'

const monitoredServiceIdentifier = 'monitored_service_identifier'

jest.mock('services/cv', () => ({
  useGetMonitoredServiceChangeDetails: jest
    .fn()
    .mockImplementation(() => ({ data: monitoredServiceChangeDetailSLOResponse, loading: false })),
  useGetSLODetails: jest
    .fn()
    .mockImplementation(() => ({ data: responseSLODashboardDetail, loading: false, error: null, refetch: jest.fn() }))
}))

const renderComponent = (props?: Optional<SLOAndErrorBudgetProps>): RenderResult => {
  return render(
    <TestWrapper>
      <SLOAndErrorBudget
        monitoredServiceIdentifier={monitoredServiceIdentifier}
        startTime={1000}
        endTime={2000}
        eventTime={1500}
        eventType="HarnessCDNextGen"
        {...props}
      />
    </TestWrapper>
  )
}

describe('SLOAndErrorBudget', () => {
  test('should render the component', async () => {
    renderComponent()

    await waitFor(() =>
      expect(cvServices.useGetMonitoredServiceChangeDetails).toHaveBeenLastCalledWith({
        monitoredServiceIdentifier,
        queryParams: {}
      })
    )

    userEvent.click(screen.getByRole('button', { name: /SLO 1/i }))
    userEvent.click(screen.getByRole('button', { name: /SLO 2/i }))
    userEvent.click(screen.getByRole('button', { name: /SLO 3/i }))

    expect(screen.getByText('cv.pleaseSelectSLOToGetTheData')).toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: /SLO 4/i }))

    expect(screen.queryByText('cv.pleaseSelectSLOToGetTheData')).not.toBeInTheDocument()
    expect(screen.getByText('cv.noDataAvailableForTheCurrentSLOCycle')).toBeInTheDocument()
  })

  test('should handle the recalculation in progress loader', () => {
    const sloDashboardWidget = { ...responseSLODashboardDetail.data?.sloDashboardWidget, recalculatingSLI: true }
    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockImplementation(
        () => ({ data: { data: { sloDashboardWidget } }, loading: false, error: null, refetch: jest.fn() } as any)
      )

    renderComponent({ startTime: 1648857600000, endTime: 1649462400000 })

    expect(screen.queryByText('cv.noDataAvailableForTheCurrentSLOCycle')).not.toBeInTheDocument()
    expect(screen.getAllByText('cv.sloRecalculationInProgress')).toHaveLength(3)
  })

  test('should handle loading state of graph', () => {
    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockImplementation(() => ({ data: null, loading: true, error: null, refetch: jest.fn() } as any))

    const { container } = renderComponent()

    expect(container.querySelectorAll('span[data-icon="steps-spinner"]')).toHaveLength(3)
  })

  test('should handle error state of graph', () => {
    const errorMessage = 'TEST ERROR MESSAGE'
    const refetch = jest.fn()
    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockImplementation(() => ({ data: null, loading: false, error: { message: errorMessage }, refetch } as any))

    renderComponent()

    expect(screen.getAllByText(errorMessage)).toHaveLength(3)

    userEvent.click(screen.getAllByText('Retry')[0])

    expect(refetch).toBeCalled()
  })

  test('should handle no data of SLO widgets', () => {
    jest
      .spyOn(cvServices, 'useGetMonitoredServiceChangeDetails')
      .mockImplementation(() => ({ data: { resource: [] }, loading: false, error: null, refetch: jest.fn() } as any))

    renderComponent()

    expect(screen.getByText('cv.noSLOHasBeenCreated')).toBeInTheDocument()
  })

  test('should handle loading of SLO widgets', () => {
    jest
      .spyOn(cvServices, 'useGetMonitoredServiceChangeDetails')
      .mockImplementation(() => ({ data: null, loading: true, error: null, refetch: jest.fn() } as any))

    const { container } = renderComponent()

    expect(container.getElementsByClassName('bp3-skeleton')).toHaveLength(4)
  })

  test('should handle error of SLO widgets', () => {
    const errorMessage = 'TEST ERROR MESSAGE'
    jest
      .spyOn(cvServices, 'useGetMonitoredServiceChangeDetails')
      .mockImplementation(
        () => ({ data: null, loading: false, error: { message: errorMessage }, refetch: jest.fn() } as any)
      )

    renderComponent()

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})
