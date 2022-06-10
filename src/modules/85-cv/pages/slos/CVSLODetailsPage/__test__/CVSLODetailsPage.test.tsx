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
import CVSLODetailsPage from '../CVSLODetailsPage'
import {
  responseSLODashboardDetail,
  testWrapperProps,
  errorMessage,
  pathParams,
  responseSLODashboardDetail2
} from './CVSLODetailsPage.mock'

jest.mock('@cv/pages/slos/components/CVCreateSLO/CVCreateSLO', () => ({
  __esModule: true,
  default: function CVCreateSLO() {
    return <div>MOCKED - CVCreateSLO</div>
  }
}))

jest.mock('@cv/pages/slos/SLOCard/ErrorBudgetGauge', () => ({
  __esModule: true,
  default: function ErrorBudgetGauge() {
    return <span data-testid="error-budget-gauge" />
  }
}))

jest.mock('@cv/pages/slos/SLOCard/SLOCardContent', () => ({
  __esModule: true,
  default: function ErrorBudgetGauge() {
    return <span data-testid="slo-card-content" />
  }
}))

jest.mock(
  '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/ChangesTable',
  () => ({
    __esModule: true,
    default: function ErrorBudgetGauge() {
      return <span data-testid="changes-table" />
    }
  })
)

jest.mock(
  '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesSourceCard/ChangesSourceCard',
  () => ({
    __esModule: true,
    default: function ChangesSourceCard() {
      return <span data-testid="changes-source-card" />
    }
  })
)

const renderComponent = (): RenderResult => {
  return render(
    <TestWrapper {...testWrapperProps}>
      <CVSLODetailsPage />
    </TestWrapper>
  )
}

describe('Test cases for CVSLODetailsPage', () => {
  test('it should render the component with correct title and take a snapshot', () => {
    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockReturnValue({ data: responseSLODashboardDetail, loading: false } as any)

    const { container } = renderComponent()

    expect(container).toMatchSnapshot()

    expect(document.title).toBe('cv.srmTitle | cv.slos.title | harness')
  })

  test('it should handle the loading state', () => {
    jest.spyOn(cvServices, 'useGetSLODetails').mockReturnValue({ data: null, loading: true } as any)

    const { container } = renderComponent()

    expect(container.getElementsByClassName('bp3-skeleton')).toHaveLength(4)
  })

  test('is should handle retryOnError for both tabs', async () => {
    const refetch = jest.fn()

    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockReturnValue({ data: null, loading: false, error: { message: errorMessage }, refetch } as any)

    renderComponent()

    expect(screen.getByText('details')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(errorMessage)).toBeInTheDocument()

    userEvent.click(screen.getByText('Retry'))

    const { identifier, accountId, orgIdentifier, projectIdentifier } = pathParams

    await waitFor(() => {
      expect(cvServices.useGetSLODetails).toHaveBeenLastCalledWith({
        identifier,
        queryParams: {
          accountId,
          orgIdentifier,
          projectIdentifier
        }
      })
    })

    userEvent.click(screen.getByText('cv.monitoredServices.monitoredServiceTabs.configurations'))

    expect(screen.getByText('cv.monitoredServices.monitoredServiceTabs.configurations')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    userEvent.click(screen.getByText('Retry'))

    await waitFor(() => {
      expect(cvServices.useGetSLODetails).toHaveBeenLastCalledWith({
        identifier,
        queryParams: {
          accountId,
          orgIdentifier,
          projectIdentifier
        }
      })
    })
  })

  test('it should handle the suffix day/days', () => {
    jest
      .spyOn(cvServices, 'useGetSLODetails')
      .mockReturnValue({ data: responseSLODashboardDetail2, loading: false } as any)

    renderComponent()

    expect(screen.getByText('cv.slos.slis.type.availability')).toBeInTheDocument()
  })
})
