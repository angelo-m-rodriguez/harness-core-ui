/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { useToggleOpen, Popover, ButtonVariation, IconName } from '@harness/uicore'
import { Menu, Position } from '@blueprintjs/core'
import type { FileStoreActionTypes } from '@filestore/utils/constants'

import {
  firstLetterToUpperCase,
  getIconByActionType,
  getPermissionsByActionType
} from '@filestore/utils/FileStoreUtils'

import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import css from './FileStorePopover.module.scss'

export interface FileStorePopoverItem {
  onClick: () => void
  label: string
  disabled?: boolean
  actionType: FileStoreActionTypes
  identifier?: string
}

export interface FileStoreActionPopoverProps {
  items: FileStorePopoverItem[]
  icon?: IconName | undefined
  className?: string
  portalClassName?: string
  btnText: string
}

const FileStoreActionPopover = (props: FileStoreActionPopoverProps): React.ReactElement => {
  const { items = [], icon, className, portalClassName, btnText = '' } = props
  const { isOpen, toggle } = useToggleOpen(false)

  return (
    <Popover
      isOpen={isOpen}
      position={Position.BOTTOM}
      className={cx(css.main, className)}
      portalClassName={cx(css.popover, portalClassName)}
      minimal={true}
      usePortal={false}
    >
      <RbacButton
        variation={ButtonVariation.PRIMARY}
        text={firstLetterToUpperCase(btnText)}
        permission={{
          permission: PermissionIdentifier.EDIT_FILE,
          resource: {
            resourceType: ResourceType.FILE
          }
        }}
        onClick={toggle}
        rightIcon="chevron-down"
        disabled={false}
        icon={icon}
        id="newFileBtn"
        data-testid="newFileButton"
      />
      <Menu>
        {items.length &&
          items.map((item: FileStorePopoverItem) => {
            const { label, onClick, actionType, identifier } = item
            return (
              <RbacMenuItem
                icon={getIconByActionType(actionType)}
                text={label}
                permission={getPermissionsByActionType(actionType, identifier)}
                onClick={e => {
                  e.stopPropagation()
                  onClick()
                  close()
                }}
              />
            )
          })}
      </Menu>
    </Popover>
  )
}

export default FileStoreActionPopover
