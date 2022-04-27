/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useContext, PropsWithChildren, ReactElement } from 'react'

import { Container, Layout, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { Position, Spinner } from '@blueprintjs/core'
import RootFolderIcon from '@filestore/images/root-folder.svg'
import ClosedFolderIcon from '@filestore/images/closed-folder.svg'
import OpenFolderIcon from '@filestore/images/open-folder.svg'
import FileIcon from '@filestore/images/file-.svg'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes, StoreNodeType } from '@filestore/interfaces/FileStore'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import NodeMenuButton from '@filestore/common/NodeMenu/NodeMenuButton'
import type { Item } from '@filestore/common/NodeMenu/NodeMenuButton'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import type { FileStoreNodeDTO } from 'services/cd-ng'

import css from './NavNodeList.module.scss'

export interface FolderNodesListProps {
  fileStore: FileStoreNodeDTO[]
}
export interface RootNodesListProps {
  rootStore: FileStoreNodeDTO[]
}

export const FolderNodesList = ({ fileStore }: FolderNodesListProps): React.ReactElement => (
  <>
    {fileStore?.length &&
      fileStore.map((node: FileStoreNodeDTO) => {
        return <FolderNode key={node.identifier} {...node} />
      })}
  </>
)

export const FolderNode = React.memo((props: PropsWithChildren<FileStoreNodeDTO>): ReactElement => {
  const { identifier, type } = props
  const { currentNode, setCurrentNode, getNode, loading } = useContext(FileStoreContext)

  const [childNodes, setChildNodes] = useState<FileStoreNodeDTO[]>([])
  const [isOpenNode, setIsOpenNode] = useState<boolean>(false)
  const isActiveNode = React.useMemo(() => currentNode.identifier === identifier, [currentNode, identifier])
  const isRootNode = React.useMemo(() => identifier === FILE_STORE_ROOT, [identifier])

  React.useEffect(() => {
    if (currentNode?.children && currentNode.identifier === identifier && currentNode.identifier !== FILE_STORE_ROOT) {
      setChildNodes(currentNode.children)
    }
  }, [currentNode, identifier])

  const handleGetNodes = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (!loading) {
      setIsOpenNode(true)
      if (currentNode.identifier !== identifier) {
        setCurrentNode(props)
      }
      if (!isRootNode) {
        getNode({
          ...props,
          children: undefined
        })
      } else {
        getNode({
          identifier: FILE_STORE_ROOT,
          name: FILE_STORE_ROOT,
          type: FileStoreNodeTypes.FOLDER
        })
      }
    }
  }

  const getNodeIcon = (nodeType: StoreNodeType): string => {
    switch (nodeType) {
      case FileStoreNodeTypes.FILE:
        return FileIcon
      case FileStoreNodeTypes.FOLDER:
        if (isRootNode) {
          return RootFolderIcon
        }
        return isOpenNode ? OpenFolderIcon : ClosedFolderIcon
      default:
        return RootFolderIcon
    }
  }

  const newFileMenuItem = useNewNodeModal({
    parentIdentifier: identifier,
    type: FileStoreNodeTypes.FILE,
    callback: getNode
  })
  const newFolderMenuItem = useNewNodeModal({
    parentIdentifier: identifier,
    type: FileStoreNodeTypes.FOLDER,
    callback: getNode
  })

  const optionsMenuItems: Item[] = [
    {
      text: newFileMenuItem.ComponentRenderer,
      onClick: newFileMenuItem.onClick
    },
    {
      text: newFolderMenuItem.ComponentRenderer,
      onClick: newFolderMenuItem.onClick
    }
  ]

  const NodesList = React.useMemo(() => {
    return (
      <Layout.Vertical style={{ marginLeft: '3%' }}>
        <FolderNodesList fileStore={childNodes} />
      </Layout.Vertical>
    )
  }, [childNodes])

  return (
    <Layout.Vertical style={{ marginLeft: !isRootNode ? '3%' : 'none', cursor: 'pointer' }} key={identifier}>
      <div
        className={cx(css.mainNode, isActiveNode && css.activeNode)}
        style={{ position: 'relative' }}
        onClick={handleGetNodes}
      >
        <div style={{ display: 'flex' }}>
          <img src={getNodeIcon(type)} alt={type} />
          <Text font={{ size: 'normal' }} color={!isActiveNode ? Color.PRIMARY_9 : Color.GREY_0}>
            {props.name}
          </Text>
        </div>
        {isActiveNode &&
          (!loading ? (
            <NodeMenuButton items={optionsMenuItems} position={Position.RIGHT_TOP} />
          ) : (
            <Container margin={{ right: 'small' }}>
              <Spinner size={20} />
            </Container>
          ))}
      </div>
      {!!childNodes.length && NodesList}
    </Layout.Vertical>
  )
})

export const RootNodesList = ({ rootStore }: RootNodesListProps): React.ReactElement => (
  <Layout.Vertical padding={{ left: 'small' }} margin={{ top: 'xlarge' }}>
    <Container>
      <FolderNode type={FileStoreNodeTypes.FOLDER} identifier={FILE_STORE_ROOT} name={FILE_STORE_ROOT} />
    </Container>
    <FolderNodesList fileStore={rootStore} />
  </Layout.Vertical>
)
