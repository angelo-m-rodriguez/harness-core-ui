/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Container, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetDeploymentExecution } from 'services/cd-ng'
import NoDeployments from '@pipeline/components/Dashboards/images/NoDeployments.svg'

import { useErrorHandler } from '@pipeline/components/Dashboards/shared'
import { OverviewChartsWithToggle } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'
import { getTooltip } from '@pipeline/utils/DashboardUtils'
import styles from './CDDashboardPage.module.scss'

export default function DeploymentExecutionsChart(props: any) {
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { range, title } = props

  const { data, error } = useGetDeploymentExecution({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: range?.range[0]?.getTime() || 0,
      endTime: range?.range[1]?.getTime() || 0
    }
  })

  useErrorHandler(error)
  const chartData = useMemo(() => {
    if (data?.data?.executionDeploymentList?.length) {
      const successData: number[] = []
      const failureData: number[] = []
      const custom: any = []
      data.data.executionDeploymentList.forEach(val => {
        successData.push(defaultTo(val.deployments?.success, 0))
        failureData.push(defaultTo(val.deployments?.failure, 0))
        custom.push(val)
      })
      return [
        {
          name: 'Failed',
          data: failureData,
          color: '#EE5F54',
          custom
        },
        {
          name: 'Success',
          data: successData,
          color: '#5FB34E',
          custom
        }
      ]
    }
  }, [data])
  const { getString } = useStrings()

  const failedData = chartData?.find(item => item.name === 'Failed') as any
  const allFailedCount = failedData?.data?.every((item: any) => item === 0)

  const chartSuccessData = chartData?.find(item => item.name === 'Success') as any
  const allSuccessCount = chartSuccessData?.data?.every((item: any) => item === 0)
  return (
    <>
      <Text className={styles.healthCardTitle}>{title}</Text>

      {allFailedCount && allSuccessCount ? (
        <Container className={styles.emptyView}>
          <Container className={styles.emptyViewCard}>
            <img src={NoDeployments} />
            <Text>{getString('common.noDeployments')}</Text>
          </Container>
        </Container>
      ) : (
        <div className={styles.chartContainer}>
          <OverviewChartsWithToggle
            data={defaultTo(chartData, [])}
            customChartOptions={{
              tooltip: {
                hideDelay: 5000,
                stickOnContact: true,
                useHTML: true,
                formatter: function () {
                  return getTooltip(this)
                },
                backgroundColor: Color.BLACK,
                outside: false,
                borderColor: 'black'
              },
              xAxis: {
                title: {
                  text: 'Date'
                },
                labels: {
                  formatter: function (this) {
                    let time = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                    if (data?.data?.executionDeploymentList?.length) {
                      const val = data?.data?.executionDeploymentList?.[this.pos]?.time
                      time = val ? new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : time
                    }
                    return time
                  }
                }
              },
              yAxis: {
                title: {
                  text: getString('pipeline.dashboards.executionsLabel')
                }
              }
            }}
          />
        </div>
      )}
    </>
  )
}
