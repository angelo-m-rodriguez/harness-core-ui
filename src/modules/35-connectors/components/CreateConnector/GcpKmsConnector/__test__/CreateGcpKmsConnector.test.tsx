/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, queryByText, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { Connectors } from '@connectors/constants'
import {
  mockResponse,
  mockSecret,
  mockSecretList,
  connectorMockData
} from '@connectors/components/CreateConnector/HashiCorpVault/__test__/mock'
import CreateGcpKmsConnector from '../CreateGcpKmsConnector'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}

export const connectorInfo = {
  name: 'GCP KMS P024',
  identifier: 'GCP_KMS_P024',
  description: '',
  type: Connectors.GCP_KMS,
  spec: {
    default: false,
    credentials: 'account.selected_secret',
    projectId: '123',
    region: 'IND',
    keyRing: '123',
    keyName: '123'
  }
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
    return { data: {}, refetch: jest.fn() }
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
  test('Create GcpKms Connector', async () => {
    const { container, getAllByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGcpKmsConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    // Step 1
    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'Gcp Kms Connector'
      }
    ])

    await act(async () => {
      clickSubmit(container)
    })

    // step 2
    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'projectId',
        value: '123'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'region',
        value: 'global'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'keyRing',
        value: '123'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'keyName',
        value: 'Super key'
      }
    ])

    const credentials = queryByText(container, 'createOrSelectSecret')
    act(() => {
      fireEvent.click(credentials!)
    })

    await waitFor(() => queryByText(container, 'common.entityReferenceTitle'))
    const selectSecret = queryByText(document.body, 'common.entityReferenceTitle')
    expect(selectSecret).toBeTruthy()

    const secret = queryByText(document.body, 'selected_secret')
    expect(secret).toBeTruthy()
    act(() => {
      fireEvent.click(secret!)
    })

    const applySelected = queryByText(document.body, 'entityReference.apply')
    act(() => {
      fireEvent.click(applySelected!)
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

    expect(getAllByText('connectors.createdSuccessfully')[0]).toBeTruthy()
  }),
    test('Update Gcp Kms Connector', async () => {
      const { container, getAllByText } = render(
        <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
          <CreateGcpKmsConnector {...commonProps} isEditMode={true} connectorInfo={connectorInfo} mock={mockResponse} />
        </TestWrapper>
      )

      // Step 1 - Editing connector name
      await act(async () => {
        clickSubmit(container)
      })

      // Step 2
      expect(getAllByText('details')[1]).toBeTruthy()
      await act(async () => {
        clickSubmit(container)
      })

      // Step 3
      expect(getAllByText('delegate.DelegateselectionLabel')[1]).toBeTruthy()
      await act(async () => {
        clickSubmit(container)
      })

      expect(getAllByText('connectors.updatedSuccessfully')[0]).toBeTruthy()
    })
})
