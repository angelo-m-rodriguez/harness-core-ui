/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Formik, FormikForm } from '@wings-software/uicore'
import { render, screen } from '@testing-library/react'
import * as cvService from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { SetupSourceTabs } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { SplunkMetricsHealthSource, SplunkMetricsHealthSourceProps } from '../SplunkMetricsHealthSource'
import { MockManualQueryData } from './SplunkMetricsHealthSource.mock'

jest.mock('../components/SplunkMetricsQueryViewer/SplunkMetricsQueryViewer', () => ({
  SplunkMetricsQueryViewer: function MockComponent() {
    return <div />
  }
}))

function WrapperComponent(props: SplunkMetricsHealthSourceProps): JSX.Element {
  return (
    <TestWrapper>
      <SetupSourceTabs {...props} tabTitles={['MapMetrics']}>
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

describe('Unit tests for SplunkMetricsHealthSource', () => {
  beforeAll(() => {
    jest.spyOn(cvService, 'useGetLabelNames').mockReturnValue({ data: { data: [] } } as any)
    jest.spyOn(cvService, 'useGetMetricNames').mockReturnValue({ data: { data: [] } } as any)
    jest.spyOn(cvService, 'useGetMetricPacks').mockReturnValue({ data: { data: [] } } as any)
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.only('Component renders', () => {
    const onSubmitMock = jest.fn()
    const { container } = render(<WrapperComponent data={MockManualQueryData} onSubmit={onSubmitMock} />)

    screen.debug(container, 30000)

    expect(2).toBeTruthy()
  })
})
