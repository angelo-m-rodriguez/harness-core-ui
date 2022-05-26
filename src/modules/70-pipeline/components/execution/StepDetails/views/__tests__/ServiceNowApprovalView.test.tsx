/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { useGetApprovalInstance } from 'services/pipeline-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { ServiceNowApprovalView } from '../ServiceNowApprovalView/ServiceNowApprovalView'
import { mockServiceNowApprovalData, mockServiceNowApprovalDataLoading, mockServiceNowApprovalDataError } from './mock'

jest.mock('services/pipeline-ng', () => ({
  useGetApprovalInstance: jest.fn()
}))

describe('LOADING', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockServiceNowApprovalDataLoading)
  })
  test('show spinner in loading state', () => {
    const { container } = render(<ServiceNowApprovalView step={{}} />)

    const spinner = container.querySelector('.bp3-spinner')
    expect(spinner).toBeTruthy()
  })

  test('show spinner when auth data is loading', () => {
    const { container } = render(<ServiceNowApprovalView step={{}} />)

    const spinner = container.querySelector('.bp3-spinner')
    expect(spinner).toBeTruthy()
  })
})

describe('SUCCESS', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockServiceNowApprovalData)
  })
  test('show tabs when data is present and authorized', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <ServiceNowApprovalView
          step={{
            status: 'ResourceWaiting',
            // eslint-disable-next-line
            // @ts-ignore
            executableResponses: [{ async: { callbackIds: ['approvalInstanceId'] } }]
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot('ServiceNow approval execution view')

    act(() => {
      fireEvent.click(getByText('common.refresh'))
    })
    await waitFor(() => expect(mockServiceNowApprovalData.refetch).toBeCalled())
  })

  test('show spinner when approvalInstanceId is absent', async () => {
    const { container } = render(
      <TestWrapper>
        <ServiceNowApprovalView
          step={{
            status: 'ResourceWaiting'
          }}
        />
      </TestWrapper>
    )

    const spinner = container.querySelector('.bp3-spinner')
    expect(spinner).toBeTruthy()
  })
})

describe('ERROR', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockServiceNowApprovalDataError)
  })

  test('show tabs when data is present and authorized', async () => {
    const { container } = render(
      <TestWrapper>
        <ServiceNowApprovalView step={{}} />
      </TestWrapper>
    )
    await waitFor(() => expect(container.querySelector('.bp3-icon-error')).toBeTruthy())
  })
})
