/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Container, Text, Icon, Layout } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'

import { useParams } from 'react-router-dom'
import { Classes } from '@blueprintjs/core'
import merge from 'lodash-es/merge'
import { defaultTo, isEmpty } from 'lodash-es'
import moment from 'moment'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { roundNumber, useErrorHandler } from '@pipeline/components/Dashboards/shared'
import { useGetDeploymentHealth, DeploymentDateAndCount } from 'services/cd-ng'
import { PieChart, PieChartProps } from '@cd/components/PieChart/PieChart'

import { numberFormatter } from '@cd/components/Services/common'
import styles from './CDDashboardPage.module.scss'

export interface HealthCardProps {
  title: string
  value?: number
  rate?: number
  primaryChartOptions?: any
  secondaryChartOptions?: any
  layout: 'vertical' | 'horizontal'
  children?: any
  isParent?: boolean
  emptyState?: boolean
  isLoading?: boolean
  pieChartProps?: any
  showPieChart?: boolean
  showLineChart?: boolean
}

// sonar recommedation
const green = 'var(--green-600)'
const red = 'var(--ci-color-red-500)'
const grey = 'var(--grey-500)'

export default function DeploymentsHealthCards(props: any) {
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { range, title } = props

  const { data, loading, error } = useGetDeploymentHealth({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: defaultTo(range?.range[0]?.getTime(), 0),
      endTime: defaultTo(range?.range[1]?.getTime(), 0)
    }
  })

  useErrorHandler(error)
  const { getString } = useStrings()
  const mapTime = (value: DeploymentDateAndCount) => (value?.time ? moment(value.time).format('YYYY-MM-DD') : '')

  const chartsData = useMemo(() => {
    if (data?.data?.healthDeploymentInfo) {
      const ret: any = {}
      if (data?.data?.healthDeploymentInfo?.total) {
        const { countList, production, nonProduction } = defaultTo(data?.data?.healthDeploymentInfo?.total, {})
        if (countList?.length) {
          ret.totalChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
            chart: {
              height: 40,
              width: 125
            },
            xAxis: {
              categories: countList?.map(mapTime)
            },
            series: [
              {
                name: 'Deployments',
                type: 'line',
                color: 'var(--ci-color-blue-500)',
                data: countList?.map(val => val?.deployments?.count)
              }
            ]
          })
        }

        ret.totalBarChartOptions = merge({}, defaultChartOptions, secondaryChartOptions, {
          xAxis: {
            categories: [`Non Prod (${nonProduction})`, `Prod (${production})`]
          },
          series: [
            {
              type: 'bar',
              name: 'Non Prod',
              color: 'var(--grey-600)',
              data: [nonProduction, 0]
            },
            {
              type: 'bar',
              name: 'Prod',
              color: 'var(--grey-600)',
              data: [0, production]
            }
          ]
        })
      }
      if (data?.data?.healthDeploymentInfo?.success?.countList?.length) {
        ret.successChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
          xAxis: {
            categories: data.data.healthDeploymentInfo.success.countList.map(mapTime)
          },
          series: [
            {
              name: 'Deployments',
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: data.data.healthDeploymentInfo.success.countList.map(val => val?.deployments?.count)
            }
          ]
        })
      }
      if (data?.data?.healthDeploymentInfo?.failure?.countList?.length) {
        ret.failureChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
          xAxis: {
            categories: data.data.healthDeploymentInfo.failure.countList.map(mapTime)
          },
          series: [
            {
              name: 'Deployments',
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: data.data.healthDeploymentInfo.failure.countList.map(val => val?.deployments?.count)
            }
          ]
        })
      }
      if (data?.data?.healthDeploymentInfo?.active?.countList?.length) {
        ret.activeChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
          xAxis: {
            categories: data.data.healthDeploymentInfo.active.countList.map(mapTime)
          },
          series: [
            {
              name: 'Deployments',
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: data.data.healthDeploymentInfo.active.countList.map(val => val?.deployments?.count)
            }
          ]
        })
      }
      return ret
    }
  }, [data])
  const dataInfo = data?.data?.healthDeploymentInfo

  const noDataState = dataInfo?.total?.nonProduction === 0 && dataInfo?.total?.production === 0
  const emptyState = dataInfo?.total?.count === 0

  const pieChartProps: PieChartProps = {
    items: [
      {
        label: getString('cd.serviceDashboard.nonProd'),
        value: defaultTo(data?.data?.healthDeploymentInfo?.total?.nonProduction, 0),
        formattedValue: numberFormatter(data?.data?.healthDeploymentInfo?.total?.nonProduction),
        color: noDataState ? grey : 'var(--primary-2)'
      },
      {
        label: getString('cd.serviceDashboard.prod'),
        value: defaultTo(data?.data?.healthDeploymentInfo?.total?.production, 0),
        formattedValue: numberFormatter(data?.data?.healthDeploymentInfo?.total?.production),
        color: noDataState ? grey : 'var(--primary-7)'
      }
    ],
    size: 60,
    customCls: styles.topDepPiechart,
    showInRevOrder: true,

    options: {
      tooltip: {
        enabled: false
      }
    }
  }

  const labelsHtml = (
    <Layout.Vertical className={styles.labelStyles}>
      {!isEmpty(pieChartProps.items) ? (
        <ul>
          {pieChartProps.items.map(({ label, formattedValue, value, color }) => (
            <li style={{ color }} key={`${label}_${value}`}>
              <Text
                className={styles.listStyles}
                key={label}
                lineClamp={1}
                tooltip={<Text padding={'small'}>{value}</Text>}
                alwaysShowTooltip={formattedValue !== value.toString()}
              >{`${label} (${formattedValue ? formattedValue : value})`}</Text>
            </li>
          ))}
        </ul>
      ) : null}
    </Layout.Vertical>
  )

  pieChartProps['labelsContent'] = labelsHtml

  return (
    <Container>
      <Text className={styles.healthCardTitle}>{title}</Text>
      <Container className={styles.healthCards}>
        <HealthCard
          title="Total Executions"
          value={defaultTo(dataInfo?.total?.count, 0)}
          isLoading={loading}
          layout="vertical"
          rate={defaultTo(dataInfo?.total?.rate, 0)}
          primaryChartOptions={chartsData?.totalChartOptions}
          isParent={true}
          emptyState={emptyState}
          showLineChart={dataInfo?.total?.count ? true : false}
        >
          <HealthCard
            title="Successful"
            value={defaultTo(dataInfo?.success?.count, 0)}
            rate={defaultTo(dataInfo?.success?.rate, 0)}
            isLoading={loading}
            layout="vertical"
            primaryChartOptions={chartsData?.successChartOptions}
            emptyState={emptyState}
          />
          <HealthCard
            title="Failed"
            value={defaultTo(dataInfo?.failure?.count, 0)}
            rate={defaultTo(dataInfo?.failure?.rate, 0)}
            isLoading={loading}
            layout="vertical"
            primaryChartOptions={chartsData?.failureChartOptions}
            emptyState={emptyState}
          />
          <HealthCard
            title="Active"
            value={defaultTo(dataInfo?.active?.count, 0)}
            rate={defaultTo(dataInfo?.active?.rate, 0)}
            isLoading={loading}
            layout="vertical"
            primaryChartOptions={chartsData?.activeChartOptions}
            emptyState={emptyState}
          />
        </HealthCard>

        <TotalDepHealthCard
          title={'Environment Changes'}
          layout={'horizontal'}
          pieChartProps={pieChartProps}
          showPieChart={true}
        />
      </Container>
    </Container>
  )
}

export function TotalDepHealthCard({ title, layout, pieChartProps = {}, showPieChart = false }: HealthCardProps) {
  return (
    <Container font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_600}>
      {showPieChart ? (
        <Layout.Vertical className={styles.totalCard}>
          <Container style={layout === 'horizontal' ? { display: 'flex', justifyContent: 'space-between' } : {}}>
            <Text className={styles.cardHeader}>{title}</Text>
          </Container>
          {showPieChart && <PieChart {...pieChartProps} />}
        </Layout.Vertical>
      ) : (
        <Container className={styles.totalCard} height="100%">
          <Text className={styles.cardHeader}>{title}</Text>
        </Container>
      )}
    </Container>
  )
}

const rateStyle = (rate: number, isParent: boolean): JSX.Element => {
  return rate ? (
    <>
      <Text
        margin={{ left: isParent ? 'small' : 'xsmall' }}
        style={{
          color: rate > 0 ? green : red
        }}
      >
        {numberFormatter(Math.abs(defaultTo(roundNumber(rate), 0)))}%
      </Text>
      <Icon
        size={14}
        name={rate > 0 ? 'caret-up' : 'caret-down'}
        style={{
          color: rate > 0 ? green : red
        }}
      />
    </>
  ) : (
    <>
      <Icon
        size={14}
        name="caret-right"
        style={{
          color: grey
        }}
        margin={{ left: isParent ? 'small' : 0 }}
      />
      <Text style={{ color: grey }}>0%</Text>
    </>
  )
}

export function HealthCard({
  title,
  value,
  rate,
  primaryChartOptions,
  secondaryChartOptions,
  layout,
  children,
  isLoading,
  emptyState,
  isParent = false
}: HealthCardProps) {
  return (
    <Container font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_600} className={styles.healthCard}>
      <Text className={styles.cardHeader}>{title}</Text>
      <Container style={layout === 'horizontal' ? { display: 'flex', justifyContent: 'space-between' } : {}}>
        <Container className={styles.layoutParent}>
          <Container className={styles.textAndRate}>
            {isLoading ? (
              <Container height={30} width={100} className={Classes.SKELETON} />
            ) : (
              <>
                <Text
                  className={styles.cardText}
                  lineClamp={1}
                  tooltip={<Text padding={'small'}>{value}</Text>}
                  alwaysShowTooltip={numberFormatter(value) !== value?.toString()}
                >
                  {numberFormatter(value)}
                </Text>
                {typeof rate === 'number' && !isLoading && isParent && !emptyState ? (
                  <Container flex>{rateStyle(rate, isParent)}</Container>
                ) : null}
              </>
            )}
          </Container>

          {primaryChartOptions && !isLoading && !emptyState ? (
            <Container className={styles.chartWrap}>
              <HighchartsReact highcharts={Highcharts} options={primaryChartOptions} />
              {typeof rate === 'number' && !isLoading && !isParent && !emptyState ? (
                <Container flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                  {rateStyle(rate, isParent)}
                </Container>
              ) : null}
            </Container>
          ) : null}
          {secondaryChartOptions && !isLoading && rate ? (
            <Container className={styles.chartWrap} margin={{ top: 'large' }}>
              <HighchartsReact highcharts={Highcharts} options={secondaryChartOptions} />
              {typeof rate === 'number' && rate && !isLoading ? (
                <Container flex>
                  <Text
                    margin={{ left: 'xsmall' }}
                    style={{
                      color: rate >= 0 ? green : red
                    }}
                  >
                    {numberFormatter(Math.abs(defaultTo(roundNumber(rate), 0)))}%
                  </Text>
                  <Icon
                    size={14}
                    name={rate >= 0 ? 'caret-up' : 'caret-down'}
                    style={{
                      color: rate >= 0 ? green : red
                    }}
                  />
                </Container>
              ) : null}
            </Container>
          ) : null}
        </Container>
        <Container className={styles.childCard}>{children}</Container>
      </Container>
    </Container>
  )
}

const defaultChartOptions: Highcharts.Options = {
  chart: {
    animation: false,
    backgroundColor: 'transparent',
    height: 25,
    spacing: [5, 0, 5, 0]
  },
  credits: undefined,
  title: {
    text: ''
  },
  legend: {
    enabled: false
  },
  plotOptions: {
    series: {
      marker: {
        states: {
          hover: {
            enabled: false
          }
        },
        enabled: false,
        radius: 1
      }
    }
  },
  tooltip: {
    enabled: false,
    outside: true
  },
  xAxis: {
    title: {
      text: ''
    },
    labels: {
      enabled: false
    },
    gridLineWidth: 0,
    lineWidth: 0,
    tickLength: 0
  },
  yAxis: {
    labels: { enabled: false },
    title: {
      text: ''
    },
    gridLineWidth: 0,
    lineWidth: 0,
    tickLength: 0
  }
}

const primaryChartOptions: Highcharts.Options = {
  tooltip: {
    enabled: true
  },
  plotOptions: {
    line: {
      lineWidth: 2,
      marker: {
        enabled: false
      }
    }
  },
  yAxis: {
    min: -1
  }
}

const secondaryChartOptions: Highcharts.Options = {
  chart: {
    height: 80
  },
  plotOptions: {
    bar: {
      stacking: 'normal',
      pointPadding: 0,
      borderWidth: 3,
      borderRadius: 4,
      pointWidth: 20
    }
  },
  xAxis: {
    labels: {
      enabled: true,
      style: {
        fontSize: '8',
        color: '#9293AB',
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, sans-serif'
      }
    }
  }
}
