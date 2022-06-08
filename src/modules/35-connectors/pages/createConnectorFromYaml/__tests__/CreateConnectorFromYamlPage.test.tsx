/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import mockBranches from '@common/components/GitContextForm/__tests__/branchStatusMock.json'
import { gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import CreateConnectorFromYamlPage from '../CreateConnectorFromYamlPage'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))
const createConnector = jest.fn()

jest.mock('services/cd-ng', () => ({
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => ({ refetch: fetchBranches })),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useGetYamlSchema: jest.fn(() => ({})),
  useListGitSync: jest.fn().mockImplementation(() => gitConfigs),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))

describe('Test CreateConnectorFromYamlPage', () => {
  test('Dialog should show up to get git details from user for git-sync enabled projects', async () => {
    render(
      <TestWrapper
        path={routes.toCreateConnectorFromYaml({
          accountId: ':accountId',
          orgIdentifier: ':orgIdentifier',
          projectIdentifier: ':projectIdentifier',
          module: 'cd'
        })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }}
        defaultAppStoreValues={{ isGitSyncEnabled: true }}
      >
        <CreateConnectorFromYamlPage />
      </TestWrapper>
    )
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toBeTruthy()
  })
  test('No dialog should show up to get git details from user for non git-sync enabled projects', async () => {
    render(
      <TestWrapper
        path={routes.toCreateConnectorFromYaml({
          accountId: ':accountId',
          orgIdentifier: ':orgIdentifier',
          projectIdentifier: ':projectIdentifier',
          module: 'cd'
        })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }}
      >
        <CreateConnectorFromYamlPage />
      </TestWrapper>
    )
    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).not.toBeTruthy()
  })
})
