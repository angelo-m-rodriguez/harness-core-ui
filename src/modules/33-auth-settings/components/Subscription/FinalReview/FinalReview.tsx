/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type { Module } from 'framework/types/ModuleName'
import type { Editions, SubscribeViews, TIME_TYPE } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import type { InvoiceDetailDTO } from 'services/cd-ng'
import { Footer } from './Footer'
import { Header } from '../Header'
import { SubscriptionDetails } from './SubscriptionDetails'

interface FinalReviewProps {
  module: Module
  setView: (view: SubscribeViews) => void
  plan: Editions
  invoiceData?: InvoiceDetailDTO
  paymentFreq: TIME_TYPE
}
export const FinalReview = ({
  module,
  setView,
  plan,
  invoiceData,
  paymentFreq
}: FinalReviewProps): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.finalReview.step')} step={2} />
      <SubscriptionDetails plan={plan} module={module} invoiceData={invoiceData} paymentFreq={paymentFreq} />
      <Footer setView={setView} />
    </Layout.Vertical>
  )
}
