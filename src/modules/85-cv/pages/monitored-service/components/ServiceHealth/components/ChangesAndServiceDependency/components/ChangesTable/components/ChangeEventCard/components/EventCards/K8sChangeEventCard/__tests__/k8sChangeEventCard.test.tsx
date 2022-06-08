/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import type { UseGetReturn } from 'restful-react'
import { TestWrapper } from '@common/utils/testUtils'
import MonacoEditor from '@common/components/MonacoEditor/__mocks__/MonacoEditor'
import * as cv from 'services/cv'
import K8sChangeEventCard from '../K8sChangeEventCard'
import { mockK8sChangeResponse } from './K8sChangeEventCard.mock'

jest.mock('react-monaco-editor', () => ({
  MonacoDiffEditor: MonacoEditor
}))

jest.mock('@common/components/MonacoEditor/MonacoEditor', () => MonacoEditor)

jest.mock(
  '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/components/ChangeCard/components/SLOAndErrorBudget/SLOAndErrorBudget',
  () => ({
    __esModule: true,
    default: function SLOAndErrorBudget() {
      return <div data-testid="SLO-and-errorBudget" />
    }
  })
)

describe('Unit tests for K8sChangeEventCard', () => {
  test('Ensure data is properly rendered', async () => {
    jest.spyOn(cv, 'useGetMonitoredServiceOverAllHealthScore').mockReturnValue({
      data: {},
      refetch: jest.fn() as unknown
    } as UseGetReturn<any, any, any, any>)

    const { container, getByText } = render(
      <TestWrapper>
        <K8sChangeEventCard data={mockK8sChangeResponse} />
      </TestWrapper>
    )
    await waitFor(() =>
      expect(
        getByText(
          `Workload: ${mockK8sChangeResponse.metadata.workload} - Namespace: ${mockK8sChangeResponse.metadata.namespace}`
        )
      ).toBeInTheDocument()
    )

    // expand yaml
    fireEvent.click(container.querySelector('[data-testid="eventYAML-panel"]')!)
    await waitFor(() => expect(container.querySelector('[class*="main"] textarea')))

    // click diff button
    fireEvent.click(container.querySelector('[class*="main"] button')!)
    await waitFor(() => expect(document.body.querySelector('.bp3-dialog textarea')).not.toBeNull())
  })
})
