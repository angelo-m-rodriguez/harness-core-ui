/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import ConfettiExplosion from 'react-confetti-explosion'
import { Layout, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import type { Module } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import type { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import Hero from './img/hero.svg'
import css from './Success.module.scss'

interface SuccessProps {
  module: Module
  time?: TIME_TYPE
}

const bigExplosion = {
  force: 0.6,
  duration: 5000,
  particleCount: 200,
  floorHeight: 1600,
  floorWidth: 1600
}

export const Success = ({ module, time }: SuccessProps): React.ReactElement => {
  const { getString } = useStrings()
  const moduleDescr = `common.purpose.${module}.continuous`
  return (
    <div>
      <div className={css.confetti}>
        <ConfettiExplosion {...bigExplosion} />
      </div>
      <Layout.Vertical padding={{ bottom: 'large' }} spacing={'large'} flex={{ align: 'center-center' }}>
        <img src={Hero} />
        <Layout.Horizontal>
          <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.success.woohoo')}</Text>
          <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.success.title')}</Text>
        </Layout.Horizontal>
        <Text font={{ variation: FontVariation.H5 }}>
          {getString('authSettings.success.msg', { module: getString(moduleDescr as keyof StringsMap), time })}
        </Text>
      </Layout.Vertical>
    </div>
  )
}
