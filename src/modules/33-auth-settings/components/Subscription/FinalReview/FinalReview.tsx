/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type { Module } from 'framework/types/ModuleName'
import type { Editions, SubscribeViews } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import { Footer } from './Footer'
import { Header } from '../Header'
import { SubscriptionDetails } from './SubscriptionDetails'

interface FinalReviewProps {
  module: Module
  setView: (view: SubscribeViews) => void
  plan: Editions
}
export const FinalReview = ({ module, setView, plan }: FinalReviewProps): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical>
      <Header module={module} stepDescription={getString('authSettings.finalReview.step')} step={3} />
      <SubscriptionDetails plan={plan} />
      <Footer setView={setView} />
    </Layout.Vertical>
  )
}
