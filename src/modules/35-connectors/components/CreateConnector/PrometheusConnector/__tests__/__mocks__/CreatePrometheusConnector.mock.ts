/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

const PrometheusURL = 'http://1234.45.565.67:8080'

export const connectorMock = {
  name: 'testName',
  identifier: 'testName',
  type: 'Prometheus',
  projectIdentifier: 'SRMQASignoff',
  orgIdentifier: 'CVNG',
  url: PrometheusURL,
  username: 'testUsername',
  headers: [
    {
      key: 'testKey2',
      value: {
        fieldType: 'ENCRYPTED',
        secretField: {
          name: 'github app',
          identifier: 'github_app',
          type: 'SecretText',
          referenceString: 'account.github_app'
        }
      }
    },
    {
      value: {
        fieldType: 'TEXT',
        textField: 'testValue',
        '': {
          value: 'testValue',
          type: 'TEXT'
        }
      },
      key: 'testKey'
    }
  ],
  passwordRef: {
    identifier: 'passwordHarness',
    name: 'passwordHarness',
    referenceString: 'account.passwordHarness',
    type: 'SecretText'
  },
  spec: {
    delegateSelectors: ['abc'],
    url: PrometheusURL,
    accountId: 'zEaak-FLS425IEO7OLzMUg',
    username: 'testUsername',
    passwordRef: 'passwordHarness'
  }
}

export const editConnectorMock = {
  name: 'testName',
  identifier: 'testName',
  type: 'Prometheus',
  projectIdentifier: 'SRMQASignoff',
  orgIdentifier: 'CVNG',
  spec: {
    delegateSelectors: ['abc'],
    url: PrometheusURL,
    accountId: 'zEaak-FLS425IEO7OLzMUg',
    username: 'testUsername',
    passwordRef: 'passwordHarness'
  }
}
