/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Text, Layout, PillToggle } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { capitalize } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import { Editions, SUBSCRIPTION_TAB_NAMES } from '@common/constants/SubscriptionTypes'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import type { UsageAndLimitReturn } from '@common/hooks/useGetUsageAndLimit'
import { FFNewSubscription } from './FFNewSubscription'
import css from './CostCalculator.module.scss'

const Header = ({
  plan,
  module,
  setPlan
}: {
  plan: Editions
  module: Module
  setPlan: (value: Editions) => void
}): React.ReactElement => {
  const { getString } = useStrings()
  const newPlanClassName = plan === Editions.ENTERPRISE ? css.enterprisePlan : css.newPlan
  return (
    <Layout.Vertical padding={{ bottom: 'large' }}>
      <Layout.Horizontal padding={{ top: 'large', bottom: 'medium' }}>
        <Text padding={{ right: 'small' }} font={{ variation: FontVariation.BODY1, weight: 'bold' }}>
          {getString('authSettings.costCalculator.newSubscription')}
        </Text>
        <Text
          font={{ weight: 'bold', size: 'xsmall' }}
          color={Color.WHITE}
          border={{ radius: 8 }}
          className={newPlanClassName}
        >
          {plan}
        </Text>
      </Layout.Horizontal>
      <PlanToggle plan={plan} setPlan={setPlan} module={module} />
    </Layout.Vertical>
  )
}

const PlanToggle = ({
  plan,
  setPlan,
  module
}: {
  plan: Editions
  setPlan: (plan: Editions) => void
  module: Module
}): React.ReactElement => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  return (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
      <PillToggle
        onChange={planClicked => setPlan(planClicked)}
        options={[
          { label: capitalize(Editions.TEAM), value: Editions.TEAM },
          {
            label: capitalize(Editions.ENTERPRISE),
            value: Editions.ENTERPRISE
          }
        ]}
        selectedView={plan}
      />
      <Link
        to={routes.toSubscriptions({ accountId, moduleCard: module, tab: SUBSCRIPTION_TAB_NAMES.PLANS })}
        target="_blank"
      >
        <Text color={Color.PRIMARY_7} font={{ size: 'xsmall' }}>
          {getString('authSettings.costCalculator.comparePlans')}
        </Text>
      </Link>
    </Layout.Horizontal>
  )
}

function getBodyByModule(
  module: Module,
  newPlan: Editions,
  usageAndLimitInfo: UsageAndLimitReturn
): React.ReactElement {
  switch (module) {
    case 'cf': {
      return <FFNewSubscription plan={newPlan} usageAndLimitInfo={usageAndLimitInfo} />
    }
    default:
      return <></>
  }
}

interface NewSubscriptionProps {
  module: Module
  newPlan: Editions
  usageAndLimitInfo: UsageAndLimitReturn
}

export const NewSubscription = ({ module, newPlan, usageAndLimitInfo }: NewSubscriptionProps): React.ReactElement => {
  const [plan, setPlan] = useState<Editions>(newPlan)

  return (
    <Layout.Vertical spacing={'large'} padding={{ bottom: 'large' }} className={css.newSubscription}>
      <Header plan={plan} module={module} setPlan={setPlan} />
      {getBodyByModule(module, plan, usageAndLimitInfo)}
    </Layout.Vertical>
  )
}
