/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Text, Layout, PillToggle } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { capitalize } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import { FFEquation } from './FFEquation'
import { PremiumSupport } from './PremiumSupport'
import css from './CostCalculator.module.scss'

const Header = ({ time, setTime }: { time: TIME_TYPE; setTime: (time: TIME_TYPE) => void }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical className={css.billingHeader} padding={{ top: 'large', bottom: 'large' }}>
      <Text padding={{ bottom: 'large' }} font={{ variation: FontVariation.BODY1, weight: 'bold' }}>
        {getString('common.subscriptions.tabs.billing')}
      </Text>
      <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }}>
        <PillToggle
          onChange={timeClicked => setTime(timeClicked)}
          options={[
            { label: capitalize(TIME_TYPE.YEARLY), value: TIME_TYPE.YEARLY },
            {
              label: capitalize(TIME_TYPE.MONTHLY),
              value: TIME_TYPE.MONTHLY
            }
          ]}
          selectedView={time}
        />
        {time === TIME_TYPE.MONTHLY && (
          <Text
            icon="dollar"
            iconProps={{ color: Color.GREEN_700, size: 12 }}
            font={{ variation: FontVariation.SMALL }}
            padding={{ left: 'small' }}
          >
            {getString('authSettings.costCalculator.yearlySave')}
          </Text>
        )}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

function getEquationByModule(module: Module): React.ReactElement {
  switch (module) {
    case 'cf': {
      return <FFEquation />
    }
    default:
      return <></>
  }
}

export const Billing = ({ module, initialTime }: { module: Module; initialTime: TIME_TYPE }): React.ReactElement => {
  const [time, setTime] = useState<TIME_TYPE>(initialTime)
  const [prem, setPrem] = useState<boolean>(false)
  const premDisabled = time === TIME_TYPE.MONTHLY
  return (
    <Layout.Vertical spacing={'large'} padding={{ bottom: 'large' }}>
      <Header
        time={time}
        setTime={(newTime: TIME_TYPE) => {
          setTime(newTime)
          if (newTime === TIME_TYPE.MONTHLY) {
            setPrem(false)
          }
        }}
      />
      {getEquationByModule(module)}
      <PremiumSupport disabled={premDisabled} onChange={setPrem} value={prem} time={time} setTime={setTime} />
    </Layout.Vertical>
  )
}
