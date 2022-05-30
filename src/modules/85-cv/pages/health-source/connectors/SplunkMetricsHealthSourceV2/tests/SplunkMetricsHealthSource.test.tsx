/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { clone } from 'lodash-es'
import { Container } from '@wings-software/uicore'
import { fireEvent, render, waitFor, act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as cvService from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { SetupSourceTabs } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { SplunkMetricsHealthSource, SplunkMetricsHealthSourceProps } from '../SplunkMetricsHealthSource'
import { PrometheusMonitoringSourceFieldNames } from '../SplunkMetricsHealthSource.constants'
import {
  MockManualQueryData,
  MockManualQueryDataForCreate,
  MockManualQueryDataForIdentifierCheck,
  MockManualQueryDataWithoutIdentifier
} from './SplunkMetricsHealthSource.mock'

jest.mock('../components/SplunkMetricsQueryViewer/SplunkMetricsQueryViewer', () => ({
  SplunkMetricsQueryViewer: function MockComponent(props: any) {
    return (
      <Container>
        <button
          className="manualQuery"
          onClick={() => {
            props.onChange(PrometheusMonitoringSourceFieldNames.IS_MANUAL_QUERY, true)
          }}
        />
      </Container>
    )
  }
}))

function WrapperComponent(props: SplunkMetricsHealthSourceProps): JSX.Element {
  return (
    <TestWrapper>
      <SetupSourceTabs {...props} tabTitles={['MapMetrics']} determineMaxTab={() => 0}>
        <SplunkMetricsHealthSource data={props.data} onSubmit={props.onSubmit} />
      </SetupSourceTabs>
    </TestWrapper>
  )
}

jest.mock('@cv/hooks/IndexedDBHook/IndexedDBHook', () => ({
  useIndexedDBHook: jest.fn().mockReturnValue({
    isInitializingDB: false,
    dbInstance: {
      put: jest.fn(),
      get: jest.fn().mockReturnValue(undefined)
    }
  }),
  CVObjectStoreNames: {}
}))

describe('Unit tests for PrometheusHealthSource', () => {
  beforeAll(() => {
    jest.spyOn(cvService, 'useGetLabelNames').mockReturnValue({ data: { data: [] } } as any)
    jest.spyOn(cvService, 'useGetMetricNames').mockReturnValue({ data: { data: [] } } as any)
    jest.spyOn(cvService, 'useGetMetricPacks').mockReturnValue({ data: { data: [] } } as any)
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  xit('Ensure that when user hits manual query, the manual query banner is visible', async () => {
    const onSubmitMock = jest.fn()
    const { container, getByText } = render(<WrapperComponent data={MockManualQueryData} onSubmit={onSubmitMock} />)

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.customizeQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(3)

    fireEvent.click(container.querySelector('button[class*="manualQuery"]')!)
    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.isManualQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(2)

    act(() => {
      fireEvent.click(getByText('submit'))
    })

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(MockManualQueryData, {
        identifier: 'prometheus',
        name: 'prometheus',
        spec: {
          connectorRef: 'prometheusConnector',
          feature: 'apm',
          metricDefinitions: [
            {
              additionalFilters: [],
              aggregation: undefined,
              analysis: {
                deploymentVerification: { enabled: true, serviceInstanceFieldName: 'serviceInstanceFieldName' },
                liveMonitoring: { enabled: true },
                riskProfile: {
                  category: 'Infrastructure',
                  metricType: 'INFRA',
                  thresholdTypes: ['ACT_WHEN_LOWER', 'ACT_WHEN_HIGHER']
                }
              },
              envFilter: [],
              groupName: 'group1',
              identifier: 'My Identifier',
              isManualQuery: true,
              metricName: 'NoLongerManualQuery',
              prometheusMetric: undefined,
              query: 'count(container_cpu_load_average_10s{container="cv-demo",namespace="cv-demo"})',
              serviceFilter: [],
              sli: { enabled: true }
            }
          ]
        },
        type: 'Prometheus'
      })
    )
  })

  test('Ensure validation for Assign component works', async () => {
    const onSubmitMock = jest.fn()
    const cloneMockManualQueryData = clone(MockManualQueryData)
    cloneMockManualQueryData.healthSourceList[0].spec.metricDefinitions[0].analysis.deploymentVerification.enabled =
      false

    const { container, getByText } = render(
      <WrapperComponent data={cloneMockManualQueryData} onSubmit={onSubmitMock} />
    )

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.customizeQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(3)

    act(() => {
      fireEvent.click(container.querySelector('div[data-testid="assign-summary"]')!)
    })

    act(() => {
      fireEvent.click(getByText('submit'))
    })

    await waitFor(() => expect(container.querySelector('input[name="sli"')).toBeInTheDocument())

    await waitFor(() => expect(onSubmitMock).toHaveBeenCalledWith())
  })

  test('should render input with identifier field', () => {
    const onSubmitMock = jest.fn()
    const { container } = render(<WrapperComponent data={MockManualQueryData} onSubmit={onSubmitMock} />)

    expect(screen.getByText(/^id$/i)).toBeInTheDocument()
    expect(container.querySelector('.InputWithIdentifier--txtNameContainer')).toBeInTheDocument()
  })

  test('should show error when identifier is not given', async () => {
    const onSubmitMock = jest.fn()
    const { container, getByText } = render(
      <WrapperComponent data={MockManualQueryDataWithoutIdentifier} onSubmit={onSubmitMock} />
    )

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.customizeQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(3)

    act(() => {
      userEvent.click(container.querySelector('button[class*="manualQuery"]')!)
    })
    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.isManualQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(2)

    act(() => {
      userEvent.click(getByText('submit'))
    })

    expect(screen.getByText(/validation.identifierRequired/i)).toBeInTheDocument()
    expect(container.querySelector('.FormError--error')).toBeInTheDocument()

    expect(onSubmitMock).not.toHaveBeenCalled()
  })

  test('should show error when identifier is duplicate', async () => {
    const onSubmitMock = jest.fn()
    const { container, getByText, queryByText } = render(
      <WrapperComponent data={MockManualQueryDataForIdentifierCheck} onSubmit={onSubmitMock} />
    )

    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.customizeQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(3)

    act(() => {
      userEvent.click(container.querySelector('button[class*="manualQuery"]')!)
    })
    await waitFor(() => expect(getByText('cv.monitoringSources.prometheus.isManualQuery')).not.toBeNull())
    expect(container.querySelectorAll('[class*="Accordion--panel"]').length).toBe(2)

    act(() => {
      userEvent.click(getByText('submit'))
    })

    await waitFor(() =>
      expect(queryByText('cv.monitoringSources.prometheus.validation.metricIdentifierUnique')).toBeInTheDocument()
    )

    expect(onSubmitMock).not.toHaveBeenCalled()
  })

  test('should have placeholder value for identifier initially during create', () => {
    const onSubmitMock = jest.fn()
    render(<WrapperComponent data={MockManualQueryDataForCreate} onSubmit={onSubmitMock} />)

    expect(screen.getByText(/prometheus_metric/i)).toBeInTheDocument()
  })
})
