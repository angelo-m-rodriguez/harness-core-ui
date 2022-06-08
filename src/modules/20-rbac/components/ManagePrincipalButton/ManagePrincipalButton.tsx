/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import type { ButtonProps } from '@wings-software/uicore'
import RbacButton from '@rbac/components/Button/Button'
import type { PermissionRequest } from '@rbac/hooks/usePermission'
import type { FeaturesProps } from 'framework/featureStore/featureStoreUtil'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ResourceScope } from 'services/rbac'

interface ManagePrincipalButtonProps extends ButtonProps {
  resourceIdentifier?: string
  resourceType: ResourceType.USERGROUP | ResourceType.USER
  featuresProps?: FeaturesProps
  resourceScope?: ResourceScope
}

const ManagePrincipalButton: React.FC<ManagePrincipalButtonProps> = ({
  resourceIdentifier,
  resourceType,
  featuresProps,
  resourceScope,
  ...restProps
}) => {
  const permission: PermissionRequest = {
    resource: {
      resourceType,
      resourceIdentifier
    },
    resourceScope,
    permission:
      resourceType === ResourceType.USER ? PermissionIdentifier.MANAGE_USER : PermissionIdentifier.MANAGE_USERGROUP
  }

  return <RbacButton {...restProps} permission={permission} featuresProps={featuresProps} />
}

export default ManagePrincipalButton
