/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import type { PriceDTO } from 'services/cd-ng/index'
import type { Editions, ProductPricesProp } from '@common/constants/SubscriptionTypes'

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
