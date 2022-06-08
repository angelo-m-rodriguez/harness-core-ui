/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { SetupSourceTabs } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import { sourceData } from './CustomiseHealthSource.mock'
import CustomiseHealthSource from '../CustomiseHealthSource'
import { LoadSourceByType } from '../CustomiseHealthSource.utils'

const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org'
  }
}

const onNextMock = jest.fn().mockResolvedValue(jest.fn())
const onPrevious = jest.fn().mockResolvedValue(jest.fn())

jest.mock('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs', () => ({
  ...(jest.requireActual('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs') as any),
  get SetupSourceTabsContext() {
    return React.createContext({
      tabsInfo: [],
      sourceData,
      onNext: onNextMock,
      onPrevious: onPrevious
    })
  }
}))

jest.mock('services/cd-ng', () => ({
  useGetConnector: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() }))
}))

jest.mock('services/cv', () => ({
  useSaveMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useUpdateMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetMetricPacks: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetAppDynamicsApplications: () => ({ loading: false, error: null, data: {}, refetch: jest.fn() }),
  useGetAppDynamicsTiers: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetAppdynamicsBaseFolders: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetAppdynamicsMetricDataByPath: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetAppdynamicsMetricStructure: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useFetchSampleData: jest.fn().mockImplementation(() => ({ loading: false, error: null, mutate: jest.fn() } as any)),
  useFetchTimeSeries: jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {} } as any))
}))
describe('CustomiseHealthSource', () => {
  test('Validate AppDynamics loads', () => {
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <SetupSourceTabs data={{}} tabTitles={['Tab1']} determineMaxTab={() => 1}>
          <CustomiseHealthSource onSuccess={jest.fn()} />
        </SetupSourceTabs>
      </TestWrapper>
    )
    // Appdynamcis loads
    expect(getByText('metricPacks')).toBeVisible()
    expect(getByText('cv.healthSource.connectors.AppDynamics.applicationsAndTiers')).toBeVisible()
  })

  test('should load Custom Health Source ', () => {
    sourceData.sourceType = 'CustomHealth'
    jest.mock('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs', () => ({
      ...(jest.requireActual('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs') as any),
      get SetupSourceTabsContext() {
        return React.createContext({
          tabsInfo: [],
          sourceData,
          onNext: onNextMock,
          onPrevious: onPrevious
        })
      }
    }))
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <LoadSourceByType type={sourceData?.sourceType} data={sourceData} onSubmit={jest.fn()} />
      </TestWrapper>
    )

    expect(getByText('cv.monitoringSources.prometheus.querySpecificationsAndMappings')).toBeVisible()
  })
})
