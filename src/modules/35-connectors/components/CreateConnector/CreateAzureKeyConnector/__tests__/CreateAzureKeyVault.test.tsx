/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, findByText, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import type { ResponseBoolean } from 'services/cd-ng'
import CreateAzureKeyVaultConnector from '../CreateAzureKeyVaultConnector'
import mockSecretList from './secretsListMockData.json'
import connectorMockData from './connectorsListMockData.json'
import connectorDetailsMockData from './connectorDetailsMockData.json'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}

export const mockResponse: ResponseBoolean = {
  status: 'SUCCESS',
  data: true,
  metaData: {},
  correlationId: ''
}

export const mockSecret = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'mockSecret',
      identifier: 'mockSecret',
      tags: {},
      description: '',
      spec: { secretManagerIdentifier: 'harnessSecretManager' }
    },
    createdAt: 1611917313699,
    updatedAt: 1611917313699,
    draft: false
  },
  metaData: null,
  correlationId: 'abb45801-d524-44ab-824c-aa532c367f39'
}

jest.mock('services/portal', () => ({
  useGetDelegateTags: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegateFromId: jest.fn().mockImplementation(() => {
    return { ...mockResponse, refetch: jest.fn(), error: null, loading: false }
  })
}))

jest.mock('services/cd-ng', () => ({
  useUpdateConnector: jest.fn().mockImplementation(() => ({
    mutate: () => Promise.resolve(mockResponse),
    loading: false
  })),
  validateTheIdentifierIsUniquePromise: jest.fn(() => Promise.resolve(mockResponse)),
  useCreateConnector: jest.fn().mockImplementation(() => ({
    mutate: () => Promise.resolve(mockResponse),
    loading: false
  })),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => jest.fn()),
  useGetMetadata: jest.fn().mockImplementation(() => ({
    mutate: () => Promise.resolve(mockResponse),
    loading: false
  })),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecretList)),
  useGetSecretV2: jest.fn().mockImplementation(() => {
    return { data: mockSecretList, refetch: jest.fn() }
  }),
  useGetConnectorList: jest.fn().mockImplementation(() => {
    return { ...connectorMockData, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: connectorDetailsMockData, refetch: jest.fn() }
  }),
  usePostSecret: jest.fn().mockImplementation(() => ({ mutate: () => Promise.resolve(mockResponse) })),
  usePostSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Create Secret Manager Wizard', () => {
  test('should be able to render first step form', async () => {
    const { container, getByText, getAllByText } = render(
      <TestWrapper path={routes.toConnectors({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
        <CreateAzureKeyVaultConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    // Step 1
    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'dummy name'
      }
    ])

    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    // Step 2
    expect(getAllByText('common.clientId')[0]).toBeTruthy()

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'clientId',
        value: 'dummy clientId'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'tenantId',
        value: 'dummy tenantId'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'subscription',
        value: 'dummy subscription'
      }
    ])

    await act(async () => {
      fireEvent.click(getByText('createOrSelectSecret'))
    })

    const modal = findDialogContainer()
    const secret = await findByText(modal!, 'mockSecret')
    await act(async () => {
      fireEvent.click(secret)
    })
    const applyBtn = await waitFor(() => findByText(modal!, 'entityReference.apply'))
    await act(async () => {
      fireEvent.click(applyBtn)
    })

    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    // Step 3
    expect(getAllByText('delegate.DelegateselectionLabel')[1]).toBeTruthy()

    await act(async () => {
      clickSubmit(container)
    })

    // Step 4
    expect(getAllByText('connectors.azureKeyVault.labels.setupVault')[1]).toBeTruthy()
    expect(container).toMatchSnapshot()
  })
})
