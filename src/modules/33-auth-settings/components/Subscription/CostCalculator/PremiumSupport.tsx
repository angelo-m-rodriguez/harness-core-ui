/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout, Container, Checkbox, Popover } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { PopoverInteractionKind, Classes, Position } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { TIME_TYPE } from '@auth-settings/pages/subscriptions/plans/planUtils'
import css from './CostCalculator.module.scss'

const PremLabel = ({ time, setTime }: { time: TIME_TYPE; setTime: (time: TIME_TYPE) => void }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal
      flex={{ justifyContent: 'space-between', alignItems: 'start' }}
      width={'90%'}
      padding={{ top: 'xsmall' }}
    >
      <Layout.Vertical>
        <Layout.Horizontal flex={{ alignItems: 'start' }} spacing="small">
          <Text
            className={css.crownLabel}
            padding={{ bottom: 'xsmall' }}
            font={{ variation: FontVariation.SMALL }}
            icon="crown"
            iconProps={{ color: Color.ORANGE_700 }}
          >
            {getString('authSettings.costCalculator.premSupport.title')}
          </Text>
          {time === TIME_TYPE.MONTHLY && (
            <Text
              rightIcon="arrow-right"
              rightIconProps={{ color: Color.PRIMARY_6 }}
              onClick={() => setTime(TIME_TYPE.YEARLY)}
              font={{ size: 'small', weight: 'semi-bold' }}
              color={Color.PRIMARY_6}
              className={css.switchToYearly}
            >
              {getString('authSettings.costCalculator.switchToYearly')}
            </Text>
          )}
        </Layout.Horizontal>
        <ul className={css.premLabel}>
          <li key={'line1'}>
            <Text font={{ size: 'xsmall' }}>{getString('authSettings.costCalculator.premSupport.line1')}</Text>
          </li>
          <li key={'line2'}>
            <Text font={{ size: 'xsmall' }}>{getString('authSettings.costCalculator.premSupport.line2')}</Text>
          </li>
          <li key={'line3'}>
            <Text font={{ size: 'xsmall' }}>{getString('authSettings.costCalculator.premSupport.line3')}</Text>
          </li>
        </ul>
      </Layout.Vertical>
      <Text font={{ size: 'xsmall' }}>{getString('authSettings.costCalculator.premSupport.includedByDefault')}</Text>
    </Layout.Horizontal>
  )
}

export const PremiumSupport = ({
  value,
  onChange,
  disabled,
  time,
  setTime
}: {
  value: boolean
  onChange: (value: boolean) => void
  disabled: boolean
  time: TIME_TYPE
  setTime: (time: TIME_TYPE) => void
}): React.ReactElement => {
  const { getString } = useStrings()
  const checkbox = disabled ? (
    <Popover
      interactionKind={PopoverInteractionKind.HOVER}
      popoverClassName={Classes.DARK}
      position={Position.BOTTOM}
      content={
        <Text padding={'medium'} color={Color.GREY_100} font={{ size: 'small' }}>
          {getString('authSettings.costCalculator.switchTooltip')}
        </Text>
      }
    >
      <Checkbox size={12} checked={value} onChange={() => onChange(!value)} disabled className={css.checkbox} />
    </Popover>
  ) : (
    <Checkbox size={12} checked={value} onChange={() => onChange(!value)} className={css.checkbox} />
  )
  return (
    <Container className={css.premSupport}>
      <Layout.Horizontal>
        {checkbox}
        <PremLabel time={time} setTime={setTime} />
      </Layout.Horizontal>
    </Container>
  )
}
