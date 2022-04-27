/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import type { Column, Renderer, CellProps } from 'react-table'
import { Position } from '@blueprintjs/core'

import { Layout, TableV2, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { FileStoreNodeDTO } from 'services/cd-ng'
import NodeMenuButton from '@filestore/common/NodeMenu/NodeMenuButton'
import type { Item } from '@filestore/common/NodeMenu/NodeMenuButton'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import FolderIcon from '@filestore/images/closed-folder.svg'
import FileIcon from '@filestore/images/file-.svg'

import { FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import type { StoreNodeType } from '@filestore/interfaces/FileStore'
import { getFileUsageNameByType } from '@filestore/utils/textUtils'

export interface StoreViewProps {
  title?: string
}

interface FileStoreNodeRenderDTO extends FileStoreNodeDTO {
  fileUsage: FileStoreNodeTypes
  lastModified: string
  lastModifiedBy: string
}

const RenderColumnName: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  const getNodeIcon = (type: StoreNodeType): string => {
    switch (type) {
      case FileStoreNodeTypes.FOLDER:
        return FolderIcon
      case FileStoreNodeTypes.FILE:
        return FileIcon
      default:
        return FolderIcon
    }
  }
  return (
    <Layout.Horizontal style={{ alignItems: 'center' }}>
      <img src={getNodeIcon(original.type)} style={{ marginRight: 10 }} />
      <Text color={Color.GREY_800} font={{ size: 'small' }} width={230} lineClamp={1}>
        {original.name}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnType: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} width={230} lineClamp={1}>
      {original.type === FileStoreNodeTypes.FOLDER ? 'Folder' : 'File'}
    </Text>
  )
}

const RenderColumnFileUsage: Renderer<CellProps<FileStoreNodeRenderDTO>> = () => {
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} width={230} lineClamp={1}>
      {getFileUsageNameByType(FileUsage.CONFIG)}
    </Text>
  )
}

const RenderColumnLastModified: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} width={230} lineClamp={1}>
      {original?.lastModified ? original.lastModified : ''}
    </Text>
  )
}

const RenderColumnLastModifiedBy: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} width={230} lineClamp={1}>
      {original?.lastModifiedBy ? original.lastModifiedBy : ''}
    </Text>
  )
}

const RenderColumnMenu: Renderer<CellProps<FileStoreNodeDTO>> = () => {
  const optionsMenuItems: Item[] = [
    {
      text: 'test1',
      onClick: () => null
    }
  ]
  return (
    <Layout.Horizontal style={{ alignItems: 'center' }}>
      <NodeMenuButton items={optionsMenuItems} position={Position.RIGHT_TOP} />
    </Layout.Horizontal>
  )
}

const NodesList: React.FC = () => {
  const { getString } = useStrings()
  const { currentNode, getNode } = useContext(FileStoreContext)
  const columns: Column<FileStoreNodeDTO>[] = [
    {
      Header: getString('filestore.view.fileName'),
      accessor: row => row?.name,
      id: 'fileName',
      width: '30%',
      Cell: RenderColumnName
    },
    {
      Header: getString('common.file'),
      accessor: row => row.type,
      id: 'fileType',
      width: '15%',
      Cell: RenderColumnType
    },
    {
      Header: getString('filestore.view.fileUsage'),
      accessor: row => row,
      id: 'fileUsage',
      width: '15%',
      Cell: RenderColumnFileUsage
    },
    {
      Header: getString('common.lastModifiedTime'),
      accessor: row => row,
      id: 'lastModifiedTime',
      width: '15%',
      Cell: RenderColumnLastModified
    },
    {
      Header: getString('filestore.view.lastModifiedBy'),
      accessor: row => row,
      id: 'lastModifiedBy',
      width: '15%',
      Cell: RenderColumnLastModifiedBy
    },
    {
      accessor: row => row,
      id: 'menu',
      width: '10%',
      Cell: RenderColumnMenu
    }
  ]
  return (
    <>
      {currentNode?.children?.length ? (
        <Layout.Vertical height="100%" width="100%">
          <TableV2
            columns={columns}
            data={currentNode.children}
            name="FileStoreView"
            onRowClick={node => getNode(node)}
          />
        </Layout.Vertical>
      ) : null}
    </>
  )
}

export default NodesList
