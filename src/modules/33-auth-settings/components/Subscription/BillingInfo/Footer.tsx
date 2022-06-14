/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text, Button, ButtonVariation } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import css from '@auth-settings/modals/Subscription/useSubscriptionModal.module.scss'

interface FooterProps {
  time: TIME_TYPE
  setView: (view: SubscribeViews) => void
}

export const Footer = ({ time, setView }: FooterProps): React.ReactElement => {
  const { getString } = useStrings()
  const timeDescr = time === TIME_TYPE.MONTHLY ? getString('common.perMonth') : getString('common.perYear')

  function handleNext(): void {
    setView(SubscribeViews.FINALREVIEW)
  }

  function handleBack(): void {
    setView(SubscribeViews.CALCULATE)
  }

  return (
    <Layout.Horizontal className={css.footer}>
      <Layout.Horizontal spacing={'small'}>
        <Button variation={ButtonVariation.SECONDARY} onClick={handleBack} icon="chevron-left">
          {getString('back')}
        </Button>
        <Button variation={ButtonVariation.PRIMARY} onClick={handleNext} rightIcon="chevron-right">
          {getString('authSettings.billing.next')}
        </Button>
      </Layout.Horizontal>
      <Layout.Vertical>
        <Text>{`${getString('authSettings.costCalculator.payingToday')} ${timeDescr}`}</Text>
        <Text>{getString('authSettings.plusTax')}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
