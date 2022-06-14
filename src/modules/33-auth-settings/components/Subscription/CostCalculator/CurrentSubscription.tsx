/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color, FontVariation } from '@harness/design-system'
import { Text, Layout } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import type { Editions } from '@common/constants/SubscriptionTypes'
import type { UsageAndLimitReturn } from '@common/hooks/useGetUsageAndLimit'
import { FFCurrentSubscription } from './FFCurrentSubscription'
import css from './CostCalculator.module.scss'

const Header = ({ currentPlan }: { currentPlan: Editions }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ justifyContent: 'left' }} padding={{ bottom: 'large' }}>
      <Text padding={{ right: 'small' }} font={{ variation: FontVariation.BODY1, weight: 'bold' }}>
        {getString('authSettings.costCalculator.currentSubscription')}
      </Text>
      <Text
        font={{ weight: 'bold', size: 'xsmall' }}
        color={Color.WHITE}
        border={{ radius: 8 }}
        className={css.currentPlan}
      >
        {currentPlan}
      </Text>
    </Layout.Horizontal>
  )
}

function getBodyByModule(module: Module, usageAndLimitInfo: UsageAndLimitReturn): React.ReactElement {
  switch (module) {
    case 'cf': {
      return <FFCurrentSubscription usageAndLimitInfo={usageAndLimitInfo} />
    }
    default:
      return <></>
  }
}

interface CurrentSubscriptionProps {
  module: Module
  currentPlan: Editions
  usageAndLimitInfo: UsageAndLimitReturn
}

export const CurrentSubscription = ({
  module,
  currentPlan,
  usageAndLimitInfo
}: CurrentSubscriptionProps): React.ReactElement => {
  return (
    <Layout.Vertical padding={{ bottom: 'large' }}>
      <Header currentPlan={currentPlan} />
      {getBodyByModule(module, usageAndLimitInfo)}
    </Layout.Vertical>
  )
}
