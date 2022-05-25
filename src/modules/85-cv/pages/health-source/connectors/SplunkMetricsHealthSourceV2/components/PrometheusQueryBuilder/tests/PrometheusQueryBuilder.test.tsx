/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { Button, Container } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import type { useGetLabelNames, useGetMetricNames } from 'services/cv'
import { PrometheusQueryBuilder } from '../PrometheusQueryBuilder'
import { PrometheusMonitoringSourceFieldNames } from '../../../PrometheusHealthSource.constants'

const MockLabels = ['label1', 'label2', 'label3']
const MockMetricNames = ['metric1', 'metric2', 'metric3']

const showErrorMock = jest.fn()

jest.mock('@wings-software/uicore', () => ({
  ...jest.requireActual('@wings-software/uicore'),
  useToaster: jest.fn(() => ({ showError: showErrorMock, showSuccess: jest.fn(), clear: jest.fn() }))
}))

jest.mock('../components/PrometheusFilterSelector/PrometheusFilterSelector', () => ({
  PrometheusFilterSelector: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="updatePrometheusFilterSelector"
          onClick={() => props.onUpdateFilter({ label: 'newOption:newValue', value: 'newValue' })}
        >
          {props.label}
        </Button>
        <Button className="removePrometheusFilterSelector" onClick={() => props.onRemoveFilter(0)}>
          {`remove-${props.label}`}
        </Button>
      </Container>
    )
  }
}))

describe('Unit tests for PrometheusQueryBuilder', () => {
  beforeEach(() => {
    showErrorMock.mockClear()
  })

  test('Ensure when it is manual query no content is rendered', async () => {
    const { container } = render(
      <TestWrapper>
        <PrometheusQueryBuilder
          onUpdateFilter={jest.fn()}
          onRemoveFilter={jest.fn()}
          connectorIdentifier="1234_connector"
          labelNamesResponse={{ loading: true } as ReturnType<typeof useGetLabelNames>}
          metricNamesResponse={{ loading: true } as ReturnType<typeof useGetMetricNames>}
          isManualQuery={true}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(container.querySelector('[data-name="emptyForManualQuery"]')).not.toBeNull())
  })

  test('Ensure that update filter is called', async () => {
    const mockUpdateFilter = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <PrometheusQueryBuilder
          onUpdateFilter={mockUpdateFilter}
          onRemoveFilter={jest.fn()}
          connectorIdentifier="1234_connector"
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
          metricNamesResponse={{ data: MockMetricNames } as unknown as ReturnType<typeof useGetMetricNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.environmentFilter')).not.toBeNull())
    expect(getByText('cv.monitoringSources.prometheus.environmentFilter')).not.toBeNull()
    expect(getByText('cv.monitoringSources.prometheus.serviceFilter')).not.toBeNull()
    expect(getByText('cv.monitoringSources.prometheus.additionalFilter')).not.toBeNull()

    // click on service filter
    fireEvent.click(getByText('cv.monitoringSources.prometheus.serviceFilter'))
    await waitFor(() =>
      expect(mockUpdateFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.SERVICE_FILTER, {
        label: 'newOption:newValue',
        value: 'newValue'
      })
    )

    // click on environmentFilter
    fireEvent.click(getByText('cv.monitoringSources.prometheus.environmentFilter'))
    await waitFor(() =>
      expect(mockUpdateFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.ENVIRONMENT_FILTER, {
        label: 'newOption:newValue',
        value: 'newValue'
      })
    )

    // click on additionalFilter
    fireEvent.click(getByText('cv.monitoringSources.prometheus.additionalFilter'))
    await waitFor(() =>
      expect(mockUpdateFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.ADDITIONAL_FILTER, {
        label: 'newOption:newValue',
        value: 'newValue'
      })
    )
  })

  test('Ensure that remove filter is called', async () => {
    const mockRemoveFilter = jest.fn()
    const { getByText } = render(
      <TestWrapper>
        <PrometheusQueryBuilder
          onUpdateFilter={jest.fn()}
          onRemoveFilter={mockRemoveFilter}
          connectorIdentifier="1234_connector"
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
          metricNamesResponse={{ data: MockMetricNames } as unknown as ReturnType<typeof useGetMetricNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.environmentFilter')).not.toBeNull())
    expect(getByText('cv.monitoringSources.prometheus.environmentFilter')).not.toBeNull()
    expect(getByText('cv.monitoringSources.prometheus.serviceFilter')).not.toBeNull()
    expect(getByText('cv.monitoringSources.prometheus.additionalFilter')).not.toBeNull()

    // click on service filter
    fireEvent.click(getByText('remove-cv.monitoringSources.prometheus.serviceFilter'))
    await waitFor(() =>
      expect(mockRemoveFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.SERVICE_FILTER, 0)
    )

    // click on environmentFilter
    fireEvent.click(getByText('remove-cv.monitoringSources.prometheus.environmentFilter'))
    await waitFor(() =>
      expect(mockRemoveFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.ENVIRONMENT_FILTER, 0)
    )

    // click on additionalFilter
    fireEvent.click(getByText('remove-cv.monitoringSources.prometheus.additionalFilter'))
    await waitFor(() =>
      expect(mockRemoveFilter).toHaveBeenLastCalledWith(PrometheusMonitoringSourceFieldNames.ADDITIONAL_FILTER, 0)
    )
  })

  test('Ensure that error is displayed correctly', async () => {
    // error for label names
    const { rerender } = render(
      <TestWrapper>
        <PrometheusQueryBuilder
          onUpdateFilter={jest.fn()}
          onRemoveFilter={jest.fn()}
          connectorIdentifier="1234_connector"
          labelNamesResponse={
            { error: { data: { message: 'mockLabelError' } } } as unknown as ReturnType<typeof useGetLabelNames>
          }
          metricNamesResponse={{ data: MockMetricNames } as unknown as ReturnType<typeof useGetMetricNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(showErrorMock).toHaveBeenLastCalledWith('mockLabelError', 7000))

    // error for metric names
    rerender(
      <TestWrapper>
        <PrometheusQueryBuilder
          onUpdateFilter={jest.fn()}
          onRemoveFilter={jest.fn()}
          connectorIdentifier="1234_connector"
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
          metricNamesResponse={
            { error: { data: { message: 'mockMetricNameError' } } } as unknown as ReturnType<typeof useGetMetricNames>
          }
        />
      </TestWrapper>
    )

    await waitFor(() => expect(showErrorMock).toHaveBeenLastCalledWith('mockMetricNameError', 7000))
  })
})
