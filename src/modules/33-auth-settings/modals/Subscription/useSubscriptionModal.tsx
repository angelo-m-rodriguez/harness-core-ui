/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Classes, Dialog } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import cx from 'classnames'
import { CostCalculator } from '@auth-settings/components/Subscription/CostCalculator/CostCalculator'
import { FinalReview } from '@auth-settings/components/Subscription/FinalReview/FinalReview'
import { Success } from '@auth-settings/components/Subscription/Success/Success'
import { BillingInfo } from '@auth-settings/components/Subscription/BillingInfo/BillingInfo'
import type { Module } from 'framework/types/ModuleName'
import { Editions, SubscribeViews } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import css from './useSubscriptionModal.module.scss'

interface UseSubscribeModalReturns {
  openSubscribeModal: ({ _plan, _module, _time }: OpenSubscribeModalProps) => void
  closeSubscribeModal: () => void
}

interface OpenSubscribeModalProps {
  _module: Module
  _time: TIME_TYPE
  _plan: Editions
}

interface UseSubscribeModalProps {
  module: Module
  time: TIME_TYPE
  plan: Editions
}

const View = ({ module, plan, time }: UseSubscribeModalProps): React.ReactElement => {
  const [view, setView] = useState(SubscribeViews.CALCULATE)

  switch (view) {
    case SubscribeViews.BILLINGINFO:
      return <BillingInfo module={module} setView={setView} time={time} />
    case SubscribeViews.FINALREVIEW:
      return <FinalReview module={module} setView={setView} plan={plan} />
    case SubscribeViews.SUCCESS:
      return <Success module={module} />
    case SubscribeViews.CALCULATE:
    default:
      return <CostCalculator module={module} setView={setView} newPlan={plan} time={time} />
  }
}

export const useSubscribeModal = (): UseSubscribeModalReturns => {
  const [newPlan, setNewPlan] = useState<Editions>(Editions.FREE)
  const [time, setTime] = useState<TIME_TYPE>(TIME_TYPE.YEARLY)
  const [module, setModule] = useState<Module>('cd')

  const [openModal, hideModal] = useModalHook(
    () => (
      <Dialog
        onClose={hideModal}
        isOpen
        enforceFocus={false}
        className={cx(css.dialog, Classes.DIALOG)}
        title=""
        isCloseButtonShown
      >
        <View module={module} plan={newPlan} time={time} />
      </Dialog>
    ),
    [newPlan, time, module]
  )
  const open = React.useCallback(
    ({ _plan, _time, _module }: OpenSubscribeModalProps) => {
      setNewPlan(_plan)
      setTime(_time)
      setModule(_module)
      openModal()
    },
    [openModal]
  )

  return {
    openSubscribeModal: open,
    closeSubscribeModal: hideModal
  }
}
