/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { buildGithubPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { mockResponse, mockSecret } from '@connectors/components/CreateConnector/GithubConnector/__test__/githubMocks'
import useCreateEditConnector from '../useCreateEditConnector'
import { githubFormData, gitHubPayload } from './mocks/githubData'

const updateConnector = jest.fn()
const createConnector = jest.fn()

jest.mock('services/cd-ng', () => ({
  validateTheIdentifierIsUniquePromise: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector })),
  useUpdateConnector: jest.fn().mockImplementation(() => ({ mutate: updateConnector })),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => jest.fn()),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Test hook for correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('useCreateEditConnector hook with create', async () => {
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper>{children}</TestWrapper>
    )
    const { result } = renderHook(
      () =>
        useCreateEditConnector({
          accountId: 'accountId',
          isEditMode: false,
          isGitSyncEnabled: false,
          afterSuccessHandler: jest.fn()
        }),
      { wrapper }
    )
    result.current.onInitiate({
      connectorFormData: githubFormData as any,
      buildPayload: buildGithubPayload
    })
    expect(updateConnector).toBeCalledTimes(0)
    expect(createConnector).toBeCalledTimes(1)
    expect(createConnector).toBeCalledWith(
      {
        connector: gitHubPayload
      },
      { queryParams: {} }
    )
  })
  test('useCreateEditConnector hook with update', async () => {
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper>{children}</TestWrapper>
    )
    const { result } = renderHook(
      () =>
        useCreateEditConnector({
          accountId: 'accountId',
          isEditMode: true,
          isGitSyncEnabled: false,
          afterSuccessHandler: jest.fn()
        }),
      { wrapper }
    )
    result.current.onInitiate({
      connectorFormData: githubFormData as any,
      buildPayload: buildGithubPayload
    })
    expect(updateConnector).toBeCalledTimes(1)
    expect(createConnector).toBeCalledTimes(0)
    expect(updateConnector).toBeCalledWith(
      {
        connector: gitHubPayload
      },
      { queryParams: {} }
    )
  })
})
