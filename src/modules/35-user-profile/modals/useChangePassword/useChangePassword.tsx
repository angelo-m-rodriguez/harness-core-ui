/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { useModalHook } from '@harness/use-modal'
import { Dialog, Classes } from '@blueprintjs/core'
import type { PasswordStrengthPolicy } from 'services/cd-ng'
import ChangePasswordForm from './views/ChangePasswordForm'
import css from './useChangePassword.module.scss'
interface ModalReturn {
  openPasswordModal: (_passwordStrengthPolicy?: PasswordStrengthPolicy) => void
  closePasswordModal: () => void
}

export const useChangePassword = (): ModalReturn => {
  const [passwordStrengthPolicy, setPasswordStrengthPolicy] = React.useState<PasswordStrengthPolicy>()
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog enforceFocus={false} isOpen title="" onClose={hideModal} className={cx(css.dialog, Classes.DIALOG)}>
        <ChangePasswordForm hideModal={hideModal} passwordStrengthPolicy={passwordStrengthPolicy} />
      </Dialog>
    ),
    [passwordStrengthPolicy]
  )

  const open = (_passwordStrengthPolicy?: PasswordStrengthPolicy): void => {
    setPasswordStrengthPolicy(_passwordStrengthPolicy)
    showModal()
  }

  return {
    openPasswordModal: open,
    closePasswordModal: hideModal
  }
}
