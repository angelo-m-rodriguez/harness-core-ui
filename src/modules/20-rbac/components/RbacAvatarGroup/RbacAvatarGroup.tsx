/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { AvatarGroup, AvatarGroupProps } from '@wings-software/uicore'
import { usePermission, PermissionsRequest } from '@rbac/hooks/usePermission'
import { useFeature } from '@common/hooks/useFeatures'
import type { FeatureProps } from 'framework/featureStore/featureStoreUtil'
import type { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { getPermissionRequestFromProps, getTooltip } from '@rbac/utils/utils'

interface RbacAvatarGroupProps extends AvatarGroupProps {
  permission?: Omit<PermissionsRequest, 'permissions'> & { permission: PermissionIdentifier }
  disabled?: boolean
  featureProps?: FeatureProps
}

const RbacAvatarGroup: React.FC<RbacAvatarGroupProps> = ({
  permission: permissionRequest,
  featureProps,
  ...restProps
}) => {
  const [canDoAction] = usePermission(getPermissionRequestFromProps(permissionRequest), [permissionRequest])

  const { enabled: featureEnabled } = useFeature({
    featureRequest: featureProps?.featureRequest
  })

  const tooltipProps = getTooltip({ permissionRequest, featureProps, canDoAction, featureEnabled })
  const { tooltip } = tooltipProps

  const disabledTooltip = restProps.onAddTooltip && restProps.disabled ? restProps.onAddTooltip : undefined

  const enabled = canDoAction && featureEnabled
  const isAddEnabled = disabledTooltip || enabled

  return (
    <AvatarGroup
      {...restProps}
      onAddTooltip={isAddEnabled ? disabledTooltip : tooltip}
      onAdd={event => {
        if (enabled && !restProps.disabled) {
          restProps.onAdd?.(event)
        } else {
          event.stopPropagation()
        }
      }}
    />
  )
}

export default RbacAvatarGroup
