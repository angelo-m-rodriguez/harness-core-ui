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
import FileIcon from '@filestore/images/file-add.svg'
import { FooterRenderer, ComponentRenderer } from '@filestore/common/ModalComponents/ModalComponents'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'

const useNewFileModal = (): FileStorePopoverItem => {
  const { getString } = useStrings()
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        enforceFocus={false}
        isOpen
        title={getString('filestore.newFile')}
        style={{ width: 560, height: 430 }}
        footer={
          <FooterRenderer
            onSubmit={() => undefined}
            onCancel={hideModal}
            confirmText={getString('add')}
            cancelText={getString('cancel')}
          />
        }
        onClose={hideModal}
      >
        {/* TODO: Implement new file design */}
        <div>Child Element Hook</div>
      </Dialog>
    ),
    []
  )

  return {
    ComponentRenderer: <ComponentRenderer iconSrc={FileIcon} title={getString('common.file')} />,
    onClick: showModal,
    label: getString('filestore.newFile')
  }
}

export default useNewFileModal
