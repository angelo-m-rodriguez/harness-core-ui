/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Layout, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { PriceDTO } from 'services/cd-ng'
import { TIME_TYPE } from '@common/constants/SubscriptionTypes'
import { getRenewDate } from '../subscriptionUtils'
import css from './CostCalculator.module.scss'

export const FFEquation = ({
  productPrices,
  quantities,
  time,
  setDueToday
}: {
  productPrices: PriceDTO[]
  quantities?: Record<string, number>
  time: TIME_TYPE
  setDueToday: (value: string) => void
}): React.ReactElement => {
  const { getString } = useStrings()
  let licenseUnitPrice = (productPrices.find(price => price.lookupKey?.includes('DEVELOPERS'))?.unitAmount || 0) / 100

  let mauUnitPrice = (productPrices.find(price => price.lookupKey?.includes('MAU'))?.unitAmount || 0) / 100

  if (time === TIME_TYPE.YEARLY) {
    licenseUnitPrice = licenseUnitPrice / 12
    mauUnitPrice = mauUnitPrice / 12
  }

  const licenseUnitPriceFormatted = licenseUnitPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const mauUnitPriceFormatted = mauUnitPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const licenseQuantity = quantities?.['numberOfDevelopers'] || 0
  const mauQuantity = quantities?.['numberOfMau'] || 0
  const licenseSubtotalMonthly = (licenseQuantity * licenseUnitPrice).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const mauSubtotalMonthly = (mauQuantity * mauUnitPrice).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const licenseSubtotalYearly = (licenseQuantity * licenseUnitPrice * 12).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const mauSubtotalYearly = (mauQuantity * mauUnitPrice * 12).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  const totalMonthlyFormatted = (licenseQuantity * licenseUnitPrice + mauQuantity * mauUnitPrice).toLocaleString(
    'en-US',
    {
      style: 'currency',
      currency: 'USD'
    }
  )
  const totalYearlyFormatted = (12 * (licenseQuantity * licenseUnitPrice + mauQuantity * mauUnitPrice)).toLocaleString(
    'en-US',
    {
      style: 'currency',
      currency: 'USD'
    }
  )

  const renewDate = getRenewDate(time)

  useEffect(() => {
    if (time === TIME_TYPE.MONTHLY) {
      setDueToday(totalMonthlyFormatted)
    }
    if (time === TIME_TYPE.YEARLY) {
      setDueToday(totalYearlyFormatted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMonthlyFormatted, totalYearlyFormatted, time])

  return (
    <Layout.Horizontal flex={{ alignItems: 'start', justifyContent: 'left' }} className={css.equation}>
      <Layout.Vertical spacing={'xsmall'} padding={{ right: 'large' }}>
        <Text>{`${getString('authSettings.costCalculator.developerLicenses')} ${getString('common.subtotal')}`}</Text>
        <Layout.Horizontal spacing={'xsmall'} flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
          <Text font={{ size: 'medium' }}>{licenseSubtotalMonthly}</Text>
          <Text font={{ size: 'medium' }}>{getString('common.perMonth')}</Text>
        </Layout.Horizontal>
        <Text font={{ size: 'xsmall' }}>{`${licenseSubtotalYearly} ${getString('authSettings.billedAnnually')}`}</Text>
        <Text font={{ size: 'xsmall' }}>
          {licenseQuantity}
          {`${getString('authSettings.unitPrice')}${licenseUnitPriceFormatted}${getString('common.perMonth')}`}
        </Text>
      </Layout.Vertical>
      <Text padding={{ right: 'large', top: 'medium' }} font={{ size: 'large' }}>
        +
      </Text>
      <Layout.Vertical spacing={'xsmall'} padding={{ right: 'large' }}>
        <Text>{`${getString('authSettings.costCalculator.maus')} ${getString('common.subtotal')}`}</Text>
        <Layout.Horizontal spacing={'xsmall'} flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}>
          <Text font={{ size: 'medium' }}>{mauSubtotalMonthly}</Text>
          <Text font={{ size: 'medium' }}>{getString('common.perMonth')}</Text>
        </Layout.Horizontal>
        <Text font={{ size: 'xsmall' }}> {`${mauSubtotalYearly} ${getString('authSettings.billedAnnually')}`}</Text>
        <Text font={{ size: 'xsmall' }}>
          {mauQuantity}
          {`${getString('authSettings.unitPrice')}${mauUnitPriceFormatted}${getString('common.perMonth')}`}
        </Text>
        <Text font={{ size: 'xsmall' }}>{getString('authSettings.firstIncludedFree')}</Text>
      </Layout.Vertical>
      <Text padding={{ right: 'large', top: 'medium' }} font={{ size: 'large' }}>
        =
      </Text>
      <Layout.Vertical spacing={'xsmall'}>
        <Text>{getString('authSettings.yearlySubscriptionTotal')}</Text>
        <Text font={{ size: 'medium' }}>
          {totalMonthlyFormatted}
          {getString('common.perMonth')}
        </Text>
        <Text font={{ size: 'xsmall' }}>{`${totalYearlyFormatted} ${getString('authSettings.billedAnnually')}`}</Text>
        <Text font={{ size: 'xsmall' }}>{getString('authSettings.autoRenewal', { date: renewDate })}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
