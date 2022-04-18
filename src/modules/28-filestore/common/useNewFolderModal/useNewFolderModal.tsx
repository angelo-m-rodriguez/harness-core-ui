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
import { ComponentRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'
import NewFolderModalForm from '@filestore/common/useNewFolderModal/views/NewFolderModalForm'

const useNewFileModal = (): FileStorePopoverItem => {
  const { getString } = useStrings()
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        enforceFocus={false}
        isOpen
        title={getString('filestore.newFolder')}
        style={{ width: 560, height: 430 }}
        onClose={hideModal}
      >
        {/* TODO: Implement new folder design */}
        <NewFolderModalForm editMode={true} onCancel={hideModal} />
      </Dialog>
    ),
    []
  )

  return {
    ComponentRenderer: <ComponentRenderer iconSrc={FolderAddIcon} title={getString('filestore.newFolder')} />,
    onClick: showModal,
    label: getString('filestore.newFolder')
  }
}

export default useNewFileModal
