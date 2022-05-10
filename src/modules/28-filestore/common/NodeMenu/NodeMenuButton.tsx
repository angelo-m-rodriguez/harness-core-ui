/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, Fragment, useState } from 'react'
import {Classes, IMenuItemProps, Menu, PopoverPosition} from '@blueprintjs/core'
import { Button, ButtonProps, Popover } from '@harness/uicore'

import css from './NodeMenuButton.module.scss'

interface NodeMenuItem extends Omit<IMenuItemProps, 'icon'> {
  node?: ReactElement
}

export type Item = NodeMenuItem | '-'

export interface NodeMenuButtonProps extends ButtonProps {
  items: Item[]
  position: PopoverPosition
}

const NodeMenuButton = ({ items, position }: NodeMenuButtonProps): ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Popover
      isOpen={menuOpen}
      onInteraction={nextOpenState => {
        setMenuOpen(nextOpenState)
      }}
      boundary="viewport"
      className={Classes.DARK}
      popoverClassName={css.popover}
      position={position}
      content={
        <Menu style={{ minWidth: '180px' }}>
          {items.map((item: Item, key: number) => (
            <Fragment key={key}>
              {item === '-' ? (
                <Menu.Divider />
              ) : (
                <Menu.Item
                  text={item.text}
                  onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
                    e.stopPropagation()
                    if (item?.onClick) {
                      item.onClick(e)
                      setMenuOpen(false)
                    }
                  }}
                />
              )}
            </Fragment>
          ))}
        </Menu>
      }
    >
      <Button
        minimal
        intent="primary"
        icon="Options"
        withoutBoxShadow
        onClick={e => {
          e.stopPropagation()
          setMenuOpen(!menuOpen)
        }}
      />
    </Popover>
  )
}

export default NodeMenuButton
