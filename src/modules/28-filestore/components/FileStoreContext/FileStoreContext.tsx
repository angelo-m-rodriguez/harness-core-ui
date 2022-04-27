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
  setFileStore: (nodes: FileStoreNodeDTO[]) => void
  dataLoading: boolean
  setDataLoading: (trigger: boolean) => void
  getNode: (node: FileStoreNodeDTO) => void
  loading: boolean
}
export const FileStoreContext = createContext({} as FileStoreContextState)

export const FileStoreContextProvider: React.FC = props => {
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [currentNode, setCurrentNode] = useState<FileStoreNodeDTO>({
    identifier: FILE_STORE_ROOT,
    name: FILE_STORE_ROOT,
    type: FileStoreNodeTypes.FOLDER,
    children: []
  } as FileStoreNodeDTO)
  const [fileStore, setFileStore] = useState<FileStoreNodeDTO[]>()
  const params = useParams<PipelineType<ProjectPathProps>>()
  const { accountId, orgIdentifier, projectIdentifier } = params

  const { mutate: getFolderNodes, loading } = useGetFolderNodes({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    }
  })

  const getNode = async (nodeParams: FileStoreNodeDTO): Promise<void> => {
    getFolderNodes({ ...nodeParams, children: undefined }).then(response => {
      if (nodeParams.identifier === FILE_STORE_ROOT) {
        setFileStore(response?.data?.children)
      }
      if (response?.data) {
        setCurrentNode(response?.data)
      }
    })
  }

  return (
    <FileStoreContext.Provider
      value={{
        currentNode,
        setCurrentNode,
        fileStore,
        dataLoading,
        setDataLoading,
        getNode,
        setFileStore,
        loading
      }}
    >
      {props.children}
    </FileStoreContext.Provider>
  )
}
