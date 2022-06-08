/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import * as secretField from '@secrets/utils/SecretField'
import { TestWrapper } from '@common/utils/testUtils'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { onNextMock } from '../../CommonCVConnector/__mocks__/CommonCVConnectorMocks'

// tells jest we intent to mock CVConnectorHOC and use mock in __mocks__
jest.mock('../../CommonCVConnector/CVConnectorHOC')
// file that imports mocked component must be placed after jest.mock
import CreatePrometheusConnector from '../CreatePrometheusConnector'
import { connectorMock, editConnectorMock } from './__mocks__/CreatePrometheusConnector.mock'

const PrometheusURL = 'http://1234.45.565.67:8080'

describe('Create prometheus connector Wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Ensure validation works', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreatePrometheusConnector
          accountId="dummyAccountId"
          orgIdentifier="dummyOrgId"
          projectIdentifier="dummyProjectId"
          onClose={noop}
          onSuccess={noop}
          isEditMode={false}
          setIsEditMode={noop}
          connectorInfo={undefined}
        />
      </TestWrapper>
    )

    // fill out url field
    await waitFor(() => expect(getByText('UrlLabel')).not.toBeNull())

    // click submit and verify validation string is visible
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => expect(getByText('connectors.prometheus.urlValidation')).not.toBeNull())
    expect(onNextMock).not.toHaveBeenCalled()
  })

  test('Ensure create flow works', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreatePrometheusConnector
          accountId="dummyAccountId"
          orgIdentifier="dummyOrgId"
          projectIdentifier="dummyProjectId"
          onClose={noop}
          onSuccess={noop}
          isEditMode={false}
          setIsEditMode={noop}
          connectorInfo={undefined}
        />
      </TestWrapper>
    )

    // fill out url field
    await waitFor(() => expect(getByText('UrlLabel')).not.toBeNull())
    await setFieldValue({ container, fieldId: 'url', value: PrometheusURL, type: InputTypes.TEXTFIELD })

    // click submit and verify submitted data
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() =>
      expect(onNextMock).toHaveBeenCalledWith({
        accountId: 'dummyAccountId',
        headers: [{ value: { fieldType: 'TEXT' } }],
        orgIdentifier: 'dummyOrgId',
        passwordRef: undefined,
        projectIdentifier: 'dummyProjectId',
        url: 'http://1234.45.565.67:8080',
        username: undefined
      })
    )
  })

  test('Ensure if there is existing data, fields are populated', async () => {
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreatePrometheusConnector
          accountId="dummyAccountId"
          orgIdentifier="dummyOrgId"
          projectIdentifier="dummyProjectId"
          onClose={noop}
          onSuccess={noop}
          isEditMode={false}
          setIsEditMode={noop}
          connectorInfo={connectorMock as unknown as ConnectorInfoDTO}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('UrlLabel')).not.toBeNull())

    screen.debug(container, 30000)

    // expect recieved value to be there
    expect(container.querySelector(`input[value="${PrometheusURL}"]`)).not.toBeNull()
    expect(container.querySelector('input[value="testUsername"]')).not.toBeNull()
    expect(screen.getByText(/passwordHarness/)).toBeInTheDocument()
    expect(screen.getByText(/<github app>/)).toBeInTheDocument()
    expect(container.querySelector('input[value="testKey2"]')).not.toBeNull()
    expect(container.querySelector('input[value="testKey"]')).not.toBeNull()
    expect(container.querySelector('input[value="testValue"]')).not.toBeNull()

    // update it with new value
    await setFieldValue({ container, fieldId: 'url', value: 'http://sfsfsf.com', type: InputTypes.TEXTFIELD })

    // click submit and verify submitted data
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() =>
      expect(onNextMock).toHaveBeenCalledWith({
        accountId: 'zEaak-FLS425IEO7OLzMUg',
        delegateSelectors: ['abc'],
        headers: [
          {
            key: 'testKey2',
            value: {
              fieldType: 'ENCRYPTED',
              secretField: {
                identifier: 'github_app',
                name: 'github app',
                referenceString: 'account.github_app',
                type: 'SecretText'
              }
            }
          },
          {
            key: 'testKey',
            value: { '': { type: 'TEXT', value: 'testValue' }, fieldType: 'TEXT', textField: 'testValue' }
          }
        ],
        identifier: 'testName',
        name: 'testName',
        orgIdentifier: 'CVNG',
        passwordRef: {
          identifier: 'passwordHarness',
          name: 'passwordHarness',
          referenceString: 'account.passwordHarness',
          type: 'SecretText'
        },
        projectIdentifier: 'SRMQASignoff',
        spec: {
          accountId: 'zEaak-FLS425IEO7OLzMUg',
          delegateSelectors: ['abc'],
          passwordRef: 'passwordHarness',
          url: 'http://1234.45.565.67:8080',
          username: 'testUsername'
        },
        type: 'Prometheus',
        url: 'http://sfsfsf.com',
        username: 'testUsername'
      })
    )
  })

  test('Ensure edit flow works', async () => {
    jest.spyOn(secretField, 'setSecretField').mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      Promise.resolve({
        identifier: 'passwordHarness',
        name: 'passwordHarness',
        referenceString: 'account.passwordHarness',
        type: 'SecretText'
      })
    )
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreatePrometheusConnector
          accountId="dummyAccountId"
          orgIdentifier="dummyOrgId"
          projectIdentifier="dummyProjectId"
          onClose={noop}
          onSuccess={noop}
          isEditMode={false}
          setIsEditMode={noop}
          connectorInfo={editConnectorMock as unknown as ConnectorInfoDTO}
        />
      </TestWrapper>
    )

    await waitFor(() => expect(getByText('UrlLabel')).not.toBeNull())

    // expect recieved value to be there
    expect(container.querySelector(`input[value="${PrometheusURL}"]`)).not.toBeNull()
    expect(container.querySelector('input[value="testUsername"]')).not.toBeNull()
    expect(screen.getByText(/passwordHarness/)).toBeInTheDocument()

    // update it with new value
    await setFieldValue({ container, fieldId: 'url', value: 'http://dgdgtrty.com', type: InputTypes.TEXTFIELD })
    await setFieldValue({ container, fieldId: 'username', value: 'updatedUserName', type: InputTypes.TEXTFIELD })

    // click submit and verify submitted data
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() =>
      expect(onNextMock).toHaveBeenCalledWith({
        accountId: 'zEaak-FLS425IEO7OLzMUg',
        delegateSelectors: ['abc'],
        headers: [{ key: '', value: { fieldType: 'TEXT', textField: '' } }],
        identifier: 'testName',
        name: 'testName',
        orgIdentifier: 'CVNG',
        passwordRef: {
          identifier: 'passwordHarness',
          name: 'passwordHarness',
          referenceString: 'account.passwordHarness',
          type: 'SecretText'
        },
        projectIdentifier: 'SRMQASignoff',
        spec: {
          accountId: 'zEaak-FLS425IEO7OLzMUg',
          delegateSelectors: ['abc'],
          passwordRef: 'passwordHarness',
          url: 'http://1234.45.565.67:8080',
          username: 'testUsername'
        },
        type: 'Prometheus',
        url: 'http://dgdgtrty.com',
        username: 'updatedUserName'
      })
    )
  })
})
