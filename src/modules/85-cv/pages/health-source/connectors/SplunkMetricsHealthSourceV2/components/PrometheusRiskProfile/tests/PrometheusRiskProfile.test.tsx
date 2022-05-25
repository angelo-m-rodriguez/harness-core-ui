/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Classes } from '@blueprintjs/core'
import type { useGetMetricPacks, useGetLabelNames } from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { PrometheusRiskProfile } from '../PrometheusRiskProfile'

const showErrorMock = jest.fn()

jest.mock('@wings-software/uicore', () => ({
  ...jest.requireActual('@wings-software/uicore'),
  useToaster: jest.fn(() => ({ showError: showErrorMock, showSuccess: jest.fn(), clear: jest.fn() }))
}))

const MockLabels = ['label1', 'label2', 'label3']
const MockResponse = {
  loading: false,
  error: '',
  data: {
    metaData: {},
    resource: [
      {
        uuid: '6LIAtyPGSfexTIr-utVxCg',
        accountId: 'kmpySmUISimoRrJL6NL73w',
        orgIdentifier: 'harness_test',
        projectIdentifier: 'raghu_p',
        dataSourceType: 'PROMETHEUS',
        identifier: 'Errors',
        category: 'Errors',
        metrics: [
          {
            name: 'Errors',
            type: 'ERROR',
            path: null,
            validationPath: null,
            responseJsonPath: null,
            validationResponseJsonPath: null,
            thresholds: [],
            included: false
          }
        ],
        thresholds: null
      },
      {
        uuid: 'Ld3-RmvdQXWRfsYNoyqerw',
        accountId: 'kmpySmUISimoRrJL6NL73w',
        orgIdentifier: 'harness_test',
        projectIdentifier: 'raghu_p',
        dataSourceType: 'PROMETHEUS',
        identifier: 'Infrastructure',
        category: 'Infrastructure',
        metrics: [
          {
            name: 'Infrastructure',
            type: 'INFRA',
            path: null,
            validationPath: null,
            responseJsonPath: null,
            validationResponseJsonPath: null,
            thresholds: [],
            included: false
          }
        ],
        thresholds: null
      },
      {
        uuid: 'Z1CmKPBkQ0GEQpwlpWGDHA',
        accountId: 'kmpySmUISimoRrJL6NL73w',
        orgIdentifier: 'harness_test',
        projectIdentifier: 'raghu_p',
        dataSourceType: 'PROMETHEUS',
        identifier: 'Performance',
        category: 'Performance',
        metrics: [
          {
            name: 'Other',
            type: 'ERROR',
            path: null,
            validationPath: null,
            responseJsonPath: null,
            validationResponseJsonPath: null,
            thresholds: [],
            included: false
          },
          {
            name: 'Throughput',
            type: 'THROUGHPUT',
            path: null,
            validationPath: null,
            responseJsonPath: null,
            validationResponseJsonPath: null,
            thresholds: [],
            included: false
          },
          {
            name: 'Response Time',
            type: 'RESP_TIME',
            path: null,
            validationPath: null,
            responseJsonPath: null,
            validationResponseJsonPath: null,
            thresholds: [],
            included: false
          }
        ],
        thresholds: null
      }
    ],
    responseMessages: []
  },
  cancel: jest.fn(),
  absolutePath: '',
  response: {},
  refetch: jest.fn()
} as unknown as ReturnType<typeof useGetMetricPacks>

describe('Unit tests for PrometheusRiskProfile', () => {
  beforeEach(() => {
    showErrorMock.mockClear()
  })
  test('Ensure that api result is rendered correctly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PrometheusRiskProfile
          metricPackResponse={MockResponse}
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('Performance/Other')).not.toBeNull())
    getByText('Performance/Throughput')
    getByText('Errors')
    getByText('Infrastructure')
    getByText('Performance/Response Time')
  })

  test('Ensure that loading state is rendered correctly', async () => {
    const { container } = render(
      <TestWrapper>
        <PrometheusRiskProfile
          metricPackResponse={{ loading: true } as unknown as ReturnType<typeof useGetMetricPacks>}
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(container.querySelectorAll(`.${Classes.SKELETON}`).length).toBe(4))
  })

  test('Ensure that when an error occurs, the error is displayed', async () => {
    render(
      <TestWrapper>
        <PrometheusRiskProfile
          metricPackResponse={
            { error: { data: { detailedMessage: 'someError' } } } as unknown as ReturnType<typeof useGetMetricPacks>
          }
          labelNamesResponse={{ data: MockLabels } as unknown as ReturnType<typeof useGetLabelNames>}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(showErrorMock).toBeCalledWith('someError', 7000))
  })
})
