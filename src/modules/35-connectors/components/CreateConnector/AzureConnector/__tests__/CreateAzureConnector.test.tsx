/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import {
  mockResponse,
  mockSecret,
  mockConnectorSecretKey,
  mockConnectorSecretFile,
  mockConnectorSystemManagedIdentity,
  mockConnectorUserManagedIdentity
} from './mocks'
import CreateAzureConnector from '../CreateAzureConnector'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}

const createConnector = jest.fn()
const updateConnector = jest.fn()
const getDelegateSelectors = jest.fn()

jest.mock('services/cd-ng', () => ({
  validateTheIdentifierIsUniquePromise: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector })),
  useUpdateConnector: jest.fn().mockImplementation(() => ({ mutate: updateConnector })),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

jest.mock('services/portal', () => ({
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: getDelegateSelectors })),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Create new azure connector', () => {
  test('Should match snapshot', async () => {
    const { container, getByTestId, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'connector123' }
      })
    })

    expect(container.querySelector('input[name="name"]')!).toHaveValue('connector123')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })

    expect(container.querySelector('input[value="ManualConfig"]')!).toBeInTheDocument()
    expect(container.querySelector('input[value="InheritFromDelegate"]')!).toBeInTheDocument()

    act(() => {
      fireEvent.click(container.querySelector('input[value="ManualConfig"]')!)
    })

    expect(container.querySelector('input[value="InheritFromDelegate"]')!).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(getByTestId('thumbnail-select-change')!)
    })

    expect(container.querySelector('input[value="InheritFromDelegate"]')!).toBeInTheDocument()

    await act(() => {
      fireEvent.click(container.querySelector('[value="InheritFromDelegate"]')!)
    })

    expect(container.querySelector('[value="ManualConfig"]')!).not.toBeInTheDocument()

    expect(container.querySelector('input[name="managedIdentity"]')!).toBeInTheDocument()

    act(() => {
      fireEvent.click(getByText('back')!)
    })

    expect(container).toMatchSnapshot()
  })
})

describe('Edit azure connector', () => {
  test('Should render correctly with text secret type', async () => {
    const { container, getByText, getByTestId } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={mockConnectorSecretKey.data.connector as any}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'Conn name' }
      })
    })

    expect(container.querySelector('input[name="name"]')!).toHaveValue('Conn name')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })

    expect(container.querySelector('input[value="ManualConfig"]')!).toBeInTheDocument()
    expect(container.querySelector('input[value="InheritFromDelegate"]')!).not.toBeInTheDocument()

    expect(container.querySelector('input[name="applicationId"]')!).toHaveValue('clientId')
    expect(container.querySelector('input[name="tenantId"]')!).toHaveValue('tenantId')

    expect(getByTestId('secretText')!).toBeInTheDocument()
  })

  test('Should render correctly with secret type certificate', async () => {
    const { container, getByText, getByTestId } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={mockConnectorSecretFile.data.connector as any}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'certificate connector' }
      })
    })

    expect(container.querySelector('input[name="name"]')!).toHaveValue('certificate connector')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })

    expect(container.querySelector('input[value="ManualConfig"]')!).toBeInTheDocument()
    expect(container.querySelector('input[value="InheritFromDelegate"]')!).not.toBeInTheDocument()

    expect(container.querySelector('input[name="applicationId"]')!).toHaveValue('clientId')
    expect(container.querySelector('input[name="tenantId"]')!).toHaveValue('tenantId')
    expect(getByTestId('secretFile')!).toBeInTheDocument()
  })

  test('Should render correctly with user assigned managed identity', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={mockConnectorUserManagedIdentity.data.connector as any}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'user assigned connector' }
      })
    })

    expect(container.querySelector('input[name="name"]')!).toHaveValue('user assigned connector')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })

    expect(container.querySelector('input[value="InheritFromDelegate"]')!).toBeInTheDocument()
    expect(container.querySelector('input[value="ManualConfig"]')!).not.toBeInTheDocument()
    expect(container.querySelector('input[name="clientId"]')!).toHaveValue('clientId')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })
  })

  test('Should render correctly with system assigned managed identity', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAzureConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={mockConnectorSystemManagedIdentity.data.connector as any}
          mock={mockResponse}
        />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.change(container.querySelector('input[name="name"]')!, {
        target: { value: 'system assigned connector' }
      })
    })

    expect(container.querySelector('input[name="name"]')!).toHaveValue('system assigned connector')

    await act(async () => {
      fireEvent.click(getByText('continue')!)
    })

    expect(container.querySelector('input[value="InheritFromDelegate"]')!).toBeInTheDocument()
    expect(container.querySelector('input[value="ManualConfig"]')!).not.toBeInTheDocument()
    expect(container.querySelector('input[name="clientId"]')!).not.toBeInTheDocument()
  })
})
