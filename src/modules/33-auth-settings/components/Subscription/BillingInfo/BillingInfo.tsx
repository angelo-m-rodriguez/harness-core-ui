/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement } from '@stripe/react-stripe-js'
import type { Module } from 'framework/types/ModuleName'
import type { Editions, SubscribeViews, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import PowerByStripe from './img/power_by_stripe.png'
import { Footer } from './Footer'
import { Header } from '../Header'
import css from '@auth-settings/modals/Subscription/useSubscriptionModal.module.scss'

interface BillingInfoProps {
  module: Module
  setView: (view: SubscribeViews) => void
  subscriptionProps: {
    edition: Editions
    premiumSupport: boolean
    paymentFreq: TIME_TYPE
    numberOfDevelopers?: number
    numberOfMau?: number
  }
  clientSecret?: string
  payToday: number
}

const stripePromise = loadStripe(
  window.stripeApiKey ||
    'pk_test_51IykZ0Iqk5P9Eha3uhZUAnFuUWzaLLSa2elWpGBCF7uGpDU5rOcuX8PQew7hI947J9Lefh4qmQniY11HyXcUyBXD00aayEoMmU'
)

export const BillingInfo = ({
  module,
  setView,
  subscriptionProps,
  clientSecret,
  payToday
}: BillingInfoProps): React.ReactElement => {
  const { getString } = useStrings()

  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.billing.step')} step={3} />
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <Layout.Horizontal flex={{ alignItems: 'start' }}>
            <Layout.Vertical>
              <PaymentElement />
            </Layout.Vertical>
            <img src={PowerByStripe} alt="" aria-hidden width={'50%'} className={css.powerByStripe} />
          </Layout.Horizontal>
          <Footer setView={setView} time={subscriptionProps.paymentFreq} payToday={payToday} />
        </Elements>
      )}
    </Layout.Vertical>
  )
}
