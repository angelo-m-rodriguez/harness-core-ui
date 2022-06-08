/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { ValueType } from '@secrets/components/TextReference/TextReference'
import { setSecretField } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, GetSecretV2QueryParams, SecretRefData } from 'services/cd-ng'
import type { CustomHealthConnectorDTO, CustomHealthKeyAndValue } from 'services/cv'
import type {
  BaseCompFields,
  EncryptedEntity,
  PlainEntity
} from '../CustomHealthConnector/components/CustomHealthHeadersAndParams/CustomHealthHeadersAndParams.types'
import { DefaultHeadersInitialValues } from './CreatePrometheusConnector.constants'

async function transformSpecHeader(
  scopeQueryParams: GetSecretV2QueryParams,
  entity?: CustomHealthConnectorDTO['headers']
): Promise<BaseCompFields['headers']> {
  if (!entity?.length) {
    return DefaultHeadersInitialValues
  }

  const transformedEntities: BaseCompFields['headers'] = []
  const encryptedEntities = entity.filter(e => {
    if (!e.valueEncrypted) {
      transformedEntities.push({
        key: e.key,
        value: {
          textField: e.value,
          fieldType: ValueType.TEXT
        }
      } as PlainEntity)
    }
    return e.valueEncrypted
  })

  await Promise.all(
    encryptedEntities.map(encryptedEntity =>
      setSecretField(encryptedEntity.encryptedValueRef as string, scopeQueryParams)
    )
  )
    .then(secretObjs => {
      encryptedEntities.forEach((e, index) =>
        transformedEntities.push({
          key: e.key,
          value: {
            fieldType: ValueType.ENCRYPTED,
            secretField: secretObjs[index]
          }
        } as EncryptedEntity)
      )
    })
    .catch(() => ({}))

  return transformedEntities
}

export async function initializePrometheusConnectorWithStepData(
  prevStepData?: ConnectorConfigDTO | null,
  scopeQueryParams?: GetSecretV2QueryParams
): Promise<ConnectorConfigDTO | undefined> {
  if (!prevStepData) {
    return
  }

  const { spec, ...prevData } = prevStepData
  const updatedInitialValues = {
    ...spec,
    ...prevData
  }

  if (prevData?.url) {
    return {
      ...updatedInitialValues,
      url: prevData?.url,
      headers: prevData?.headers,
      username: prevData?.username,
      passwordRef: prevData?.passwordRef
    }
  }

  return {
    ...updatedInitialValues,
    url: spec.url,
    headers: await transformSpecHeader(scopeQueryParams as GetSecretV2QueryParams, spec.headers),
    username: spec?.username,
    passwordRef: await setSecretField(spec?.passwordRef, scopeQueryParams as GetSecretV2QueryParams)
  }
}

function getSpecHeaderAndEntity(entity: PlainEntity | EncryptedEntity): CustomHealthKeyAndValue | null {
  if (entity?.value?.fieldType === ValueType.ENCRYPTED && entity.key && entity.value.secretField?.referenceString) {
    return {
      valueEncrypted: true,
      encryptedValueRef: entity.value.secretField.referenceString as SecretRefData,
      key: entity.key
    }
  } else if (entity?.value?.fieldType === ValueType.TEXT && entity.key && entity.value.textField) {
    return {
      valueEncrypted: false,
      value: entity.value.textField,
      key: entity.key
    }
  }

  return null
}

export function transformStepHeadersAndParamsForPayloadForPrometheus(headers: BaseCompFields['headers']): {
  headers: CustomHealthConnectorDTO['headers']
} {
  const apiHeaders: CustomHealthConnectorDTO['headers'] = []

  headers?.forEach(header => {
    const transformedHeader = getSpecHeaderAndEntity(header)
    if (transformedHeader) {
      apiHeaders.push(transformedHeader)
    }
  })

  return {
    headers: apiHeaders
  }
}
