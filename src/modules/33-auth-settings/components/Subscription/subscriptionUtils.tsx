/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import type { InvoiceDetailDTO, PriceDTO } from 'services/cd-ng/index'
import type { Editions, ProductPricesProp, SubscriptionProps } from '@common/constants/SubscriptionTypes'
import { TIME_TYPE } from '@common/constants/SubscriptionTypes'
import type { Module } from 'framework/types/ModuleName'
import { FFSubscriptionDetails } from './FinalReview/FFSubscriptionDetail'

export function getRenewDate(time: TIME_TYPE): string {
  const today = new Date()
  if (time === TIME_TYPE.MONTHLY) {
    return new Date(today.setMonth(today.getMonth() + 1)).toDateString()
  }
  return new Date(today.setFullYear(today.getFullYear() + 1)).toDateString()
}

export function getProductPrices(plan: Editions, time: TIME_TYPE, productPrices: ProductPricesProp): PriceDTO[] {
  const prices: PriceDTO[] = []

  if (time === TIME_TYPE.MONTHLY) {
    productPrices.monthly.forEach(price => {
      if (price.lookupKey?.includes(plan)) {
        prices.push(price)
      }
    })
  }

  if (time === TIME_TYPE.YEARLY) {
    productPrices.yearly.forEach(price => {
      if (price.lookupKey?.includes(plan)) {
        prices.push(price)
      }
    })
  }

  return prices
}

export function getSubscriptionPropsByModule(
  module: Module,
  subscriptionProps: SubscriptionProps
): {
  edition: Editions
  premiumSupport: boolean
  paymentFreq: TIME_TYPE
} {
  const { edition, premiumSupport, paymentFreq } = subscriptionProps

  return { edition, premiumSupport, paymentFreq, ...getSubscriptionQuantityByModule(module, subscriptionProps) }
}

export function getSubscriptionQuantityByModule(
  module: Module,
  subscriptionProps: SubscriptionProps
): Record<string, number> {
  switch (module) {
    case 'cf':
      return { ...subscriptionProps.quantities?.cf }
    default:
  }

  return {}
}

export function getSubscriptionDetailsByModule({
  module,
  paymentFreq,
  plan,
  invoiceData
}: {
  module: Module
  paymentFreq: TIME_TYPE
  plan: Editions
  invoiceData?: InvoiceDetailDTO
}): React.ReactElement {
  const time = paymentFreq.toLocaleUpperCase()

  switch (module) {
    case 'cf': {
      const developersItem = invoiceData?.items?.find(
        item =>
          item.price?.lookupKey?.includes('DEVELOPERS') &&
          item.price?.lookupKey?.includes(time) &&
          item.price?.lookupKey?.includes(plan)
      )
      const licensesUnitPrice = (developersItem?.price?.unitAmount || 0) / 100
      const licensesQty = developersItem?.quantity || 0
      const mauItem = invoiceData?.items?.find(
        item =>
          item.price?.lookupKey?.includes('MAU') &&
          item.price?.lookupKey?.includes(time) &&
          item.price?.lookupKey?.includes(plan)
      )
      const mauUnitPrice = (mauItem?.price?.unitAmount || 0) / 100
      const mauQty = mauItem?.quantity || 0
      return (
        <FFSubscriptionDetails
          licensesUnitPrice={licensesUnitPrice}
          licensesQty={licensesQty}
          mauQty={mauQty}
          mauUnitPrice={mauUnitPrice}
        />
      )
    }
  }
  return <></>
}
