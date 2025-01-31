/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { Icon } from '@blueprintjs/core'
import { Text } from '@harness/uicore'

interface CreateNodeProps {
  identifier: string | undefined
  className?: string
  name: string
  titleClassName?: string

  hidden?: boolean
}
export default function CreateNode(props: CreateNodeProps): React.ReactElement {
  return (
    <>
      <div
        id={props.identifier}
        data-linkid={props.identifier}
        data-nodeid={props.identifier}
        className={props.className}
      >
        <div>
          <Icon icon="plus" iconSize={22} color={'var(--diagram-add-node-color)'} />
        </div>
      </div>
      {!isEmpty(props.name) && !props.hidden && (
        <Text
          data-name="node-name"
          font={{ align: 'center' }}
          padding={{ top: 'small' }}
          lineClamp={2}
          className={props.titleClassName}
        >
          {props.name}
        </Text>
      )}
    </>
  )
}
