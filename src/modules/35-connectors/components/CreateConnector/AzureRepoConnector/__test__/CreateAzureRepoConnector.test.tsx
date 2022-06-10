/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, queryByText, queryByAttribute } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import { InputTypes, fillAtForm, clickSubmit } from '@common/utils/JestFormHelper'

import { GitConnectionType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import CreateAzureRepoConnector from '../CreateAzureRepoConnector'
import { mockResponse, mockSecret, usernameToken, usernameTokenWithAPIAccess, backButtonMock } from './azureRepoMocks'
import { backButtonTest } from '../../commonTest'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}
const updateConnector = jest.fn()
const createConnector = jest.fn()
jest.mock('services/portal', () => ({
  useGetDelegateTags: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegateFromId: jest.fn().mockImplementation(() => jest.fn()),
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
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

describe('Create AzureRepoconnector Wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    updateConnector.mockReset()
  })

  test('Creating AzureRepo connector step one', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )
    // fill step 1
    await act(async () => {
      clickSubmit(container)
    })

    expect(container).toMatchSnapshot() // Form validation for all required fields in step one
  })

  test('Creating AzureRepo connector step one and step two for HTTPS', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'url',
        value: 'http://dev.azure.com/'
      }
    ])

    expect(container).toMatchSnapshot() // matching snapshot with data
    await act(async () => {
      clickSubmit(container)
    })
    //step 2
    await act(async () => {
      clickSubmit(container)
    })
    expect(container).toMatchSnapshot() // Form validation for all required fields
    expect(createConnector).toBeCalledTimes(0)
  })

  test('Creating AzureRepo connector step two for SSH key', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    fillAtForm([
      {
        container,
        type: InputTypes.RADIOS,
        fieldId: 'connectionType',
        value: GitConnectionType.SSH
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'url',
        value: 'git@ssh.dev.azure.com/org/account'
      }
    ])

    expect(container).toMatchSnapshot() // matching snapshot with data
    await act(async () => {
      clickSubmit(container)
    })
    //step 2
    await act(async () => {
      clickSubmit(container)
    })
    expect(container).toMatchSnapshot() // Form validation for all required fields
    expect(createConnector).toBeCalledTimes(0)
  })

  test('form for edit http and authtype username-token without API access', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={usernameToken}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      clickSubmit(container)
    })

    await act(async () => {
      clickSubmit(container)
    })

    // step 3
    expect(queryByText(container, 'common.git.enableAPIAccess')).toBeTruthy()
    expect(container).toMatchSnapshot()

    // delegate selector step
    await act(async () => {
      clickSubmit(container)
    })

    // test connection
    await act(async () => {
      clickSubmit(container)
    })

    expect(updateConnector).toBeCalledWith(
      {
        connector: usernameToken
      },
      { queryParams: {} } // gitSync disabled for account level
    )
  })

  test('form for edit http and authtype username-token with API access', async () => {
    updateConnector.mockReset()
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={usernameTokenWithAPIAccess}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      clickSubmit(container)
    })

    await act(async () => {
      clickSubmit(container)
    })

    // test back button
    await act(async () => {
      fireEvent.click(container.querySelector('[data-name="azureRepoBackButton"]')!)
    })

    // go ahead again after testing back button
    await act(async () => {
      clickSubmit(container)
    })
    // step 3
    expect(queryByText(container, 'common.git.enableAPIAccess')).toBeTruthy()

    // delegate selector step
    await act(async () => {
      clickSubmit(container)
    })

    expect(container).toMatchSnapshot()

    // test connection
    await act(async () => {
      clickSubmit(container)
    })

    // expect(updateConnector).toBeCalledTimes(1)
    expect(updateConnector).toBeCalledWith(
      {
        connector: usernameTokenWithAPIAccess
      },
      { queryParams: {} }
    )
  })

  backButtonTest({
    Element: (
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureRepoConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={backButtonMock}
          mock={mockResponse}
        />
      </TestWrapper>
    ),
    backButtonSelector: '[data-name="commonGitBackButton"]',
    mock: backButtonMock
  })
})
