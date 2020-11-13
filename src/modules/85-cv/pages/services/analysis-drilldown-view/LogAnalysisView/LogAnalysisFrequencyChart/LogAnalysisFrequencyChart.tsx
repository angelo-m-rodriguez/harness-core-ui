import { Container } from '@wings-software/uikit'
import React, { useEffect, useMemo } from 'react'
import type { SeriesColumnOptions } from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import cx from 'classnames'
import { useGet } from 'restful-react'
import { useRouteParams } from 'framework/exports'
import { RestResponseSortedSetLogDataByTag, useGetTagCount } from 'services/cv'
import getLogViewcolumnChartConfig from './LogViewColumnChartConfig'
import { categoryNameToCategoryType } from '../../../CVServicePageUtils'
import i18n from './LogAnalysisFrequencyChart.i18n'
import css from './LogAnalysisFrequencyChart.module.scss'

interface LogAnalysisFrequencyChartProps {
  environmentIdentifier?: string
  serviceIdentifier?: string
  categoryName: string
  startTime: number
  endTime: number
  className?: string
}

interface ActivityLogAnalysisFrequencyChartProps {
  activityId: string
  projectIdentifier: string
  orgIdentifier: string
  startTime: number
  endTime: number
  className?: string
}

interface LogAnalysisFrequencyViewProps {
  data?: any
  startTime: number
  endTime: number
}

const FIVE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 5

function generatePointsForLogChart(data: RestResponseSortedSetLogDataByTag, startTime: number, endTime: number): any {
  if (!data?.resource) {
    return data
  }

  const content = data.resource
  const columnChartData = [
    {
      type: 'column',
      name: i18n.dataCategoryNames.notAnomalous,
      data: [],
      color: 'var(--blue-500)'
    },
    {
      type: 'column',
      name: i18n.dataCategoryNames.anomalous,
      data: [],
      color: 'var(--red-600)'
    }
  ] as SeriesColumnOptions[]
  const categories = []

  content.sort((logDataA, logDataB) => {
    if (!logDataA?.timestamp) {
      return logDataB?.timestamp ? -1 : 0
    }
    if (!logDataB?.timestamp) {
      return 1
    }

    return logDataA?.timestamp - logDataB?.timestamp
  })

  const nearest5thMinute = new Date(
    Math.round(startTime / FIVE_MINUTES_IN_MILLISECONDS) * FIVE_MINUTES_IN_MILLISECONDS
  ).getTime()

  // set up categories(x axis) and the total number of data points
  for (let i = nearest5thMinute; i <= endTime; i += 300000) {
    categories.push(i)
    columnChartData[0]?.data?.push(0)
    columnChartData[1]?.data?.push(0)
  }

  let logDataIndex = 0
  for (let timestampIndex = 0; timestampIndex < categories.length; timestampIndex++) {
    const tagBuckets = content[logDataIndex]
    if (!tagBuckets?.countByTags?.length || tagBuckets?.timestamp !== categories[timestampIndex]) continue

    logDataIndex++
    for (const tag of tagBuckets.countByTags) {
      if (tag.tag === 'KNOWN') {
        const arr: number[] = columnChartData[0].data as number[]
        arr[timestampIndex] += tag.count || 0
      } else if (tag.tag) {
        const arr: number[] = columnChartData[1].data as number[]
        arr[timestampIndex] += tag.count || 0
      }
    }
  }

  return { columnChartData, categories }
}

export default function LogAnalysisFrequencyChart(props: LogAnalysisFrequencyChartProps): JSX.Element {
  const {
    params: { accountId, orgIdentifier, projectIdentifier }
  } = useRouteParams()
  const { environmentIdentifier, serviceIdentifier, categoryName, startTime, endTime, className } = props
  const { data, refetch } = useGetTagCount({
    lazy: true
  })

  useEffect(() => {
    refetch({
      queryParams: {
        accountId,
        orgIdentifier: orgIdentifier as string,
        projectIdentifier: projectIdentifier as string,
        monitoringCategory: (categoryName ? categoryNameToCategoryType(categoryName) : undefined) as string,
        startTime,
        endTime,
        environmentIdentifier,
        serviceIdentifier
      }
    })
  }, [startTime, endTime, categoryName, serviceIdentifier, environmentIdentifier])
  return (
    <Container className={cx(css.main, className)}>
      <LogAnalysisFrequencyView data={data} startTime={startTime} endTime={endTime} />
    </Container>
  )
}

export function ActivityLogAnalysisFrequencyChart({
  activityId,
  projectIdentifier,
  orgIdentifier,
  startTime,
  endTime
}: ActivityLogAnalysisFrequencyChartProps) {
  const {
    params: { accountId }
  } = useRouteParams()
  const { data } = useGet(`/cv/api/log-dashboard/${activityId}/log-count-by-tags`, {
    queryParams: {
      accountId,
      projectIdentifier,
      orgIdentifier,
      startTime,
      endTime
    }
  })
  return <LogAnalysisFrequencyView data={data} startTime={startTime} endTime={endTime} />
}

function LogAnalysisFrequencyView({ data, startTime, endTime }: LogAnalysisFrequencyViewProps) {
  const columnChartOptions: Highcharts.Options | undefined = useMemo(() => {
    if (data) {
      const { categories, columnChartData } = generatePointsForLogChart(data, startTime, endTime)
      return getLogViewcolumnChartConfig(columnChartData, categories, startTime, endTime)
    }
  }, [data])

  return <HighchartsReact highcharts={Highcharts} options={columnChartOptions} />
}
