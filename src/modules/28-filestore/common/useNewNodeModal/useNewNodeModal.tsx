/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { Dialog } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import FolderAddIcon from '@filestore/images/folder-add.svg'
import FileAddIcon from '@filestore/images/file-add.svg'
import { ComponentRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'

import NewFolderModalForm from '@filestore/common/useNewNodeModal/views/NewFolderModalForm'
import NewFileModalForm from '@filestore/common/useNewNodeModal/views/NewFileModalForm'
import { FileStoreNodeTypes, NewNodeModal } from '@filestore/interfaces/FileStore'

import css from './useNewNodeModal.module.scss'

const useNewNodeModal = ({ parentIdentifier, type, callback }: NewNodeModal): FileStorePopoverItem => {
  const { getString } = useStrings()

  const getNodeConfigs = (typeNode: FileStoreNodeTypes): any => {
    switch (typeNode) {
      case FileStoreNodeTypes.FILE:
        return {
          NewNodeForm: NewFileModalForm,
          title: getString('filestore.newFile'),
          icon: FileAddIcon,
          height: 430
        }
      case FileStoreNodeTypes.FOLDER:
        return {
          NewNodeForm: NewFolderModalForm,
          title: getString('filestore.newFolder'),
          icon: FolderAddIcon,
          height: 302
        }
    }
  }

  const { NewNodeForm, title, icon, height } = getNodeConfigs(type as FileStoreNodeTypes)
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        enforceFocus={false}
        isOpen
        title={title}
        style={{ width: 504, height }}
        onClose={hideModal}
        className={css.layout}
        usePortal
      >
        <NewNodeForm editMode={true} close={hideModal} parentIdentifier={parentIdentifier} callback={callback} />
      </Dialog>
    ),
    []
  )

  return {
    ComponentRenderer: <ComponentRenderer iconSrc={icon} title={title} />,
    onClick: showModal,
    label: title
  }
}

export default useNewNodeModal
