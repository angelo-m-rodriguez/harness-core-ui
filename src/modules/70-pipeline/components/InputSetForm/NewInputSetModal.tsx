/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Dialog } from '@blueprintjs/core'
import type { ResponseInputSetResponse } from 'services/pipeline-ng'
import { EnhancedInputSetForm } from '@pipeline/components/InputSetForm/InputSetForm'
import css from './InputSetForm.module.scss'

export interface NewInputSetModalProps {
  isModalOpen: boolean
  closeModal: () => void
  onCreateSuccess: (response: ResponseInputSetResponse) => void
}

export default React.memo(function NewInputSetModal({
  isModalOpen,
  closeModal,
  onCreateSuccess
}: NewInputSetModalProps): React.ReactElement {
  return (
    <Dialog
      title=""
      isCloseButtonShown
      className={cx(css.inModal, 'padded-dialog')}
      isOpen={isModalOpen}
      enforceFocus={false}
      onClose={() => {
        closeModal()
      }}
    >
      <EnhancedInputSetForm
        isNewInModal
        className={css.formInModal}
        onCancel={closeModal}
        onCreateSuccess={response => {
          closeModal()
          onCreateSuccess(response)
        }}
      />
    </Dialog>
  )
})
