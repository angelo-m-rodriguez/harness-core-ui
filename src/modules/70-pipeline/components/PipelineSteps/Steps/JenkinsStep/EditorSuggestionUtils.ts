/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { CompletionItemKind } from 'vscode-languageserver-types'
import { getConnectorListV2Promise, ConnectorResponse } from 'services/cd-ng'
import { Scope } from '@common/interfaces/SecretsInterface'

export const getConnectorValue = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? connector?.connector?.identifier
      : connector?.connector?.orgIdentifier
      ? `${Scope.ORG}.${connector?.connector?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.connector?.identifier}`
  }`

export const getConnectorName = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? `${connector?.connector?.type}: ${connector?.connector?.name}`
      : connector?.connector?.orgIdentifier
      ? `${connector?.connector?.type}[Org]: ${connector?.connector?.name}`
      : `${connector?.connector?.type}[Account]: ${connector?.connector?.name}`
  }`

export const getConnectorSuggestions = (params: Record<string, unknown>, types?: string[]) => {
  const { accountId, projectIdentifier, orgIdentifier } = params as {
    accountId: string
    orgIdentifier: string
    projectIdentifier: string
  }
  const body: any = { filterType: 'Connector' }
  if (types?.length) {
    body.types = [...types]
  }
  return getConnectorListV2Promise({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      includeAllConnectorsAvailableAtScope: true
    },
    body
  }).then(response => {
    const data =
      response?.data?.content?.map(connector => ({
        label: getConnectorName(connector),
        insertText: getConnectorValue(connector),
        kind: CompletionItemKind.Field
      })) || []
    return data
  })
}
