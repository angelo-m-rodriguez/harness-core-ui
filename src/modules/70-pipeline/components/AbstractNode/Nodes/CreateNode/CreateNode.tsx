import React from 'react'
import { isEmpty } from 'lodash-es'
import { Icon } from '@blueprintjs/core'
import { Text } from '@harness/uicore'

interface CreateNodeProps {
  identifier: string | undefined
  className?: string
  name: string
  titleClassName?: string
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
      {!isEmpty(props.name) && (
        <Text
          data-name="node-name"
          font={{ align: 'center' }}
          padding={{ top: 'small' }}
          lineClamp={2}
          style={{ marginLeft: '-30px', marginRight: '-30px' }}
          className={props.titleClassName}
        >
          {props.name}
        </Text>
      )}
    </>
  )
}
