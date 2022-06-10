/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FormikErrors } from 'formik'
import { cloneDeep } from 'lodash-es'
import type { ConnectionConfigProps } from '@connectors/components/CreateConnector/CommonCVConnector/constants'
import { ValueType } from '@secrets/components/TextReference/TextReference'
import { setSecretField } from '@secrets/utils/SecretField'
import type { CustomHealthConnectorDTO, GetSecretV2QueryParams, CustomHealthKeyAndValue } from 'services/cd-ng'
import type { UseStringsReturn } from 'framework/strings'
import type { BaseCompFields, PlainEntity, EncryptedEntity } from './CustomHealthHeadersAndParams.types'
import { DefaultHeadersAndParamsInitialValues } from './CustomHealthHeadersAndParams.constants'

function isTypePlainEntity(object: any): object is PlainEntity {
  return object?.value?.fieldType === ValueType.TEXT
}

function isTypeEncryptedEntity(object: any): object is EncryptedEntity {
  return object?.value?.fieldType === ValueType.ENCRYPTED
}

function isHeaderOrParamValid(
  entity: PlainEntity | EncryptedEntity,
  getString: UseStringsReturn['getString']
): { isKeyInvalid: boolean; validationStr: string } | undefined {
  if (isTypePlainEntity(entity)) {
    const header = entity as PlainEntity
    if (header.value?.textField && !entity.key) {
      return { isKeyInvalid: true, validationStr: getString('connectors.customHealth.keyRequired') }
    } else if (!header.value?.textField && entity.key) {
      return { isKeyInvalid: false, validationStr: getString('connectors.customHealth.valueRequired') }
    }
  } else if (isTypeEncryptedEntity(entity)) {
    const header = entity as EncryptedEntity
    if (header.value?.secretField?.referenceString && !entity.key) {
      return { isKeyInvalid: true, validationStr: getString('connectors.customHealth.keyRequired') }
    } else if (!header.value?.secretField?.referenceString && entity.key) {
      return { isKeyInvalid: false, validationStr: getString('connectors.customHealth.valueRequired') }
    }
  }
}

async function transformSpecParamAndHeader(
  scopeQueryParams: GetSecretV2QueryParams,
  entity?: CustomHealthConnectorDTO['params']
): Promise<BaseCompFields['params']> {
  if (!entity?.length) {
    return [
      {
        key: '',
        value: {
          textField: '',
          fieldType: ValueType.TEXT
        }
      }
    ]
  }

  const transformedEntities: BaseCompFields['params'] = []
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
  ).then(secretObjs => {
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

  return transformedEntities
}

function getSpecHeaderAndEntity(entity: PlainEntity | EncryptedEntity): CustomHealthKeyAndValue | null {
  if (entity?.value?.fieldType === ValueType.ENCRYPTED && entity.key && entity.value.secretField?.referenceString) {
    return {
      valueEncrypted: true,
      encryptedValueRef: entity.value.secretField.referenceString,
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

export async function transformSpecDataToStepData(
  apiData?: ConnectionConfigProps['prevStepData'],
  scopeQueryParams?: GetSecretV2QueryParams
): Promise<BaseCompFields> {
  const baseObj = cloneDeep(DefaultHeadersAndParamsInitialValues)

  if ((!apiData?.spec && !apiData?.baseURL) || !scopeQueryParams) {
    return baseObj
  }

  if (apiData.baseURL) {
    return {
      headers: apiData.headers,
      params: apiData.params
        ? apiData.params
        : await transformSpecParamAndHeader(scopeQueryParams, apiData.spec.params),
      baseURL: apiData.baseURL
    }
  }

  const [params, headers] = await Promise.all([
    transformSpecParamAndHeader(scopeQueryParams, apiData.spec.params),
    transformSpecParamAndHeader(scopeQueryParams, apiData.spec.headers)
  ])

  return {
    baseURL: apiData.spec.baseURL,
    params,
    headers
  }
}

export function validateHeadersAndParams(
  formData: BaseCompFields,
  getString: UseStringsReturn['getString']
): FormikErrors<BaseCompFields> {
  const errorsObj: FormikErrors<any> = {}
  if (!formData.baseURL || !formData.baseURL.trim()) {
    errorsObj.baseURL = getString('connectors.customHealth.baseURL')
  }

  formData?.headers?.forEach((header, index) => {
    const validationResult = isHeaderOrParamValid(header, getString)
    if (validationResult?.isKeyInvalid) {
      errorsObj[`headers[${index}].key`] = validationResult.validationStr
    } else if (validationResult && !validationResult?.isKeyInvalid) {
      errorsObj[`headers[${index}].value.`] = validationResult.validationStr
    }
  })

  formData?.params?.forEach((param, index) => {
    const validationResult = isHeaderOrParamValid(param, getString)
    if (validationResult?.isKeyInvalid) {
      errorsObj[`params[${index}].key`] = validationResult.validationStr
    } else if (validationResult && !validationResult?.isKeyInvalid) {
      errorsObj[`params[${index}].value.`] = validationResult.validationStr
    }
  })

  return errorsObj
}

export function transformStepHeadersAndParamsForPayload(
  headers: BaseCompFields['headers'],
  params: BaseCompFields['params']
): { params: CustomHealthConnectorDTO['params']; headers: CustomHealthConnectorDTO['headers'] } {
  const apiHeaders: CustomHealthConnectorDTO['headers'] = []
  const apiParams: CustomHealthConnectorDTO['params'] = []

  headers?.forEach(header => {
    const transformedHeader = getSpecHeaderAndEntity(header)
    if (transformedHeader) {
      apiHeaders.push(transformedHeader)
    }
  })

  params?.forEach(param => {
    const transformedParam = getSpecHeaderAndEntity(param)
    if (transformedParam) {
      apiParams.push(transformedParam)
    }
  })

  return {
    params: apiParams,
    headers: apiHeaders
  }
}
