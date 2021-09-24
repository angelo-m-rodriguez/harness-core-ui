import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { Color, Container, Icon, Text } from '@wings-software/uicore'
import ColumnChart from '@cv/components/ColumnChart/ColumnChart'
import { useGetMonitoredServiceOverAllHealthScore } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NoDataCard } from '@common/components/Page/NoDataCard'
import { PageError } from '@common/components/Page/PageError'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import noDataImage from '@cv/assets/noData.svg'
import type { HealthScoreChartProps, SeriesDataPoint, SeriesDataType } from './HealthScoreChart.types'
import { getSeriesData } from './HealthScoreChart.utils'
import type { TimePeriodEnum } from '../../ServiceHealth.constants'
import css from './HealthScoreChart.module.scss'

export default function HealthScoreChart(props: HealthScoreChartProps): JSX.Element {
  const { monitoredServiceIdentifier, duration, setHealthScoreData, timeFormat } = props
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId } = useParams<ProjectPathProps>()
  const [seriesData, setSeriesData] = useState<SeriesDataType>([{ data: [], showInLegend: false }])

  const {
    data: healthScoreData,
    refetch: fetchHealthScore,
    loading,
    error
  } = useGetMonitoredServiceOverAllHealthScore({
    identifier: monitoredServiceIdentifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier,
      duration: duration.value as TimePeriodEnum,
      endTime: Date.now()
    },
    lazy: true
  })

  useEffect(() => {
    if (monitoredServiceIdentifier) {
      fetchHealthScore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, monitoredServiceIdentifier])

  useEffect(() => {
    if (healthScoreData?.data?.healthScores && !isEmpty(healthScoreData?.data?.healthScores)) {
      const series = getSeriesData(healthScoreData.data.healthScores)
      setSeriesData([{ data: series as SeriesDataPoint[], showInLegend: false }])
      if (setHealthScoreData) {
        setHealthScoreData(healthScoreData.data.healthScores)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthScoreData])

  const renderHealthScoreChart = useCallback(() => {
    if (error) {
      return <PageError message={getErrorMessage(error)} onClick={() => fetchHealthScore()} />
    } else if (loading) {
      return (
        <Container className={css.loading}>
          <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
        </Container>
      )
    } else if (!seriesData[0]?.data?.length || seriesData[0].data.every(el => (el as SeriesDataPoint)?.y === 0)) {
      return (
        <NoDataCard
          message={
            <>
              <Text font={{ size: 'small' }} margin={{ top: 'xxsmall' }}>
                {getString('cv.monitoredServices.serviceHealth.noDataAvailableForHealthScore', {
                  duration: duration.label.toLowerCase()
                })}
              </Text>
              <Text font={{ size: 'small' }}>
                {getString('cv.monitoredServices.serviceHealth.pleaseSelectAnotherTimeWindow')}
              </Text>
            </>
          }
          image={noDataImage}
          imageClassName={css.noDataImage}
          containerClassName={css.noData}
        />
      )
    } else {
      return <ColumnChart data={seriesData} timeFormat={timeFormat} />
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, loading, seriesData])

  return (
    <>
      <Container className={css.main}>
        <Container className={css.timelineRow}>
          <Text width={90} className={css.rowLabel}>
            {getString('cv.monitoredServices.serviceHealth.overallHealthScore')}
          </Text>
          {renderHealthScoreChart()}
        </Container>
      </Container>
    </>
  )
}
