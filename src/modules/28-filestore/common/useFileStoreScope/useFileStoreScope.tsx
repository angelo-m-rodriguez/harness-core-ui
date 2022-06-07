/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// import React from 'react'
import { useParams } from 'react-router-dom'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { Scope } from '@common/interfaces/SecretsInterface'

interface useFileStoreScopeProps {
  scope: string
  isModalView: boolean
}

export interface ScopedObjectDTO {
  accountIdentifier: string
  orgIdentifier?: string
  projectIdentifier?: string
}

export const useFileStoreScope = ({ scope, isModalView }: useFileStoreScopeProps): ScopedObjectDTO => {
  const params = useParams<ProjectPathProps & ModulePathParams>()
  const { accountId, orgIdentifier, projectIdentifier } = params

  if (isModalView) {
    if (scope === Scope.ACCOUNT) {
      return {
        accountIdentifier: accountId
      }
    }
    if (scope === Scope.ORG) {
      return {
        accountIdentifier: accountId,
        orgIdentifier
      }
    }
    if (scope === Scope.PROJECT) {
      return {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      }
    }
  }
  return {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier
  }
}
