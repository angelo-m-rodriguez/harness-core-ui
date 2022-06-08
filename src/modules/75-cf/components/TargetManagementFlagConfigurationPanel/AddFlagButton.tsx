/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useState } from 'react'
import { ButtonProps, ButtonVariation } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import TargetManagementAddFlagsDialog, {
  TargetManagementAddFlagsDialogProps
} from '@cf/components/TargetManagementAddFlagsDialog/TargetManagementAddFlagsDialog'

export interface AddFlagButtonProps extends Omit<TargetManagementAddFlagsDialogProps, 'hideModal'> {
  planEnforcementProps: Partial<ButtonProps>
  variation?: ButtonVariation
}

const AddFlagButton: FC<AddFlagButtonProps> = ({
  item,
  onAdd,
  title,
  existingFlagIds,
  includePercentageRollout,
  planEnforcementProps,
  variation = ButtonVariation.SECONDARY
}) => {
  const { getString } = useStrings()
  const [showModal, setShowModal] = useState<boolean>(false)

  return (
    <>
      <RbacButton
        variation={variation}
        text={getString('cf.targetManagementFlagConfiguration.addFlag')}
        permission={{
          permission: PermissionIdentifier.EDIT_FF_TARGETGROUP,
          resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: item.environment }
        }}
        {...planEnforcementProps}
        onClick={() => setShowModal(true)}
      />
      {showModal && (
        <TargetManagementAddFlagsDialog
          item={item}
          title={title}
          hideModal={() => setShowModal(false)}
          onAdd={onAdd}
          existingFlagIds={existingFlagIds}
          includePercentageRollout={includePercentageRollout}
        />
      )}
    </>
  )
}

export default AddFlagButton
