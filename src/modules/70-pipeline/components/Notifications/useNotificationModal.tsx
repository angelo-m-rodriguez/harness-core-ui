/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { isNil } from 'lodash-es'
import { StepWizard, Button, MultiSelectOption } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, Classes } from '@blueprintjs/core'
import cx from 'classnames'
import type { NotificationRules } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import Overview from './Steps/Overview'
import PipelineEvents from './Steps/PipelineEvents'
import NotificationMethods from './Steps/NotificationMethods'
import { Actions } from './NotificationUtils'
import { NotificationTypeSelectOptions } from './NotificationTypeOptions'

import css from './useNotificationModal.module.scss'

export interface UseNotificationModalProps {
  onCloseModal?: () => void
  onCreateOrUpdate?: (data?: NotificationRules, index?: number, action?: Actions) => void
  stagesOptions?: MultiSelectOption[]
  getExistingNotificationNames?: (skipIndex?: number) => string[]
  expressions?: string[]
}

export interface UseNotificationModalReturn {
  openNotificationModal: (NotificationRules?: NotificationRules, index?: number) => void
  closeNotificationModal: () => void
}

enum Views {
  CREATE,
  EDIT
}

export const useNotificationModal = ({
  onCreateOrUpdate,
  onCloseModal,
  stagesOptions,
  getExistingNotificationNames,
  expressions
}: UseNotificationModalProps): UseNotificationModalReturn => {
  const [view, setView] = useState(Views.CREATE)
  const [index, setIndex] = useState<number>()
  const [notificationRules, setNotificationRules] = useState<NotificationRules>()
  const { getString } = useStrings()
  const wizardCompleteHandler = async (wizardData?: NotificationRules): Promise<void> => {
    onCreateOrUpdate?.(wizardData, index, view === Views.CREATE ? Actions.Added : Actions.Update)
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={() => {
          setView(Views.CREATE)
          hideModal()
          onCloseModal?.()
        }}
        className={cx(Classes.DIALOG, css.dialog)}
      >
        <StepWizard<NotificationRules>
          onCompleteWizard={wizardCompleteHandler}
          icon="new-notification"
          iconProps={{ color: 'white', size: 50 }}
          title={isNil(index) ? getString('newNotification') : getString('editNotification')}
          stepClassName={css.stepWizardContainer}
        >
          <Overview
            name={getString('overview')}
            data={notificationRules}
            existingNotificationNames={getExistingNotificationNames?.(index)}
          />
          <PipelineEvents name={getString('notifications.pipelineEvents')} stagesOptions={stagesOptions} />
          <NotificationMethods
            name={getString('notifications.notificationMethod')}
            typeOptions={NotificationTypeSelectOptions}
            expressions={expressions}
          />
        </StepWizard>
        <Button
          minimal
          icon="cross"
          className={css.crossIcon}
          iconProps={{ size: 18 }}
          onClick={() => {
            setView(Views.CREATE)
            hideModal()
            onCloseModal?.()
          }}
        />
      </Dialog>
    ),
    [view, notificationRules, wizardCompleteHandler]
  )

  const open = useCallback(
    (_notification?: NotificationRules, _index?: number) => {
      setNotificationRules(_notification)
      setIndex(_index)
      if (_notification) {
        setView(Views.EDIT)
      } else setView(Views.CREATE)
      showModal()
    },
    [showModal]
  )

  return {
    openNotificationModal: (_notificationRules?: NotificationRules, _index?: number) =>
      open(_notificationRules, _index),
    closeNotificationModal: hideModal
  }
}
