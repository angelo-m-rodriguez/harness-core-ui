/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, queryByText } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import CreateK8sConnector from '../CreateK8sConnector'
import { backButtonTest } from '../../commonTest'
import {
  mockResponse,
  mockSecret,
  usernamePassword,
  serviceAccount,
  oidcMock,
  clientKeyMock,
  backButtonMock
} from './k8Mocks'

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

const masterUrlComponentText = 'connectors.k8.delegateOutClusterInfo'

describe('Create k8 connector Wizard', () => {
  test('should form for authtype username', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateK8sConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )
    // fill step 1
    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'dummy k8' }
      })
    })

    expect(container).toMatchSnapshot()
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })
    // step 2

    expect(container).toMatchSnapshot()
  })

  test('should form for edit authtype username', async () => {
    updateConnector.mockReset()
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'dummyAccount', projectIdentifier: 'dummyProject', orgIdentifier: 'dummyOrg' }}
      >
        <CreateK8sConnector {...commonProps} isEditMode={true} connectorInfo={usernamePassword} mock={mockResponse} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })
    // step 2
    expect(queryByText(container, masterUrlComponentText)).toBeTruthy()
    expect(container).toMatchSnapshot()

    //updating connector
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    expect(updateConnector).toBeCalledWith(
      {
        connector: usernamePassword
      },
      { queryParams: {} }
    )
  })

  test('should form for edit authtype serviceAccount', async () => {
    updateConnector.mockReset()
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'dummyAccount', projectIdentifier: 'dummyProject', orgIdentifier: 'dummyOrg' }}
      >
        <CreateK8sConnector {...commonProps} isEditMode={true} connectorInfo={serviceAccount} mock={mockResponse} />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })
    // step 2
    expect(queryByText(container, masterUrlComponentText)).toBeTruthy()
    expect(container).toMatchSnapshot()

    //updating connector
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    expect(updateConnector).toBeCalledWith(
      {
        connector: serviceAccount
      },
      { queryParams: {} }
    )
  })

  test('should form for edit authtype OIDC', async () => {
    updateConnector.mockReset()
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'dummyAccount', projectIdentifier: 'dummyProject', orgIdentifier: 'dummyOrg' }}
      >
        <CreateK8sConnector {...commonProps} isEditMode={true} connectorInfo={oidcMock} mock={mockResponse} />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })
    // step 2
    expect(queryByText(container, masterUrlComponentText)).toBeTruthy()
    expect(container).toMatchSnapshot()
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    expect(updateConnector).toBeCalledWith(
      {
        connector: oidcMock
      },
      { queryParams: {} }
    )
  })

  backButtonTest({
    Element: (
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateK8sConnector {...commonProps} isEditMode={true} connectorInfo={backButtonMock} mock={mockResponse} />
      </TestWrapper>
    ),
    backButtonSelector: '[data-name="k8sBackButton"]',
    mock: backButtonMock
  })
})

test('should render form for edit authtype clientKey', async () => {
  updateConnector.mockReset()
  const { container } = render(
    <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
      <CreateK8sConnector {...commonProps} isEditMode={true} connectorInfo={clientKeyMock} mock={mockResponse} />
    </TestWrapper>
  )

  await act(async () => {
    fireEvent.click(container.querySelector('button[type="submit"]')!)
  })

  expect(container).toMatchSnapshot()
  expect(queryByText(container, masterUrlComponentText)).toBeTruthy()

  //updating connector
  await act(async () => {
    fireEvent.click(container.querySelector('button[type="submit"]')!)
  })

  await act(async () => {
    fireEvent.click(container.querySelector('button[type="submit"]')!)
  })

  expect(updateConnector).toBeCalledWith(
    {
      connector: clientKeyMock
    },
    { queryParams: {} }
  )
  expect(container).toMatchSnapshot()
})
