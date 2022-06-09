/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { Editions, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import type { Module } from 'framework/types/ModuleName'
import type { InvoiceDetailDTO } from 'services/cd-ng'
import { getSubscriptionDetailsByModule } from '../subscriptionUtils'
import css from '../CostCalculator/CostCalculator.module.scss'
import detailCss from './FinalReview.module.scss'

export const Line = ({
  description,
  breakdown,
  price = 0
}: {
  description: string
  breakdown?: React.ReactElement
  price?: number
}): React.ReactElement => {
  return (
    <Layout.Horizontal flex={{ alignItems: 'start' }} className={detailCss.line}>
      <Text font={{ weight: 'semi-bold' }} className={detailCss.lineItem}>
        {description}
      </Text>
      <div className={detailCss.lineItem}> {breakdown}</div>
      <Text font={{ weight: 'semi-bold' }} padding={{ right: 'xlarge' }} width={'10%'}>
        {price.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })}
      </Text>
    </Layout.Horizontal>
  )
}

const PayingToday = ({ total = 0 }: { total?: number }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal className={detailCss.payingToday} flex={{ justifyContent: 'space-between' }}>
      <Text font={{ variation: FontVariation.H4 }}>{getString('authSettings.costCalculator.payingToday')}</Text>
      <Text font={{ variation: FontVariation.H4 }}>
        {total.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })}
      </Text>
    </Layout.Horizontal>
  )
}

export const SubscriptionDetails = ({
  plan,
  module,
  invoiceData,
  paymentFreq
}: {
  plan: Editions
  module: Module
  invoiceData?: InvoiceDetailDTO
  paymentFreq: TIME_TYPE
}): React.ReactElement => {
  const { getString } = useStrings()
  const supportBreakdown = (
    <Layout.Horizontal>
      <Text>{getString('authSettings.finalReview.premiumSupport')}</Text>
      <Text>{getString('authSettings.finalReview.ofTotalSpend')}</Text>
    </Layout.Horizontal>
  )
  const getAutoRenew = (date: string): React.ReactElement => (
    <Text>
      {getString('authSettings.costCalculator.autoRenew')}
      {date}
    </Text>
  )

  const premPrice = (invoiceData?.items?.find(item => item.price?.lookupKey === 'PREMIUM_SUPPORT')?.amount || 0) / 100

  return (
    <Layout.Vertical>
      <Layout.Horizontal spacing={'small'}>
        <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.costCalculator.newSubscription')}</Text>
        <Text
          font={{ weight: 'bold', size: 'xsmall' }}
          color={Color.WHITE}
          border={{ radius: 8 }}
          className={css.newPlan}
        >
          {plan}
        </Text>
      </Layout.Horizontal>
      <Layout.Vertical spacing={'large'}>
        {getSubscriptionDetailsByModule({ module, invoiceData, plan, paymentFreq })}
        <Line
          description={getString('authSettings.costCalculator.support')}
          breakdown={supportBreakdown}
          price={premPrice}
        />
        <Line description={getString('authSettings.costCalculator.tax')} />
        <Line
          description={
            paymentFreq === TIME_TYPE.YEARLY
              ? getString('authSettings.yearlySubscriptionTotal')
              : getString('authSettings.monthlySubscriptionTotal')
          }
          breakdown={getAutoRenew(new Date((invoiceData?.nextPaymentAttempt || 0) * 1000).toDateString())}
          price={(invoiceData?.totalAmount || 0) / 100}
        />
      </Layout.Vertical>
      <PayingToday total={(invoiceData?.amountDue || 0) / 100} />
    </Layout.Vertical>
  )
}
