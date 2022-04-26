/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import FileStorePopover from '@filestore/common/FileStorePopover/FileStorePopover'
import useUploadFile from '@filestore/common/useUpload/useUpload'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import { useStrings } from 'framework/strings'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import type { FileStoreNodeDTO } from 'services/cd-ng'

interface NewFileButtonProps {
  parentIdentifier: string
  callback: (node: FileStoreNodeDTO) => void
}

export const NewFileButton: React.FC<NewFileButtonProps> = ({
  parentIdentifier,
  callback
}: NewFileButtonProps): React.ReactElement => {
  const { getString } = useStrings()
  const newFileModal = useNewNodeModal({ parentIdentifier, callback, type: FileStoreNodeTypes.FILE })
  const newFolderModal = useNewNodeModal({ parentIdentifier, callback, type: FileStoreNodeTypes.FOLDER })

import useNewFileModal from '@filestore/common/useNewFileModal/useNewFileModal'
import useNewFolderModal from '@filestore/common/useNewFolderModal/useNewFolderModal'
import useUploadFile from '@filestore/common/useUpload/useUpload'

import { useStrings } from 'framework/strings'

export const NewFileButton: React.FC = (): React.ReactElement => {
  const { getString } = useStrings()
  const newFileModal = useNewFileModal()
  const newFolderModal = useNewFolderModal()
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
