/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { isEmpty } from 'lodash-es'
import { getScopeFromValue } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import { GitRepoName, ManifestStoreMap } from '../Manifesthelper'
import type {
  CommandFlags,
  HelmWithGcsDataType,
  HelmWithGITDataType,
  HelmWithHTTPDataType,
  HelmWithOCIDataType
} from '../ManifestInterface'

type formDataType = HelmWithGcsDataType | HelmWithGITDataType | HelmWithHTTPDataType | HelmWithOCIDataType

const getRepoNameBasedonScope = (initialValues: ManifestConfig, prevStepData: any): string => {
  const connectorScope = getScopeFromValue(initialValues?.spec.store?.spec.connectorRef)
  switch (connectorScope) {
    case Scope.ACCOUNT:
      return initialValues?.spec.store.spec.connectorRef === `account.${prevStepData.connectorRef.connector.identifier}`
        ? initialValues?.spec.store?.spec.repoName
        : ''

    case Scope.PROJECT:
      return prevStepData?.connectorRef?.connector?.identifier === initialValues?.spec.store?.spec.connectorRef
        ? initialValues?.spec.store?.spec.repoName
        : ''

    case Scope.ORG:
      return `${prevStepData.connectorRef.scope}.${prevStepData.connectorRef.connector.identifier}` ===
        initialValues?.spec.store.spec.connectorRef
        ? initialValues?.spec.store?.spec.repoName
        : ''

    default:
      return ''
  }
}

export const getRepositoryName = (prevStepData: any, initialValues: ManifestConfig): string => {
  const gitConnectionType: string = prevStepData?.store === ManifestStoreMap.Git ? 'connectionType' : 'type'
  const connectionType =
    prevStepData?.connectorRef?.connector?.spec?.[gitConnectionType] === GitRepoName.Repo ||
    prevStepData?.urlType === GitRepoName.Repo
      ? GitRepoName.Repo
      : GitRepoName.Account

  if (getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED) {
    return prevStepData.connectorRef
  } else {
    if (connectionType === GitRepoName.Repo) {
      return prevStepData.connectorRef?.connector?.spec.url
    }
    return getRepoNameBasedonScope(initialValues, prevStepData)
  }
}

export const handleCommandFlagsSubmitData = (
  manifestObj: ManifestConfigWrapper,
  formData: formDataType & {
    store?: string
    connectorRef?: string
  }
): void => {
  if (formData?.commandFlags.length && formData?.commandFlags[0].commandType) {
    ;(manifestObj.manifest as ManifestConfig).spec.commandFlags = formData?.commandFlags.map(
      (commandFlag: CommandFlags) =>
        commandFlag.commandType && commandFlag.flag
          ? {
              commandType: commandFlag.commandType,
              flag: commandFlag.flag
            }
          : {}
    )
    const filteredCommandFlags = manifestObj?.manifest?.spec?.commandFlags.filter(
      (currFlag: CommandFlags) => !isEmpty(currFlag)
    )
    if (filteredCommandFlags.length === 0 && manifestObj?.manifest?.spec) {
      delete manifestObj.manifest.spec.commandFlags
    }
  }
}

export const getConnectorPath = (type: string, data: any): string => {
  switch (type) {
    case ManifestStoreMap.OciHelmChart:
      return data?.spec?.store?.spec?.config?.spec?.connectorRef
    default:
      return data?.spec?.store?.spec?.connectorRef
  }
}
