/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName } from '@wings-software/uicore'
import { Icon, Text, Color } from '@wings-software/uicore'
import type { ReactElement, JSXElementConstructor } from 'react'
import cx from 'classnames'
import { Node, NodeType } from '../Node'
import css from '../../Diagram/node/DefaultNode.module.scss'

export const customNodeStyle = {
  background: 'var(--pipeline-selected-node)',
  borderColor: 'var(--diagram-selected)',
  borderWidth: '2px'
}

const iconStyle = {
  color: 'var(--white)'
}
export class DefaultNode extends Node {
  protected type = NodeType.Default
  protected identifier = '123'
  protected name = 'DefaultNode'
  protected defaultIcon: IconName = 'pipeline'
  protected secondaryIcon: IconName = 'command-echo'
  protected selectedColour = 'black'
  protected unSelectedColour = 'black'
  protected selectedIconColour = 'black'
  protected unSelectedIconColour = 'black'
  public render(props: any): ReactElement<any, string | JSXElementConstructor<any>> {
    return (
      <div
        id={props.identifier}
        className={cx(css.defaultNode, 'default-node')}
        // style={{ marginLeft: `${2}px` }}
      >
        <div
          className={cx(
            css.defaultCard
            // options.nodeClassName
          )}
          style={{
            width: props.width || 90,
            height: props.height || 40,
            marginTop: 32 - (props.height || 64) / 2,
            cursor: props.disableClick ? 'not-allowed' : props.draggable ? 'move' : 'pointer',
            opacity: props.dragging ? 0.4 : 1,
            ...customNodeStyle
          }}
        >
          <div className="execution-running-animation" />
          {props.iconName && (
            <Icon
              size={28}
              name={props.iconName}
              // inverse={isSelected}
              // {...options.iconProps}
              style={{ pointerEvents: 'none', ...iconStyle }}
            />
          )}
          {/* <div style={{ visibility: options.showPorts && !options.hideInPort ? 'visible' : 'hidden' }}>
            {props.node.getInPorts().map(port => generatePort(port, props))}
          </div>
          <div style={{ visibility: options.showPorts && !options.hideOutPort ? 'visible' : 'hidden' }}>
            {props.node.getOutPorts().map(port => generatePort(port, props))}
          </div> */}
          {this.secondaryIcon && <Icon className={css.secondaryIcon} size={8} name={this.secondaryIcon} />}
        </div>
        {props.name && (
          <Text
            font={{ size: 'normal', align: 'center' }}
            color={props.defaultSelected ? Color.GREY_900 : Color.GREY_600}
            style={{ cursor: 'pointer', lineHeight: '1.5', overflowWrap: 'normal', wordBreak: 'keep-all', height: 55 }}
            padding={'small'}
            width={125}
            lineClamp={2}
          >
            {props.name}
          </Text>
        )}
      </div>
    )
  }
}
