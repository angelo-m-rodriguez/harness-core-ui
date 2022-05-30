/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, queryByText } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import { clickSubmit, fillAtForm, InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import CreateAwsSecretManagerConnector from '../CreateAwsSecretManagerConnector'
import { connectorInfo, mockResponse, mockSecret, mockRegions } from './mocks'

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

jest.mock('services/cd-ng', () => ({
  useUpdateConnector: jest.fn().mockImplementation(() => ({ mutate: updateConnector })),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector })),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => jest.fn()),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  validateTheIdentifierIsUniquePromise: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

jest.mock('services/portal', () => ({
  useGetDelegateFromId: jest.fn().mockImplementation(() => {
    return { ...mockResponse, refetch: jest.fn(), error: null, loading: false }
  }),
  useListAwsRegions: jest.fn().mockImplementation(() => {
    return { data: mockRegions, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Create Secret Manager Wizard', () => {
  test('should be able to render first and second step form', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAwsSecretManagerConnector {...commonProps} isEditMode={false} connectorInfo={undefined} />
      </TestWrapper>
    )

    // match step 1
    expect(container).toMatchSnapshot()

    // fill step 1
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

    expect(container).toMatchSnapshot()
  })

  test('Should render form for edit', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateAwsSecretManagerConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={connectorInfo}
          mock={mockResponse}
        />
      </TestWrapper>
    )
    // editing connector name
    await setFieldValue({
      container: document.body,
      type: InputTypes.TEXTFIELD,
      fieldId: 'name',
      value: 'dummy name'
    })
    expect(container).toMatchSnapshot()
    await act(async () => {
      clickSubmit(container)
    })
    // step 2 - AWS SM auth step
    expect(queryByText(container, 'authentication')).toBeTruthy()
    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    // step 3 - delegate selection step
    await act(async () => {
      clickSubmit(container)
    })

    expect(updateConnector).toBeCalled()
  })
})
