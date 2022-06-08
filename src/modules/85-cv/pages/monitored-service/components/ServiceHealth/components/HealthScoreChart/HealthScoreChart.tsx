/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { Container, Text } from '@wings-software/uicore'
import ColumnChart from '@cv/components/ColumnChart/ColumnChart'
import { useGetMonitoredServiceOverAllHealthScore, ResponseHistoricalTrend } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { ColumnData } from '@cv/components/ColumnChart/ColumnChart.types'
import type { HealthScoreChartProps } from './HealthScoreChart.types'
import { getSeriesData } from './HealthScoreChart.utils'
import type { TimePeriodEnum } from '../../ServiceHealth.constants'
import css from './HealthScoreChart.module.scss'

export default function HealthScoreChart(props: HealthScoreChartProps): JSX.Element {
  const {
    monitoredServiceIdentifier,
    duration,
    setHealthScoreData,
    endTime,
    columChartProps,
    hasTimelineIntegration,
    isChangeEventView
  } = props
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId } = useParams<ProjectPathProps>()
  const [seriesData, setSeriesData] = useState<ColumnData[]>([])

  const queryParams = useMemo(() => {
    return {
      accountId,
      projectIdentifier,
      orgIdentifier,
      duration: duration?.value as TimePeriodEnum,
      endTime: endTime || Date.now()
    }
  }, [duration?.value, endTime])

  const {
    data: healthScoreDataWithMSIdentifier,
    refetch: fetchHealthScoreWithMSIdentifier,
    loading: healthScoreDataWithMSIdentifierLoading,
    error: healthScoreDataWithMSIdentifierError
  } = useGetMonitoredServiceOverAllHealthScore({
    identifier: monitoredServiceIdentifier,
    queryParams
  })

  useEffect(() => {
    handleHealthScoreData(healthScoreDataWithMSIdentifier)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthScoreDataWithMSIdentifier])

  const handleHealthScoreData = (healthScoreData: ResponseHistoricalTrend | null): void => {
    if (healthScoreData?.data?.healthScores && !isEmpty(healthScoreData?.data?.healthScores)) {
      const series = getSeriesData(healthScoreData.data.healthScores)
      setSeriesData(series)
      setHealthScoreData?.(healthScoreData.data.healthScores)
    }
  }

  return (
    <Container
      className={cx(css.main, {
        [css.extraMarginForChart]: isChangeEventView
      })}
    >
      <Container className={css.timelineRow}>
        {!isChangeEventView && (
          <Text width={90} className={css.rowLabel}>
            {getString('cv.monitoredServices.serviceHealth.overallHealthScore')}
          </Text>
        )}
        <ColumnChart
          hasTimelineIntegration={hasTimelineIntegration}
          data={seriesData}
          duration={duration}
          leftOffset={90}
          {...columChartProps}
          isLoading={healthScoreDataWithMSIdentifierLoading}
          error={healthScoreDataWithMSIdentifierError}
          refetchOnError={fetchHealthScoreWithMSIdentifier}
        />
      </Container>
    </Container>
  )
}
