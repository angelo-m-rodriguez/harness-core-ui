/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Line } from './SubscriptionDetails'

interface FFSubscriptionDetailsProps {
  licensesUnitPrice: number
  licensesQty: number
  mauUnitPrice: number
  mauQty: number
}
export const FFSubscriptionDetails = ({
  licensesUnitPrice,
  licensesQty,
  mauUnitPrice,
  mauQty
}: FFSubscriptionDetailsProps): React.ReactElement => {
  const { getString } = useStrings()
  const licenseBreakdown = (
    <Text>
      {licensesQty}
      {getString('authSettings.unitPrice')}
      {licensesUnitPrice}
      {getString('common.perMonth')}
    </Text>
  )
  const mausBreakdown = (
    <Layout.Vertical>
      <Text>
        {mauQty}
        {getString('authSettings.unitPrice')}
        {mauUnitPrice}
        {getString('common.perMonth')}
      </Text>
      <Text>{getString('authSettings.firstIncludedFree')}</Text>
    </Layout.Vertical>
  )

  const licenseTotal = licensesUnitPrice * licensesQty
  const mauTotal = mauUnitPrice * mauQty

  return (
    <Layout.Vertical spacing={'large'}>
      <Line
        description={getString('authSettings.costCalculator.developerLicenses')}
        breakdown={licenseBreakdown}
        price={licenseTotal}
      />
      <Line description={getString('authSettings.costCalculator.maus')} breakdown={mausBreakdown} price={mauTotal} />
    </Layout.Vertical>
  )
}
