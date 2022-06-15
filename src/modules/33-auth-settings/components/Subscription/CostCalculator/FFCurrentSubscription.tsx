/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text, PageError, Container, Tag } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { UsageAndLimitReturn } from '@common/hooks/useGetUsageAndLimit'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import css from './CostCalculator.module.scss'

const Usage = ({
  subscribed,
  using,
  recommended,
  unit = ''
}: {
  subscribed: number
  using: number
  recommended: number
  unit?: string
}): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
      <Layout.Vertical padding={{ right: 'large' }}>
        <Text padding={{ bottom: 'small' }}>{getString('common.subscribed')}</Text>
        <Layout.Horizontal flex={{ alignItems: 'center' }}>
          <Text color={Color.BLACK}>{`${subscribed}${unit}`}</Text>
          <Tag round className={css.includedFree}>
            {getString('authSettings.costCalculator.includedFree')}
          </Tag>
        </Layout.Horizontal>
      </Layout.Vertical>
      <Layout.Vertical padding={{ right: 'large' }}>
        <Text padding={{ bottom: 'small' }}>{getString('authSettings.costCalculator.using')}</Text>
        <Text color={Color.BLACK}>{`${using}${unit}`}</Text>
      </Layout.Vertical>
      <Layout.Vertical>
        <Text padding={{ bottom: 'small' }}>{getString('common.recommended')}</Text>
        <Text color={Color.BLACK}>{`${recommended}${unit}`}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
const Usages = ({
  title,
  subscribed,
  using,
  recommended,
  error,
  refetch,
  unit
}: {
  title: string
  subscribed: number
  using: number
  recommended: number
  error?: string
  refetch?: () => void
  unit?: string
}): React.ReactElement => {
  if (error) {
    return (
      <Container width={300}>
        <PageError message={error} onClick={refetch} />
      </Container>
    )
  }

  return (
    <Layout.Vertical width={'50%'}>
      <Text font={{ weight: 'bold' }} padding={{ bottom: 'medium' }}>
        {title}
      </Text>
      <Usage subscribed={subscribed} using={using} recommended={recommended} unit={unit} />
    </Layout.Vertical>
  )
}

export const FFCurrentSubscription = ({
  usageAndLimitInfo
}: {
  usageAndLimitInfo: UsageAndLimitReturn
}): React.ReactElement => {
  const { getString } = useStrings()
  const { limitData, usageData } = usageAndLimitInfo
  const isLoading = limitData.loadingLimit || usageData.loadingUsage

  if (isLoading) {
    return <ContainerSpinner />
  }

  const { usageErrorMsg, refetchUsage, usage } = usageData
  const { limitErrorMsg, refetchLimit, limit } = limitData

  const subscribedLicenses = limit?.ff?.totalFeatureFlagUnits || 0
  const subscribedMAUs = limit?.ff?.totalClientMAUs || 0
  const activeLicenses = usage?.ff?.activeFeatureFlagUsers?.count || 0
  const activeMAUs = usage?.ff?.activeClientMAUs?.count || 0
  const recommendedLicenses = Math.max(Math.round(activeLicenses * 1.2), subscribedLicenses)
  const recommendedMAUs = Math.max(Math.round(activeMAUs * 1.2), subscribedMAUs)

  return (
    <Layout.Horizontal>
      <Usages
        title={getString('authSettings.costCalculator.developerLicenses')}
        subscribed={subscribedLicenses}
        using={activeLicenses}
        recommended={recommendedLicenses}
        error={limitErrorMsg}
        refetch={refetchLimit}
      />
      <Usages
        title={getString('authSettings.costCalculator.maus')}
        subscribed={subscribedMAUs / 1000}
        using={activeMAUs / 1000}
        recommended={recommendedMAUs / 1000}
        error={usageErrorMsg}
        refetch={refetchUsage}
        unit={'k'}
      />
    </Layout.Horizontal>
  )
}
