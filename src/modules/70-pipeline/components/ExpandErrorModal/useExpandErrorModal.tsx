/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Container } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import css from './useExpandErrorModal.module.scss'

export interface UseExpandErrorModalProps {
  onClose?: () => void
}

export interface UseExpandErrorModalReturn {
  openErrorModal: (error: JSX.Element) => void
  hideErrorModal: () => void
}
const modalProps: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    width: 1000,
    borderLeft: 0,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden'
  }
}

const useExpandErrorModal = (props: UseExpandErrorModalProps): UseExpandErrorModalReturn => {
  const [error, setError] = useState<JSX.Element>()
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog {...modalProps}>
        <Container height={'100%'} padding="xxlarge">
          {error}
        </Container>
        <Button
          minimal
          icon="cross"
          iconProps={{ size: 18 }}
          onClick={() => {
            props.onClose?.()
            hideModal()
          }}
          className={css.crossIcon}
        />
      </Dialog>
    ),
    [error]
  )

  return {
    openErrorModal: (_error: JSX.Element) => {
      setError(_error)
      showModal()
    },
    hideErrorModal: hideModal
  }
}

export default useExpandErrorModal
