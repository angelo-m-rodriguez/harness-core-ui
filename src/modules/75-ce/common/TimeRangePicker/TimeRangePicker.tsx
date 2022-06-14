/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import { Layout, Text, Button, Container, Icon } from '@wings-software/uicore'
import { DateRangePicker } from '@blueprintjs/datetime'
import moment from 'moment'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { Popover, Position, Classes } from '@blueprintjs/core'
import { useStrings, UseStringsReturn } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import {
  DATE_RANGE_SHORTCUTS,
  DATE_RANGE_SHORTCUTS_NAME,
  CE_DATE_FORMAT_INTERNAL,
  getStartDateTime,
  getEndDateTime
} from '@ce/utils/momentUtils'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import type { setTimeRangeFn } from '@ce/types'
import css from './TimeRangePicker.module.scss'

const getDateLabelToDisplayText: (getString: UseStringsReturn['getString']) => Record<string, string> = getString => {
  return {
    [DATE_RANGE_SHORTCUTS_NAME.LAST_7_DAYS]: getString('ce.perspectives.timeRangeConstants.last7Days'),
    [DATE_RANGE_SHORTCUTS_NAME.CURRENT_MONTH]: getString('ce.perspectives.timeRangeConstants.thisMonth'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_30_DAYS]: getString('projectsOrgs.landingDashboard.last30Days'),
    [DATE_RANGE_SHORTCUTS_NAME.THIS_QUARTER]: getString('ce.perspectives.timeRangeConstants.thisQuarter'),
    [DATE_RANGE_SHORTCUTS_NAME.THIS_YEAR]: getString('ce.perspectives.timeRangeConstants.thisYear'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_MONTH]: getString('ce.perspectives.timeRangeConstants.lastMonth'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_QUARTER]: getString('ce.perspectives.timeRangeConstants.lastQuarter'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_YEAR]: getString('ce.perspectives.timeRangeConstants.lastYear'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_3_MONTHS]: getString('ce.perspectives.timeRangeConstants.last3Months'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_6_MONTHS]: getString('ce.perspectives.timeRangeConstants.last6Months'),
    [DATE_RANGE_SHORTCUTS_NAME.LAST_12_MONTHS]: getString('ce.perspectives.timeRangeConstants.last12Months')
  }
}

const RECOMMENDED_DATES = [
  {
    label: DATE_RANGE_SHORTCUTS_NAME.LAST_7_DAYS,
    dateRange: DATE_RANGE_SHORTCUTS.LAST_7_DAYS,
    dateFormat: ['MMM D', 'MMM D']
  },
  {
    label: DATE_RANGE_SHORTCUTS_NAME.CURRENT_MONTH,
    dateRange: DATE_RANGE_SHORTCUTS.CURRENT_MONTH,
    dateFormat: ['MMM YYYY']
  }
]

const RELATIVE_DATES = [
  {
    label: DATE_RANGE_SHORTCUTS_NAME.LAST_7_DAYS,
    dateRange: DATE_RANGE_SHORTCUTS.LAST_7_DAYS,
    dateFormat: ['MMM D', 'MMM D']
  },
  {
    label: DATE_RANGE_SHORTCUTS_NAME.LAST_30_DAYS,
    dateRange: DATE_RANGE_SHORTCUTS.LAST_30_DAYS,
    dateFormat: ['MMM D', 'MMM D']
  }
]

const CURRENT_MONTH = {
  label: DATE_RANGE_SHORTCUTS_NAME.CURRENT_MONTH,
  dateRange: DATE_RANGE_SHORTCUTS.CURRENT_MONTH,
  dateFormat: ['MMM YYYY']
}

const THIS_QUARTER = {
  label: DATE_RANGE_SHORTCUTS_NAME.THIS_QUARTER,
  dateRange: DATE_RANGE_SHORTCUTS.THIS_QUARTER,
  dateFormat: ['MMM', 'MMM YYYY']
}

const THIS_YEAR = {
  label: DATE_RANGE_SHORTCUTS_NAME.THIS_YEAR,
  dateRange: DATE_RANGE_SHORTCUTS.THIS_YEAR,
  dateFormat: ['YYYY']
}
const LAST_MONTH = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_MONTH,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_MONTH,
  dateFormat: ['MMM YYYY']
}
const LAST_YEAR = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_YEAR,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_YEAR,
  dateFormat: ['YYYY']
}
const LAST_QUARTER = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_QUARTER,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_QUARTER,
  dateFormat: ['MMM', 'MMM YYYY']
}
const LAST_3_MONTHS = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_3_MONTHS,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_3_MONTHS,
  dateFormat: ['MMM YYYY', 'MMM YYYY']
}
const LAST_6_MONTHS = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_6_MONTHS,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_6_MONTHS,
  dateFormat: ['MMM YYYY', 'MMM YYYY']
}

const LAST_12_MONTHS = {
  label: DATE_RANGE_SHORTCUTS_NAME.LAST_12_MONTHS,
  dateRange: DATE_RANGE_SHORTCUTS.LAST_12_MONTHS,
  dateFormat: ['MMM YYYY', 'MMM YYYY']
}

const CALENDAR_MONTH_DATES = [
  CURRENT_MONTH,
  THIS_QUARTER,
  THIS_YEAR,
  LAST_MONTH,
  LAST_QUARTER,
  LAST_YEAR,
  LAST_3_MONTHS,
  LAST_6_MONTHS,
  LAST_12_MONTHS
]

const RESTRICTED_CALENDAR_MONTH_DATES = [
  THIS_QUARTER,
  THIS_YEAR,
  LAST_QUARTER,
  LAST_YEAR,
  LAST_3_MONTHS,
  LAST_6_MONTHS,
  LAST_12_MONTHS
]

interface DateLabelRendererProps {
  text: DATE_RANGE_SHORTCUTS_NAME
  dateRange: moment.Moment[]
  dateFormat: string[]
  onClick: () => void
  disable?: boolean
}

const DateLabelRenderer: React.FC<DateLabelRendererProps> = ({ text, dateRange, dateFormat, onClick, disable }) => {
  const { getString } = useStrings()

  const labelToTextMapping = getDateLabelToDisplayText(getString)

  return (
    <Container onClick={disable ? noop : onClick} className={cx(css.dateLabelContainer, Classes.POPOVER_DISMISS)}>
      <Layout.Horizontal
        style={{
          justifyContent: 'space-between'
        }}
        spacing="large"
      >
        <Text className={css.pointerText} color={disable ? Color.GREY_200 : Color.GREY_600}>
          {labelToTextMapping[text]}
        </Text>
        <Text className={css.pointerText} color={disable ? Color.GREY_200 : Color.GREY_300}>{`${dateRange[0].format(
          dateFormat[0]
        )} ${dateFormat[1] ? '- ' + dateRange[1].format(dateFormat[1]) : ''}`}</Text>
      </Layout.Horizontal>
    </Container>
  )
}

interface TimeRangePickerProps {
  setTimeRange: setTimeRangeFn
  timeRange: {
    to: string
    from: string
  }
  featureEnabled?: boolean
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({ timeRange, setTimeRange }) => {
  const { getString } = useStrings()

  const { licenseInformation } = useLicenseStore()
  const isFreeEdition = licenseInformation['CE']?.edition === ModuleLicenseType.FREE

  const isFeatureEnforcementEnabled = useFeatureFlag(FeatureFlag.FEATURE_ENFORCEMENT_ENABLED)

  const featureEnforced = isFreeEdition && isFeatureEnforcementEnabled

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean | undefined>()

  const labelToTextMapping = getDateLabelToDisplayText(getString)

  const { dateLabelText } = useMemo(() => {
    const filteredArray = Object.keys(DATE_RANGE_SHORTCUTS).filter(short => {
      const date = DATE_RANGE_SHORTCUTS[short]
      if (
        timeRange.from === date[0].format(CE_DATE_FORMAT_INTERNAL) &&
        timeRange.to === date[1].format(CE_DATE_FORMAT_INTERNAL)
      ) {
        return true
      }
    })
    if (filteredArray.length) {
      return {
        dateLabelKey: filteredArray[0],
        dateLabelText: labelToTextMapping[filteredArray[0]]
      }
    }
    return {
      dateLabelKey: DATE_RANGE_SHORTCUTS_NAME.LAST_7_DAYS,
      dateLabelText: `${timeRange.from} - ${timeRange.to}`
    }
  }, [timeRange])

  const fromDate: Date | undefined = new Date(getStartDateTime(timeRange.from))
  const toDate: Date | undefined = new Date(getEndDateTime(timeRange.to))

  const maxDate = new Date(moment().add(30, 'day').valueOf())

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      onClose={() => {
        setIsPopoverOpen(undefined)
      }}
      isOpen={isPopoverOpen}
      content={
        <Layout.Vertical
          spacing="large"
          padding={{
            top: 'small',
            bottom: 'small'
          }}
        >
          {featureEnforced && <SubscriptionLimitWarning />}
          <Layout.Vertical
            margin={{
              bottom: 'medium'
            }}
          >
            <Text
              padding={{
                top: 'small',
                bottom: 'small',
                left: 'large',
                right: 'large'
              }}
              font={{ weight: 'semi-bold' }}
              color="grey800"
            >
              {getString('ce.perspectives.timeRange.recommended')}
            </Text>
            {RECOMMENDED_DATES.map(item => {
              return (
                <DateLabelRenderer
                  key={`recommended-${item.label}`}
                  dateFormat={item.dateFormat}
                  dateRange={item.dateRange}
                  text={item.label}
                  onClick={() => {
                    setTimeRange({
                      from: item.dateRange[0].format(CE_DATE_FORMAT_INTERNAL),
                      to: item.dateRange[1].format(CE_DATE_FORMAT_INTERNAL)
                    })
                  }}
                />
              )
            })}

            <Popover
              position={Position.LEFT_TOP}
              modifiers={{
                flip: { enabled: true },
                keepTogether: { enabled: true },
                preventOverflow: { enabled: true }
              }}
              isOpen={isPopoverOpen}
              disabled={featureEnforced}
              content={
                <DateRangePicker
                  defaultValue={[fromDate, toDate]}
                  allowSingleDayRange={true}
                  contiguousCalendarMonths={false}
                  shortcuts={false}
                  maxDate={maxDate}
                  onChange={val => {
                    if (val[0] && val[1]) {
                      const from = moment(val[0]).format(CE_DATE_FORMAT_INTERNAL)
                      const to = moment(val[1]).format(CE_DATE_FORMAT_INTERNAL)

                      setTimeRange({
                        from: from,
                        to: to
                      })
                      setIsPopoverOpen(false)
                    }
                  }}
                />
              }
            >
              <Text
                padding={{
                  top: 'small',
                  bottom: 'small',
                  left: 'large',
                  right: 'large'
                }}
                color={featureEnforced ? 'grey200' : 'primary7'}
                className={css.pointerText}
              >
                {getString('ce.perspectives.timeRange.selectCustomRange')}
              </Text>
            </Popover>
          </Layout.Vertical>

          <Layout.Vertical
            margin={{
              bottom: 'medium'
            }}
          >
            <Text
              padding={{
                top: 'small',
                bottom: 'small',
                left: 'large',
                right: 'large'
              }}
              font={{ weight: 'semi-bold' }}
              color="grey800"
            >
              {getString('ce.perspectives.timeRange.relativeDates')}
            </Text>
            {RELATIVE_DATES.map(item => {
              return (
                <DateLabelRenderer
                  key={`recommended-${item.label}`}
                  dateFormat={item.dateFormat}
                  dateRange={item.dateRange}
                  text={item.label}
                  onClick={() => {
                    setTimeRange({
                      from: item.dateRange[0].format(CE_DATE_FORMAT_INTERNAL),
                      to: item.dateRange[1].format(CE_DATE_FORMAT_INTERNAL)
                    })
                  }}
                />
              )
            })}
          </Layout.Vertical>

          <Layout.Vertical>
            <Text
              padding={{
                top: 'small',
                bottom: 'small',
                left: 'large',
                right: 'large'
              }}
              font={{ weight: 'semi-bold' }}
              color="grey800"
            >
              {getString('ce.perspectives.timeRange.calendarMonths')}
            </Text>
            {CALENDAR_MONTH_DATES.map(item => {
              return (
                <DateLabelRenderer
                  disable={featureEnforced && RESTRICTED_CALENDAR_MONTH_DATES.includes(item)}
                  key={`recommended-${item.label}`}
                  dateFormat={item.dateFormat}
                  dateRange={item.dateRange}
                  text={item.label}
                  onClick={() => {
                    setTimeRange({
                      from: item.dateRange[0].format(CE_DATE_FORMAT_INTERNAL),
                      to: item.dateRange[1].format(CE_DATE_FORMAT_INTERNAL)
                    })
                  }}
                />
              )
            })}
          </Layout.Vertical>
        </Layout.Vertical>
      }
    >
      <Button
        intent="primary"
        minimal
        padding="small"
        className={css.timeRangeButton}
        text={dateLabelText}
        icon="calendar"
        iconProps={{
          size: 16
        }}
        rightIcon="caret-down"
      />
    </Popover>
  )
}

const SubscriptionLimitWarning = () => {
  const { getString } = useStrings()
  return (
    <Container className={css.subscriptionLimitCtn}>
      <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
        <Icon name="info-message" size={24} style={{ color: Color.BLUE_700 }} />
        <Container>
          <Text inline color={Color.GREY_800}>
            {getString('ce.perspectives.timeRangeLimitWarning.currentPlanOffer')}
          </Text>
          <Upgrade />
          <Text inline color={Color.GREY_800}>
            {getString('ce.perspectives.timeRangeLimitWarning.upgradeOffer')}
          </Text>
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}

const Upgrade = () => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  return (
    <Link to={routes.toSubscriptions({ accountId, moduleCard: 'ce', tab: 'PLANS' })}>
      <Text inline margin={{ top: 'small' }} color={Color.PRIMARY_7} style={{ padding: '0px 5px' }}>
        {getString('common.upgrade')}
      </Text>
    </Link>
  )
}

export default TimeRangePicker
