/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { useGetHarnessApprovalInstanceAuthorization, useGetApprovalInstance } from 'services/pipeline-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { HarnessApprovalView } from '../HarnessApprovalView/HarnessApprovalView'
import {
  mockApprovalDataLoading,
  mockAuthData,
  mockAuthDataLoading,
  mockApprovalData,
  mockApprovalDataError
} from './mock'

jest.mock('services/pipeline-ng', () => ({
  useGetHarnessApprovalInstanceAuthorization: jest.fn(),
  useGetApprovalInstance: jest.fn(),
  useAddHarnessApprovalActivity: () => mockAuthData
}))

describe('LOADING', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockApprovalDataLoading)
    // eslint-disable-next-line
    // @ts-ignore
    useGetHarnessApprovalInstanceAuthorization.mockImplementation(() => mockAuthDataLoading)
  })

  test('show spinner in loading state', () => {
    const { container } = render(<HarnessApprovalView step={{}} />)

    const spinner = container.querySelector('.bp3-spinner')
    expect(spinner).toBeTruthy()
  })

  test('show spinner when auth data is loading', () => {
    const { container } = render(<HarnessApprovalView step={{}} />)

    const spinner = container.querySelector('.bp3-spinner')
    expect(spinner).toBeTruthy()
  })

  test('show spinner when approvalInstanceId is absent', async () => {
    const { container } = render(
      <TestWrapper>
        <HarnessApprovalView
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

describe('SUCCESS', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockApprovalData)
    // eslint-disable-next-line
    // @ts-ignore
    useGetHarnessApprovalInstanceAuthorization.mockImplementation(() => mockAuthData)
  })
  test('show tabs when data is present and authorized', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <HarnessApprovalView
          step={{
            status: 'ResourceWaiting',
            // eslint-disable-next-line
            // @ts-ignore
            executableResponses: [{ async: { callbackIds: ['approvalInstanceId'] } }]
          }}
        />
      </TestWrapper>
    )
    await waitFor(() => expect(queryByText('common.approve')).toBeTruthy())

    act(() => {
      fireEvent.click(getByText('common.refresh'))
    })
    await waitFor(() => expect(mockApprovalData.refetch).toBeCalled())

    act(() => {
      fireEvent.click(getByText('common.approve'))
    })
    await waitFor(() => expect(mockAuthData.refetch).toBeCalled())
  })
})

describe('ERROR', () => {
  beforeAll(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useGetApprovalInstance.mockImplementation(() => mockApprovalDataError)
    // eslint-disable-next-line
    // @ts-ignore
    useGetHarnessApprovalInstanceAuthorization.mockImplementation(() => mockAuthData)
  })

  test('show tabs when data is present and authorized', async () => {
    const { container } = render(
      <TestWrapper>
        <HarnessApprovalView step={{}} />
      </TestWrapper>
    )

    await waitFor(() => expect(container.querySelector('.bp3-icon-error')).toBeTruthy())
  })
})
