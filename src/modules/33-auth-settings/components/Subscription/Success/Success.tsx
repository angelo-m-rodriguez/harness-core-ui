/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import type { Module } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'

interface SuccessProps {
  module: Module
  time?: TIME_TYPE
}

const Header = (): React.ReactElement => {
  const { getString } = useStrings()
  return <Text font={{ variation: FontVariation.H3 }}>{getString('authSettings.success.title')}</Text>
}
export const Success = ({ module, time }: SuccessProps): React.ReactElement => {
  const { getString } = useStrings()
  const moduleDescr = `common.purpose.${module}.continuous`
  return (
    <Layout.Vertical padding={{ bottom: 'large' }} spacing={'large'}>
      <Header />
      <Text font={{ variation: FontVariation.H5 }}>
        {getString('authSettings.success.msg', { module: getString(moduleDescr as keyof StringsMap), time })}
      </Text>
    </Layout.Vertical>
  )
}
