/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type { Module } from 'framework/types/ModuleName'
import type { SubscribeViews } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { Footer } from './Footer'
import { Header } from '../Header'

interface BillingInfoProps {
  module: Module
  setView: (view: SubscribeViews) => void
  time: TIME_TYPE
}
export const BillingInfo = ({ module, setView, time }: BillingInfoProps): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.billing.step')} step={2} />
      <Footer setView={setView} time={time} />
    </Layout.Vertical>
  )
}
