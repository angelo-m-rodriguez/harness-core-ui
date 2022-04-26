/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { createContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { FileStoreNodeDTO } from 'services/cd-ng'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useGetFolderNodes } from 'services/cd-ng'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'

interface FileStoreContextState {
  currentNode: FileStoreNodeDTO
  setCurrentNode: (node: FileStoreNodeDTO) => void
  fileStore: FileStoreNodeDTO[] | undefined
  getRootNodes: (node: FileStoreNodeDTO) => void
  dataLoading: boolean
  setDataLoading: (trigger: boolean) => void
  nodeToUpdate: string
  setNodeToUpdate: (id: string) => void
}
export const FileStoreContext = createContext({} as FileStoreContextState)

export const FileStoreContextProvider: React.FC = props => {
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [nodeToUpdate, setNodeToUpdate] = useState<string>('')
  const [currentNode, setCurrentNode] = useState<FileStoreNodeDTO>({
    identifier: FILE_STORE_ROOT,
    name: FILE_STORE_ROOT,
    type: FileStoreNodeTypes.FOLDER,
    children: []
  } as FileStoreNodeDTO)
  const [fileStore, setFileStore] = useState<FileStoreNodeDTO[]>()
  const params = useParams<PipelineType<ProjectPathProps>>()
  const { accountId, orgIdentifier, projectIdentifier } = params

  const { mutate: getFolderNodes } = useGetFolderNodes({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const getRootNodes = async (nodeParams: FileStoreNodeDTO): Promise<void> => {
    setDataLoading(true)
    getFolderNodes({ ...nodeParams, children: undefined })
      .then(response => {
        if (nodeParams.identifier === FILE_STORE_ROOT) {
          setFileStore(response?.data?.children)
        }
        if (response?.data) {
          setCurrentNode(response?.data)
        }
        setDataLoading(false)
      })
      .catch(() => setDataLoading(false))
  }

  return (
    <FileStoreContext.Provider
      value={{
        currentNode,
        setCurrentNode,
        fileStore,
        getRootNodes,
        dataLoading,
        setDataLoading,
        nodeToUpdate,
        setNodeToUpdate
      }}
    >
      {props.children}
    </FileStoreContext.Provider>
  )
}
