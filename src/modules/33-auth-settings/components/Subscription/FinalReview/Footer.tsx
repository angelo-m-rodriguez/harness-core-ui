/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Button, ButtonVariation } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import css from '@auth-settings/modals/Subscription/useSubscriptionModal.module.scss'

interface FooterProps {
  time?: TIME_TYPE
  setView: (view: SubscribeViews) => void
}

export const Footer = ({ setView }: FooterProps): React.ReactElement => {
  const { getString } = useStrings()

  function handleNext(): void {
    setView(SubscribeViews.SUCCESS)
  }

  function handleBack(): void {
    setView(SubscribeViews.BILLINGINFO)
  }

  return (
    <Layout.Horizontal className={css.footer}>
      <Layout.Horizontal spacing={'large'}>
        <Button variation={ButtonVariation.SECONDARY} onClick={handleBack} icon={'chevron-left'}>
          {getString('back')}
        </Button>
        <Button variation={ButtonVariation.PRIMARY} onClick={handleNext}>
          {getString('authSettings.billing.subscribeNPay')}
        </Button>
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}
