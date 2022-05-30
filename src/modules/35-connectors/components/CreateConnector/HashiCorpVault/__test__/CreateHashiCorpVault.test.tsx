/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, queryByText, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import { TestWrapper } from '@common/utils/testUtils'
import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { HashiCorpVaultAccessTypes } from '@connectors/interfaces/ConnectorInterface'
import { mockSecretList, mockResponse, connectorMockData, mockSecret, secretManagerInfo, mockRegions } from './mock'
import CreateHashiCorpVault from '../CreateHashiCorpVault'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}

jest.mock('services/portal', () => ({
  useGetDelegateTags: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useListAwsRegions: jest.fn().mockImplementation(() => {
    return { data: mockRegions, refetch: jest.fn(), error: null, loading: false }
  }),
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
  test('should render form', async () => {
    const { container, getAllByText } = render(
      <TestWrapper path={routes.toConnectors({ ...accountPathProps })} pathParams={{ accountId: 'testAcc' }}>
        <CreateHashiCorpVault {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // Step 1
    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'name',
        value: 'dummyName'
      }
    ])
    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    // Step 2
    expect(getAllByText('authentication')[0]).toBeTruthy()
    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'vaultUrl',
        value: 'https://vaultqa.harness.io'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'appRoleId',
        value: '123'
      }
    ])

    const password = queryByText(container, 'createOrSelectSecret')
    act(() => {
      fireEvent.click(password!)
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

    // Step 4
    expect(getAllByText('connectors.hashiCorpVault.setupEngine')[1]).toBeTruthy()
    fillAtForm([
      {
        container,
        type: InputTypes.RADIOS,
        fieldId: 'engineType',
        value: 'manual'
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'secretEngineName',
        value: 'secret'
      }
    ])

    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    expect(getAllByText('connectors.createdSuccessfully')[0]).toBeTruthy()
  }),
    test('should render form in edit', async () => {
      const { container, getAllByText } = render(
        <TestWrapper path={routes.toConnectors({ ...accountPathProps })} pathParams={{ accountId: 'dummy' }}>
          <CreateHashiCorpVault
            {...commonProps}
            connectorInfo={secretManagerInfo}
            mock={mockResponse}
            isEditMode={true}
          />
        </TestWrapper>
      )

      // Edit step 1
      fillAtForm([
        {
          container,
          type: InputTypes.TEXTFIELD,
          fieldId: 'name',
          value: 'dummyName'
        }
      ])
      await act(async () => {
        clickSubmit(container)
      })

      // Edit step 2
      await waitFor(() => expect(getAllByText('authentication')[0]).toBeTruthy())
      expect(container).toMatchSnapshot()
      fillAtForm([
        {
          container,
          type: InputTypes.SELECT,
          fieldId: 'accessType',
          value: HashiCorpVaultAccessTypes.TOKEN
        }
      ])

      const password = queryByText(container, 'createOrSelectSecret')
      act(() => {
        fireEvent.click(password!)
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
      await act(async () => {
        clickSubmit(container)
      })

      // Step 3
      await waitFor(() => expect(getAllByText('delegate.DelegateselectionLabel')[1]).toBeTruthy())
      await act(async () => {
        clickSubmit(container)
      })

      // Edit Step 4
      await waitFor(() => expect(getAllByText('connectors.hashiCorpVault.setupEngine')[1]).toBeTruthy())
      fillAtForm([
        {
          container,
          type: InputTypes.TEXTFIELD,
          fieldId: 'secretEngineName',
          value: 'secret 123'
        }
      ])

      await act(async () => {
        clickSubmit(container)
      })

      await waitFor(() => expect(getAllByText('connectors.updatedSuccessfully')[0]).toBeTruthy())
    })
})
