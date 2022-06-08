/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import ConnectorDetailsPage from '../ConnectorDetailsPage/ConnectorDetailsPage'
import connector from './mocks/get-connector-mock.json'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetOrganizationAggregateDTO: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: connector, refetch: jest.fn(), error: null }
  }),
  useUpdateConnector: jest.fn().mockImplementation(() => {
    return { data: connector, mutate: jest.fn() }
  }),
  useListSecretsV2: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetYamlSnippet: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetYamlSnippetMetadata: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetYamlSchema: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Connector DetailsPage Page Test', () => {
  test('Initial snapshot should match render', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/resources/connectors/:connectorId"
        pathParams={{ accountId: 'dummy', connectorId: 'connectorId' }}
      >
        <ConnectorDetailsPage />
      </TestWrapper>
    )
    await waitFor(() => expect(getByText('connectorsLabel')).not.toBeNull())
    expect(container).toMatchSnapshot()
  })
  test('Initial snapshot should match render at org level', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/org/:orgIdentifier/resources/connectors/:connectorId"
        pathParams={{ accountId: 'dummy', connectorId: 'connectorId', orgIdentifier: 'dummyOrg' }}
      >
        <ConnectorDetailsPage />
      </TestWrapper>
    )
    await waitFor(() => expect(getByText('connectorsLabel')).not.toBeNull())
    expect(container).toMatchSnapshot()
  })
})
