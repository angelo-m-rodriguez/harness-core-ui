/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { mockResponse, mockSecret } from '@connectors/components/CreateConnector/HelmRepoConnector/helmMock'
import OCIHelmConnector from '../OCIHelmConnector'

const createConnector = jest.fn()
const updateConnector = jest.fn()
const mockGetCallFunction = jest.fn()
jest.mock('services/portal', () => ({
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return []
  }),
  useGetDelegateFromId: jest.fn().mockImplementation(() => jest.fn()),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))
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

describe('Create Helm Connector  Wizard', () => {
  test('Should render form', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <OCIHelmConnector
          mock={mockResponse}
          isEditMode={false}
          setIsEditMode={jest.fn()}
          onClose={jest.fn()}
          orgIdentifier="testOrg"
          projectIdentifier="test"
          accountId="testAcc"
        />
      </TestWrapper>
    )

    expect(getByText('connectors.title.ociHelmConnector')).toBeDefined()
    expect(getByText('delegate.DelegateselectionLabel')).toBeDefined()
    expect(getByText('connectors.stepThreeName')).toBeDefined()

    const nameInput = container.querySelector('input[placeholder="common.namePlaceholder"]') as HTMLInputElement
    expect(nameInput.value).toBe('')
  })
})
