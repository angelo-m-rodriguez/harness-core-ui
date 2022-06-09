/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text, Layout, PillToggle, PageError, Container } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { capitalize } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import { useRetrieveProductPrices, PriceDTO } from 'services/cd-ng/index'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import type { Editions, ProductPricesProp } from '@common/constants/SubscriptionTypes'
import { FFEquation } from './FFEquation'
import { PremiumSupport } from './PremiumSupport'
import { getProductPrices } from '../subscriptionUtils'
import css from './CostCalculator.module.scss'

const Header = ({
  time,
  setTime,
  yearlySave
}: {
  time: TIME_TYPE
  setTime: (time: TIME_TYPE) => void
  yearlySave: string
}): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical className={css.billingHeader} padding={{ top: 'large', bottom: 'large' }}>
      <Text padding={{ bottom: 'large' }} font={{ variation: FontVariation.BODY1, weight: 'bold' }}>
        {getString('common.subscriptions.tabs.billing')}
      </Text>
      <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }}>
        <PillToggle
          onChange={timeClicked => setTime(timeClicked)}
          options={[
            { label: capitalize(TIME_TYPE.YEARLY), value: TIME_TYPE.YEARLY },
            {
              label: capitalize(TIME_TYPE.MONTHLY),
              value: TIME_TYPE.MONTHLY
            }
          ]}
          selectedView={time}
        />
        {time === TIME_TYPE.MONTHLY && (
          <Text
            icon="dollar"
            iconProps={{ color: Color.GREEN_700, size: 12 }}
            font={{ variation: FontVariation.SMALL }}
            padding={{ left: 'small' }}
          >
            {getString('authSettings.costCalculator.yearlySave', { money: yearlySave })}
          </Text>
        )}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

function getEquationByModule({
  module,
  productPrices,
  quantities,
  time,
  setDueToday
}: {
  module: Module
  productPrices: PriceDTO[]
  quantities: Record<string, number>
  time: TIME_TYPE
  setDueToday: (value: string) => void
}): React.ReactElement {
  switch (module) {
    case 'cf': {
      return <FFEquation productPrices={productPrices} quantities={quantities} setDueToday={setDueToday} time={time} />
    }
    default:
      return <></>
  }
}

function calculateYearlySave(productPrices: ProductPricesProp, quantities: Record<string, number>): string {
  let yearlySave = 0
  const licenseMonthlyUnitPrice =
    (productPrices.monthly.find(price => price.lookupKey?.includes('DEVELOPERS'))?.unitAmount || 0) / 100
  const mauMonthlyUnitPrice =
    (productPrices.monthly.find(price => price.lookupKey?.includes('MAU'))?.unitAmount || 0) / 100
  const licenseYearlyUnitPrice =
    (productPrices.yearly.find(price => price.lookupKey?.includes('DEVELOPERS'))?.unitAmount || 0) / 100
  const mauYearlyUnitPrice =
    (productPrices.yearly.find(price => price.lookupKey?.includes('MAU'))?.unitAmount || 0) / 100

  yearlySave =
    (licenseMonthlyUnitPrice * 12 - licenseYearlyUnitPrice) * (quantities['licenses'] || 0) +
    (mauMonthlyUnitPrice * 12 - mauYearlyUnitPrice) * (quantities['maus'] || 0)

  return yearlySave.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
}

export const Billing = ({
  module,
  initialTime,
  quantities,
  plan,
  setDueToday
}: {
  module: Module
  initialTime: TIME_TYPE
  quantities: Record<string, number>
  plan: Editions
  setDueToday: (value: string) => void
}): React.ReactElement => {
  const [time, setTime] = useState<TIME_TYPE>(initialTime)
  const [prem, setPrem] = useState<boolean>(false)
  const premDisabled = time === TIME_TYPE.MONTHLY
  const { accountId } = useParams<AccountPathProps>()
  const [productPrices, setProductPrices] = useState<ProductPricesProp>({ monthly: [], yearly: [] })

  const equationProductPrices = getProductPrices(plan, time, productPrices)

  const { data, loading, error, refetch } = useRetrieveProductPrices({
    queryParams: {
      accountIdentifier: accountId,
      moduleType: module.toUpperCase()
    }
  })

  const prices = data?.data?.prices
  React.useMemo(() => {
    const newProductPrices: ProductPricesProp = { monthly: [], yearly: [] }
    if (prices) {
      prices.forEach(price => {
        if (price.lookupKey?.includes('MONTHLY')) {
          newProductPrices.monthly.push(price)
        }
        if (price.lookupKey?.includes('YEARLY')) {
          newProductPrices.yearly.push(price)
        }
      })
      setProductPrices(newProductPrices)
    }
  }, [prices])

  if (loading) {
    return <ContainerSpinner />
  }

  if (error) {
    return (
      <Container width={300}>
        <PageError message={error.message} onClick={() => refetch()} />
      </Container>
    )
  }

  return (
    <Layout.Vertical spacing={'large'} padding={{ bottom: 'large' }}>
      <Header
        time={time}
        setTime={(newTime: TIME_TYPE) => {
          setTime(newTime)
          if (newTime === TIME_TYPE.MONTHLY) {
            setPrem(false)
          }
        }}
        yearlySave={calculateYearlySave(productPrices, quantities)}
      />
      {getEquationByModule({ module, productPrices: equationProductPrices, quantities, time, setDueToday })}
      <PremiumSupport disabled={premDisabled} onChange={setPrem} value={prem} time={time} setTime={setTime} />
    </Layout.Vertical>
  )
}
