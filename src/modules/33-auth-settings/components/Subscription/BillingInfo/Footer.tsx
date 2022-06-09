/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { Layout, Text, Button, ButtonVariation, useToaster } from '@harness/uicore'
import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useStrings } from 'framework/strings'
import { SubscribeViews, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import css from '@auth-settings/modals/Subscription/useSubscriptionModal.module.scss'

interface FooterProps {
  time: TIME_TYPE
  setView: (view: SubscribeViews) => void
  payToday: number
}

export const Footer = ({ time, setView, payToday }: FooterProps): React.ReactElement => {
  const { getString } = useStrings()
  const timeDescr = time === TIME_TYPE.MONTHLY ? getString('common.perMonth') : getString('common.perYear')
  const stripe = useStripe()
  const elements = useElements()
  const { showError } = useToaster()
  const [err, setErr] = useState<string>()
  async function handleNext(): Promise<void> {
    const result = await completeSubscription()

    if (result) {
      setErr(result)
    } else {
      setView(SubscribeViews.SUCCESS)
    }
  }

  function handleBack(): void {
    setView(SubscribeViews.FINALREVIEW)
  }

  const completeSubscription = async (event?: { preventDefault: () => void }): Promise<string | undefined> => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event?.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return 'stripe not loaded'
    }

    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: window.location.href, //"https://example.com/order/123/complete",
        payment_method_data: {
          billing_details: {
            email: '',
            name: '',
            phone: '',
            address: {
              city: '',
              country: '',
              line1: '',
              line2: '',
              postal_code: '',
              state: ''
            }
          }
        },
        shipping: {
          name: '',
          address: {
            line1: ''
          }
        }
      },
      redirect: 'if_required'
    })

    if (result.error) {
      return result.error.message || 'payment failed'
      // Show error to your customer (for example, payment details incomplete)
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  }

  useEffect(() => {
    if (err) {
      showError(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [err])

  return (
    <Layout.Horizontal className={css.footer}>
      <Layout.Horizontal spacing={'small'}>
        <Button variation={ButtonVariation.SECONDARY} onClick={handleBack} icon="chevron-left">
          {getString('back')}
        </Button>
        <Button variation={ButtonVariation.PRIMARY} onClick={handleNext} rightIcon="chevron-right">
          {getString('authSettings.billing.subscribeNPay')}
        </Button>
      </Layout.Horizontal>
      <Layout.Vertical>
        <Text>{`${getString('authSettings.costCalculator.payingToday')} ${payToday.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })}${timeDescr}`}</Text>
        <Text>{getString('authSettings.plusTax')}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
