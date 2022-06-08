/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { TimePeriodEnum } from '@cv/pages/monitored-service/components/ServiceHealth/ServiceHealth.constants'
import HealthScoreChart from '@cv/pages/monitored-service/components/ServiceHealth/components/HealthScoreChart/HealthScoreChart'
import ServiceDependenciesLegend from '@cv/components/ServiceDependenciesLegend/ServiceDependenciesLegend'
import { TimelineBar } from '@cv/components/TimelineView/TimelineBar'
import { getColorForChangeEventType } from '@cv/components/ChangeTimeline/ChangeTimeline.utils'
import type { ChangeEventServiceHealthProps } from './ChangeEventServiceHealth.types'
import { TWO_HOURS_IN_MILLISECONDS, COLUMN_CHART_PROPS } from './ChangeEventServiceHealth.constants'
import css from './ChangeEventServiceHealth.module.scss'

export default function ChangeEventServiceHealth(props: ChangeEventServiceHealthProps): JSX.Element {
  const { monitoredServiceIdentifier, startTime: propsStartTime, eventType, timeStamps, setTimestamps } = props
  const { getString } = useStrings()
  return (
    <Container className={css.main}>
      <Text className={css.status}>{getString('status')}</Text>
      <Text className={css.healthTrend}>{getString('cv.serviceHealthTrend')}</Text>
      <HealthScoreChart
        hasTimelineIntegration={false}
        monitoredServiceIdentifier={monitoredServiceIdentifier}
        duration={{ value: TimePeriodEnum.FOUR_HOURS, label: getString('cv.monitoredServices.serviceHealth.last4Hrs') }}
        columChartProps={{
          ...COLUMN_CHART_PROPS,
          timestampMarker: {
            timestamp: propsStartTime,
            color: getColorForChangeEventType(eventType)
          }
        }}
        endTime={propsStartTime + TWO_HOURS_IN_MILLISECONDS}
        setHealthScoreData={riskData => {
          if (!riskData?.length) {
            return
          }
          const newStartTime = riskData[0].startTime
          const newEndTime = riskData[riskData.length - 2].endTime
          if (!newStartTime || !newEndTime) {
            return
          }
          setTimestamps([newStartTime, newEndTime])
        }}
        isChangeEventView
      />
      <TimelineBar startDate={timeStamps[0]} endDate={timeStamps[1]} columnWidth={50} className={css.timestamps} />
      <ServiceDependenciesLegend hideServiceTypeLegend margin={{ top: 'small' }} />
    </Container>
  )
}
