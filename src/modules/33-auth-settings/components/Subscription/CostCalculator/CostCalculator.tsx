/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, PageError, Container } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import type { Module, ModuleName } from 'framework/types/ModuleName'
import { InvoiceDetailDTO, useCreateFfSubscription } from 'services/cd-ng/index'
import { Editions, SubscribeViews, SubscriptionProps } from '@common/constants/SubscriptionTypes'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetUsageAndLimit } from '@common/hooks/useGetUsageAndLimit'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { getSubscriptionQuantityByModule } from '@auth-settings/components/Subscription/subscriptionUtils'
import { CurrentSubscription } from './CurrentSubscription'
import { NewSubscription } from './NewSubscription'
import { Footer } from './Footer'
import { Billing } from './Billing'
import { Header } from '../Header'
import css from './CostCalculator.module.scss'

interface CostCalculatorProps {
  module: Module
  setView: (view: SubscribeViews) => void
  setSubscriptionProps: (props: SubscriptionProps) => void
  subscriptionProps: SubscriptionProps
  setInvoiceData: (value: InvoiceDetailDTO) => void
}

export const CostCalculator = ({
  module,
  setView,
  setSubscriptionProps,
  subscriptionProps,
  setInvoiceData
}: CostCalculatorProps): React.ReactElement => {
  const { licenseInformation } = useLicenseStore()
  const currentPlan = (licenseInformation[module.toUpperCase()]?.edition || Editions.FREE) as Editions
  const { getString } = useStrings()
  const usageAndLimitInfo = useGetUsageAndLimit(module.toUpperCase() as ModuleName)
  const [dueToday, setDueToday] = useState<string>('0')
  const { accountId } = useParams<AccountPathProps>()
  const [err, setErr] = useState<string>()

  const { mutate: createFFNewSubscription, loading: creatingNewSubscription } = useCreateFfSubscription({
    queryParams: { accountIdentifier: accountId }
  })

  async function createNewSubscription(): Promise<void> {
    try {
      // TODO: add a function to return create subscription function based of module
      const res = await createFFNewSubscription({
        accountId,
        edition: subscriptionProps.edition,
        paymentFreq: subscriptionProps.paymentFreq,
        premiumSupport: subscriptionProps.premiumSupport,
        ...subscriptionProps.quantities?.cf
      })

      if (res.data) {
        setInvoiceData(res.data)
      }
    } catch (error) {
      setErr(error.data?.message || error.message)
    }
  }

  if (creatingNewSubscription) {
    return <ContainerSpinner />
  }

  if (err) {
    return (
      <Container width={300}>
        <PageError message={err} onClick={createNewSubscription} />
      </Container>
    )
  }

  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.costCalculator.step')} step={1} />
      <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.body}>
        <CurrentSubscription module={module} currentPlan={currentPlan} usageAndLimitInfo={usageAndLimitInfo} />
        <NewSubscription
          module={module}
          usageAndLimitInfo={usageAndLimitInfo}
          subscriptionProps={subscriptionProps}
          setQuantities={(value: Record<string, number>) => {
            setSubscriptionProps({
              ...subscriptionProps,
              quantities: {
                cf: {
                  numberOfDevelopers: value['numberOfDevelopers'],
                  numberOfMau: value['numberOfMau']
                }
              }
            })
          }}
          setNewPlan={(newPlan: Editions) => {
            setSubscriptionProps({
              ...subscriptionProps,
              edition: newPlan,
              quantities: {}
            })
          }}
        />
        <Billing
          module={module}
          paymentFreq={subscriptionProps.paymentFreq}
          quantities={getSubscriptionQuantityByModule(module, subscriptionProps)}
          plan={subscriptionProps.edition}
          setDueToday={setDueToday}
          prem={subscriptionProps.premiumSupport}
          setPrem={(value: boolean) => {
            setSubscriptionProps({
              ...subscriptionProps,
              premiumSupport: value
            })
          }}
          setPaymentFreq={(value: TIME_TYPE) => {
            setSubscriptionProps({
              ...subscriptionProps,
              paymentFreq: value
            })
          }}
        />
      </Layout.Vertical>
      <Footer
        setView={setView}
        time={subscriptionProps.paymentFreq}
        dueToday={dueToday}
        disabled={isEmpty(subscriptionProps.quantities)}
        createSubscription={createNewSubscription}
      />
    </Layout.Vertical>
  )
}
