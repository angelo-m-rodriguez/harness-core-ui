/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { Color } from '@harness/design-system'
import { Card, Container, Layout, Text, PageError } from '@wings-software/uicore'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { GetInstanceCountHistoryQueryParams, useGetInstanceCountHistory } from 'services/cd-ng'
import { DeploymentsTimeRangeContext, numberFormatter } from '@cd/components/Services/common'
import { useStrings } from 'framework/strings'
import { getReadableDateTime } from '@common/utils/dateUtils'
import { PageSpinner, TimeSeriesAreaChart } from '@common/components'
import type { TimeSeriesAreaChartProps } from '@common/components/TimeSeriesAreaChart/TimeSeriesAreaChart'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import css from '@cd/components/ServiceDetails/InstanceCountHistory/InstanceCountHistory.module.scss'

const instanceCountHistoryChartColors = ['#9CCC65', '#47D5DF', '#AE82FC', '#FFA86B', '#0BB6FF']

const InstanceCountHistoryTooltip: React.FC<any> = props => {
  const { timestamp, labels, envData } = props
  const currentDate = getReadableDateTime(timestamp)
  return (
    <Card className={css.tooltipCard}>
      <Layout.Vertical>
        <Text
          font={{ size: 'small' }}
          width="100%"
          className={css.tooltipTimestamp}
          margin={{ bottom: 'medium' }}
          padding={{ bottom: 'small' }}
        >
          {currentDate}
        </Text>
        <Layout.Horizontal margin={{ bottom: 'xsmall' }}>
          <Text width="60%" font={{ size: 'small' }} color={Color.GREY_500} padding={{ right: 'small' }}>
            {labels[0]}
          </Text>
          <Text font={{ size: 'small' }} color={Color.GREY_500}>
            {labels[1]}
          </Text>
        </Layout.Horizontal>
        {envData.map((env: { name: string; value: number }, index: number) => (
          <Layout.Horizontal key={env.name} margin={{ bottom: 'xsmall' }}>
            <Layout.Horizontal
              style={{ background: instanceCountHistoryChartColors[index % instanceCountHistoryChartColors.length] }}
              width="10px"
              height="6px"
              margin={{ right: 'small' }}
              className={css.tooltipSeriesColor}
            ></Layout.Horizontal>
            <Text
              width="60%"
              color={Color.GREY_600}
              font={{ size: 'small', weight: 'semi-bold' }}
              className={css.tooltipEnvName}
              padding={{ right: 'small' }}
            >
              {env.name}
            </Text>
            <Text color={Color.GREY_600} font={{ size: 'small', weight: 'semi-bold' }}>
              {numberFormatter(env.value)}
            </Text>
          </Layout.Horizontal>
        ))}
      </Layout.Vertical>
    </Card>
  )
}

export const InstanceCountHistory: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()
  const { timeRange } = useContext(DeploymentsTimeRangeContext)
  const { getString } = useStrings()
  const envData = useRef<Record<string, Record<string, number>>>({})

  const queryParams: GetInstanceCountHistoryQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId,
    startTime: timeRange?.range[0]?.getTime() || 0,
    endTime: timeRange?.range[1]?.getTime() || 0
  }
  const { loading, data, error, refetch } = useGetInstanceCountHistory({ queryParams })

  const seriesData: TimeSeriesAreaChartProps['seriesData'] = useMemo(() => {
    const envMap: Record<string, Record<string, number>> = {}
    data?.data?.timeValuePairList?.forEach(timeValuePair => {
      const envId = timeValuePair.value?.envId
      if (!envId) {
        return
      }
      if (!envMap[envId]) {
        envMap[envId] = {}
      }
      const timestamp = `${timeValuePair.timestamp || 0}`
      envMap[envId][timestamp] = timeValuePair.value?.count || 0
    })
    envData.current = envMap

    return Object.values(envMap)
      .slice(0, 49)
      .map((envSeries, index) => ({
        custom: Object.keys(envSeries)
          .slice(0, -1)
          .map(envKey => ({ x: parseInt(envKey), y: envSeries[envKey] }))
          .sort((valA, valB) => valA.x - valB.x),
        data: Object.values(envSeries).slice(0, -1),
        color: instanceCountHistoryChartColors[index % instanceCountHistoryChartColors.length]
      }))
  }, [data])

  const dataList = data?.data?.timeValuePairList
  const customChartOptions: Highcharts.Options = useMemo(
    () => ({
      chart: { height: 220, spacing: [25, 0, 25, 0] },
      legend: { enabled: false },
      xAxis: {
        title: {
          text: 'Date'
        },
        allowDecimals: false,
        labels: {
          formatter: function () {
            let time = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
            if (dataList?.length) {
              const val = dataList?.[this.pos]?.timestamp
              time = val ? new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : time
            }
            return time
          }
        }
      },
      yAxis: {
        title: {
          text: '# of Instances'
        },
        max: Math.max(...(data?.data?.timeValuePairList || []).map(timeValuePair => timeValuePair.value?.count || 0))
      },
      tooltip: {
        useHTML: true,
        borderWidth: 0,
        padding: 0,
        formatter: function () {
          return '<div id="instance-count-history-widget-tooltip" style="width: 300px"></div>'
        }
      },
      plotOptions: {
        area: {
          pointStart: 0,
          stacking: 'normal',
          animation: false,
          point: {
            events: {
              mouseOver: function () {
                const el = document.getElementById('instance-count-history-widget-tooltip')
                if (el) {
                  const custom = this.series.userOptions.custom
                  const timestamp = defaultTo(custom?.[this.x].x, 0)
                  const tooltipProps = {
                    timestamp,
                    labels: [getString('cd.serviceDashboard.envName'), getString('common.instanceLabel')],
                    envData: Object.keys(envData.current).map(envKey => ({
                      name: envKey,
                      value: envData.current[envKey][timestamp || 0] || 0
                    }))
                  }
                  ReactDOM.render(<InstanceCountHistoryTooltip {...tooltipProps} />, el)
                }
              }
            }
          }
        }
      }
    }),
    [data]
  )

  const getComponent = (): React.ReactElement => {
    if (loading) {
      return <PageSpinner />
    }
    if (error) {
      return <PageError onClick={() => refetch()} />
    }
    if (!data?.data?.timeValuePairList?.length) {
      return (
        <Layout.Vertical height="100%" flex={{ align: 'center-center' }}>
          <Container margin={{ bottom: 'medium' }}>
            <img width="50" height="50" src={MostActiveServicesEmptyState} style={{ alignSelf: 'center' }} />
          </Container>
          <Text color={Color.GREY_400}>
            {getString('cd.serviceDashboard.noServiceInstances', {
              timeRange: timeRange?.label
            })}
          </Text>
        </Layout.Vertical>
      )
    }
    return <TimeSeriesAreaChart seriesData={seriesData} customChartOptions={customChartOptions} />
  }

  return (
    <Card className={css.instanceCountHistory}>
      <Text font={{ weight: 'semi-bold' }} color={Color.GREY_600} margin={{ bottom: 'small' }}>
        {getString('cd.serviceDashboard.instanceCountHistory')}
      </Text>
      {getComponent()}
    </Card>
  )
}
