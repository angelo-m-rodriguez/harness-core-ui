/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { useToggleOpen, Popover, ButtonVariation, Button, IconName } from '@harness/uicore'
import { Menu, Position } from '@blueprintjs/core'
import { firstLetterToUpperCase } from '@filestore/utils/textUtils'

import css from './FileStorePopover.module.scss'

export interface FileStorePopoverItem {
  ComponentRenderer: React.ReactElement
  onClick: () => void
  label: string
  disabled?: boolean
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
      <Button
        variation={ButtonVariation.PRIMARY}
        icon={icon}
        rightIcon="chevron-down"
        text={firstLetterToUpperCase(btnText)}
        onClick={toggle}
        disabled={false}
        onBlur={toggle}
      />
      <Menu>
        {items.length &&
          items.map((item: FileStorePopoverItem) => {
            const { ComponentRenderer, label, onClick } = item
            return (
              <li
                key={label}
                className={cx(css.menuItem, { [css.disabled]: item.disabled })}
                onClick={e => {
                  e.stopPropagation()
                  onClick()
                  toggle()
                }}
              >
                {ComponentRenderer}
              </li>
            )
          })}
      </Menu>
    </Popover>
  )
}

export default FileStoreActionPopover
