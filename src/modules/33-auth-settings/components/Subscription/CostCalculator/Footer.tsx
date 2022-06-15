/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text, Button, ButtonVariation } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import css from '@auth-settings/modals/Subscription/useSubscriptionModal.module.scss'

interface FooterProps {
  disabled?: boolean
  time: TIME_TYPE
  setView: (view: SubscribeViews) => void
}

export const Footer = ({ disabled, time, setView }: FooterProps): React.ReactElement => {
  const { getString } = useStrings()
  const timeDescr =
    time === TIME_TYPE.MONTHLY ? getString('common.monthly').toLowerCase() : getString('common.annually')

  function handleNext(): void {
    setView(SubscribeViews.BILLINGINFO)
  }

  return (
    <Layout.Horizontal className={css.footer}>
      <Button disabled={disabled} onClick={handleNext} variation={ButtonVariation.PRIMARY} rightIcon="chevron-right">
        {getString('authSettings.costCalculator.next')}
      </Button>
      <Layout.Horizontal>
        <Text padding={{ right: 'medium' }} color={Color.GREY_700}>
          {getString('authSettings.costCalculator.payingToday')}
        </Text>
        <Layout.Vertical>
          <Text font={{ size: 'xsmall' }}>{getString('authSettings.plusTax')}</Text>
          <Text color={Color.GREY_500} font={{ size: 'xsmall' }}>
            {getString('authSettings.costCalculator.autoRenew', { time: timeDescr })}
          </Text>
        </Layout.Vertical>
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}
