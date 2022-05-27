/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const ConnectorResponse = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'connectorRef',
        identifier: 'connectorRef',
        description: '',
        tags: {},
        type: 'Pdc',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: {
              masterUrl: 'master',
              auth: { type: 'UsernamePassword', spec: { username: 'usr', passwordRef: 'account.test' } }
            }
          }
        }
      }
    }
  }
}
