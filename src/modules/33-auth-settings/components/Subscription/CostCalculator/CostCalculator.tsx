/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type { Module, ModuleName } from 'framework/types/ModuleName'
import { Editions, SubscribeViews } from '@common/constants/SubscriptionTypes'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useStrings } from 'framework/strings'
import { useGetUsageAndLimit } from '@common/hooks/useGetUsageAndLimit'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { CurrentSubscription } from './CurrentSubscription'
import { NewSubscription } from './NewSubscription'
import { Footer } from './Footer'
import { Billing } from './Billing'
import { Header } from '../Header'
import css from './CostCalculator.module.scss'

interface CostCalculatorProps {
  module: Module
  setView: (view: SubscribeViews) => void
  newPlan: Editions
  time: TIME_TYPE
}

export const CostCalculator = ({ module, setView, newPlan, time }: CostCalculatorProps): React.ReactElement => {
  const { licenseInformation } = useLicenseStore()
  const currentPlan = (licenseInformation[module.toUpperCase()]?.edition || Editions.FREE) as Editions
  const { getString } = useStrings()
  const usageAndLimitInfo = useGetUsageAndLimit(module.toUpperCase() as ModuleName)
  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.costCalculator.step')} step={1} />
      <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.body}>
        <CurrentSubscription module={module} currentPlan={currentPlan} usageAndLimitInfo={usageAndLimitInfo} />
        <NewSubscription module={module} newPlan={newPlan} usageAndLimitInfo={usageAndLimitInfo} />
        <Billing module={module} initialTime={time} />
      </Layout.Vertical>
      <Footer setView={setView} time={time} />
    </Layout.Vertical>
  )
}
