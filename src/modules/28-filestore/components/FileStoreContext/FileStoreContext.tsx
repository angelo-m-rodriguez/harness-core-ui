/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { createContext, useState, useCallback } from 'react'
import type { FileStoreNodeDTO as NodeDTO, FileDTO, NGTag } from 'services/cd-ng'
import { useGetFolderNodes } from 'services/cd-ng'
import { FILE_VIEW_TAB, FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import { ScopedObjectDTO, useFileStoreScope } from '../../common/useFileStoreScope/useFileStoreScope'

export interface FileContentDTO extends FileDTO {
  content: string
}

export interface FileStoreNodeDTO extends NodeDTO {
  content?: string | undefined
  children?: FileStoreNodeDTO[] | undefined
  tempNode?: boolean
  mimeType?: string
  fileUsage?: FileUsage | null
  parentIdentifier?: string
  description?: string
  tags?: NGTag[]
  parentName?: string
}

export interface FileStoreContextState {
  currentNode: FileStoreNodeDTO
  setCurrentNode: (node: FileStoreNodeDTO) => void
  fileStore: FileStoreNodeDTO[] | undefined
  setFileStore: (nodes: FileStoreNodeDTO[]) => void
  updateFileStore: (nodes: FileStoreNodeDTO[]) => void
  getNode: (node: FileStoreNodeDTO, config?: GetNodeConfig) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  activeTab: string
  setActiveTab: (tab: FILE_VIEW_TAB) => void
  updateCurrentNode: (node: FileStoreNodeDTO) => void
  tempNodes: FileStoreNodeDTO[]
  setTempNodes: (node: FileStoreNodeDTO[]) => void
  updateTempNodes: (node: FileStoreNodeDTO) => void
  removeFromTempNodes: (nodeId: string) => void
  isCachedNode: (nodeId: string) => FileStoreNodeDTO | undefined
  isModalView: boolean
  scope: string
  queryParams: ScopedObjectDTO
}

export interface GetNodeConfig {
  setNewCurrentNode?: boolean
  newNode?: FileStoreNodeDTO
  identifier?: string
  type: FileStoreNodeTypes
}

export const FileStoreContext = createContext({} as FileStoreContextState)

interface FileStoreContextProps {
  scope?: string
  isModalView?: boolean
  children?: any
}

export const FileStoreContextProvider: React.FC<FileStoreContextProps> = (props: FileStoreContextProps) => {
  const { scope = '', isModalView = false } = props
  const queryParams = useFileStoreScope({
    scope,
    isModalView
  })
  const [tempNodes, setTempNodes] = useState<FileStoreNodeDTO[]>([])
  const [activeTab, setActiveTab] = useState<FILE_VIEW_TAB>(FILE_VIEW_TAB.DETAILS)
  const [loading, setLoading] = useState<boolean>(false)
  const [currentNode, setCurrentNodeState] = useState<FileStoreNodeDTO>({
    identifier: FILE_STORE_ROOT,
    name: FILE_STORE_ROOT,
    type: FileStoreNodeTypes.FOLDER,
    children: []
  } as FileStoreNodeDTO)
  const [fileStore, setFileStore] = useState<FileStoreNodeDTO[] | undefined>()

  const { mutate: getFolderNodes, loading: isGettingFolderNodes } = useGetFolderNodes({
    queryParams
  })

  const setCurrentNode = (node: FileStoreNodeDTO): void => {
    setCurrentNodeState(node)
  }

  const updateCurrentNode = (node: FileStoreNodeDTO): void => {
    setCurrentNode(node)
  }

  const updateFileStore = useCallback(
    (store: FileStoreNodeDTO[]): void => {
      setFileStore(store)
    },
    [setFileStore]
  )

  const updateTempNodes = (node: FileStoreNodeDTO): void => {
    setTempNodes([
      ...tempNodes.map(
        (tempNode: FileStoreNodeDTO): FileStoreNodeDTO => (tempNode.identifier === node.identifier ? node : tempNode)
      )
    ])
  }

  const removeFromTempNodes = (nodeIdentifier: string): void => {
    setTempNodes(tempNodes.filter((tempNode: FileStoreNodeDTO) => tempNode.identifier !== nodeIdentifier))
  }

  const isCachedNode = useCallback(
    (nodeIdentifier: string): FileStoreNodeDTO | undefined => {
      return tempNodes.find((tempNode: FileStoreNodeDTO): boolean => tempNode.identifier === nodeIdentifier)
    },
    [tempNodes]
  )

  const getNode = async (nodeParams: FileStoreNodeDTO, config?: GetNodeConfig): Promise<void> => {
    getFolderNodes({ ...nodeParams, children: undefined }).then(response => {
      if (nodeParams.identifier === FILE_STORE_ROOT) {
        setFileStore(
          response?.data?.children?.map((node: FileStoreNodeDTO) => ({
            ...node,
            parentIdentifier: FILE_STORE_ROOT
          }))
        )
      }
      if (response?.data) {
        updateCurrentNode(response?.data)
        if (config?.newNode && config.type === FileStoreNodeTypes.FOLDER) {
          setCurrentNode(config.newNode)
        }
        if (config) {
          if (config.type === FileStoreNodeTypes.FILE && config?.identifier && response.data?.children) {
            const newFile = response.data.children.find(
              (node: FileStoreNodeDTO) => node.identifier === config.identifier
            )
            if (newFile) {
              setCurrentNode(newFile)
            }
          }
        }
      }
    })
  }

  return (
    <FileStoreContext.Provider
      value={{
        currentNode,
        setCurrentNode,
        fileStore,
        getNode,
        setFileStore,
        loading: loading || isGettingFolderNodes,
        setLoading,
        updateCurrentNode,
        updateFileStore,
        tempNodes,
        setTempNodes,
        updateTempNodes,
        removeFromTempNodes,
        isCachedNode,
        activeTab,
        setActiveTab,
        isModalView,
        scope,
        queryParams
      }}
    >
      {props.children}
    </FileStoreContext.Provider>
  )
}
