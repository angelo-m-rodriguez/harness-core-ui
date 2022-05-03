/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'

import FileStorePopover from '@filestore/common/FileStorePopover/FileStorePopover'
import useUploadFile from '@filestore/common/useUpload/useUpload'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import { useStrings } from 'framework/strings'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'

interface NewFileButtonProps {
  parentIdentifier: string
}

export const NewFileButton: React.FC<NewFileButtonProps> = (props: NewFileButtonProps): React.ReactElement => {
  const { parentIdentifier } = props
  const { getNode } = useContext(FileStoreContext)
  const { getString } = useStrings()

  const newFileModal = useNewNodeModal({
    parentIdentifier,
    callback: getNode,
    type: FileStoreNodeTypes.FILE
  })
  const newFolderModal = useNewNodeModal({
    parentIdentifier,
    callback: getNode,
    type: FileStoreNodeTypes.FOLDER
  })

  const newUploadFile = useUploadFile()

  const menuItems = [
    {
      ComponentRenderer: newFileModal.ComponentRenderer,
      label: newFileModal.label,
      onClick: newFileModal.onClick
    },
    {
      ComponentRenderer: newFolderModal.ComponentRenderer,
      label: newFolderModal.label,
      onClick: newFolderModal.onClick
    },
    {
      ComponentRenderer: newUploadFile.ComponentRenderer,
      label: newUploadFile.label,
      onClick: newUploadFile.onClick
    }
  ]

  return <FileStorePopover items={menuItems} icon="plus" btnText={getString('common.new')} />
}
