/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { Container, Text, FlexExpander, Layout } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { noop } from 'lodash-es'
import cx from 'classnames'
import {
  useFetchWorkloadTimeSeriesQuery,
  useFetchWorkloadGridQuery,
  useFetchNodeSummaryQuery,
  QlceViewFilterOperator,
  ViewFieldIdentifier,
  QlceViewFilterWrapperInput,
  QlceViewTimeGroupType,
  InstanceDetails
} from 'services/ce/services'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { getViewFilterForId, getTimeFilters, GROUP_BY_POD, getTimeRangeFilter } from '@ce/utils/perspectiveUtils'
import CloudCostInsightChart from '@ce/components/CloudCostInsightChart/CloudCostInsightChart'
import { CCM_CHART_TYPES } from '@ce/constants'
import PerspectiveTimeRangePicker from '@ce/components/PerspectiveTimeRangePicker/PerspectiveTimeRangePicker'
import { DAYS_FOR_TICK_INTERVAL } from '@ce/components/CloudCostInsightChart/Chart'
import {
  CE_DATE_FORMAT_INTERNAL,
  DATE_RANGE_SHORTCUTS,
  getGMTEndDateTime,
  getGMTStartDateTime,
  DEFAULT_TIME_RANGE
} from '@ce/utils/momentUtils'
import { CCM_PAGE_TYPE, TimeRangeFilterType } from '@ce/types'
import PerspectiveGrid from '@ce/components/PerspectiveGrid/PerspectiveGrid'
import { Page } from '@common/exports'
import WorkloadSummary from '@ce/components/WorkloadSummary/WorkloadSummary'
import EmptyView from '@ce/images/empty-state.svg'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { Aggregation, AggregationFunctionMapping } from './constants'
import css from './NodeDetailsPage.module.scss'

const NodeDetailsPage: () => JSX.Element = () => {
  const { clusterName, nodeId, perspectiveId, perspectiveName, accountId } = useParams<{
    clusterName: string
    nodeId: string
    perspectiveId: string
    perspectiveName: string
    accountId: string
  }>()

  const { getString } = useStrings()
  const [chartDataAggregation, setChartDataAggregation] = useState<Aggregation>(Aggregation.Average)
  const [timeRange, setTimeRange] = useQueryParamsState<TimeRangeFilterType>('timeRange', DEFAULT_TIME_RANGE)

  const isDateRangeInLast7Days = useMemo(() => {
    const last7DaysRange = DATE_RANGE_SHORTCUTS['LAST_7_DAYS']
    return (
      getGMTStartDateTime(timeRange.from) >= getGMTStartDateTime(last7DaysRange[0].format(CE_DATE_FORMAT_INTERNAL)) &&
      getGMTEndDateTime(timeRange.to) <= getGMTEndDateTime(last7DaysRange[1].format(CE_DATE_FORMAT_INTERNAL))
    )
  }, [timeRange])

  const filters = useMemo(() => {
    const commonFilters = [
      ...getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to)),
      {
        idFilter: {
          values: [clusterName],
          operator: QlceViewFilterOperator.In,
          field: {
            fieldId: 'clusterName',
            fieldName: 'Cluster Name',
            identifierName: ViewFieldIdentifier.Cluster,
            identifier: ViewFieldIdentifier.Cluster
          }
        }
      }
    ] as QlceViewFilterWrapperInput[]
    if (perspectiveId) {
      return [getViewFilterForId(perspectiveId), ...commonFilters]
    }
    return commonFilters
  }, [timeRange.to, timeRange.from, perspectiveId, nodeId, clusterName])

  const isClusterQuery = !perspectiveId

  const [gridResult] = useFetchWorkloadGridQuery({
    variables: {
      filters: [
        ...filters,
        {
          idFilter: {
            values: [nodeId],
            operator: QlceViewFilterOperator.In,
            field: {
              fieldId: 'parentInstanceId',
              fieldName: 'Parent instance id',
              identifierName: ViewFieldIdentifier.Cluster,
              identifier: ViewFieldIdentifier.Cluster
            }
          }
        } as QlceViewFilterWrapperInput
      ],
      isClusterQuery
    }
  })

  const [chartResult] = useFetchWorkloadTimeSeriesQuery({
    variables: {
      filters: [
        ...filters,
        {
          idFilter: {
            values: [nodeId],
            operator: QlceViewFilterOperator.In,
            field: {
              fieldId: 'instanceId',
              fieldName: 'Instance Id',
              identifierName: ViewFieldIdentifier.Cluster,
              identifier: ViewFieldIdentifier.Cluster
            }
          }
        } as QlceViewFilterWrapperInput
      ],
      groupBy: [
        getTimeRangeFilter(isDateRangeInLast7Days ? QlceViewTimeGroupType.Hour : QlceViewTimeGroupType.Day),
        {
          entityGroupBy: { fieldId: 'instanceName', fieldName: 'Node', identifier: ViewFieldIdentifier.Cluster }
        } as any
      ],
      isClusterQuery,
      aggregateFunction: AggregationFunctionMapping[chartDataAggregation]
    }
  })

  const [summaryResult] = useFetchNodeSummaryQuery({
    variables: {
      isClusterQuery,
      gridFilters: [
        ...filters,
        {
          idFilter: {
            values: [nodeId],
            operator: QlceViewFilterOperator.In,
            field: {
              fieldId: 'instanceId',
              fieldName: 'Instance Id',
              identifierName: ViewFieldIdentifier.Cluster,
              identifier: ViewFieldIdentifier.Cluster
            }
          }
        } as QlceViewFilterWrapperInput
      ],
      filters: [
        ...filters,
        {
          idFilter: {
            values: [nodeId],
            operator: QlceViewFilterOperator.In,
            field: {
              fieldId: 'instanceId',
              fieldName: 'Instance Id',
              identifierName: ViewFieldIdentifier.Cluster,
              identifier: ViewFieldIdentifier.Cluster
            }
          }
        } as QlceViewFilterWrapperInput
      ]
    }
  })

  const { data: gridData, fetching: gridFetching } = gridResult
  const { data: chartData, fetching: chartFetching } = chartResult
  const { data: summaryData, fetching: summaryFetching } = summaryResult

  const isChartGridEmpty =
    chartData?.perspectiveTimeSeriesStats?.cpuLimit?.length === 0 &&
    gridData?.perspectiveGrid?.data?.length === 0 &&
    !chartFetching &&
    !gridFetching

  const infoData = summaryData?.perspectiveGrid?.data?.length
    ? (summaryData.perspectiveGrid.data[0]?.instanceDetails as InstanceDetails)
    : ({} as InstanceDetails)

  useDocumentTitle([getString('ce.perspectives.nodeDetails.header'), infoData.name || nodeId], true)

  const breadcrumbsLinks = useMemo(
    () => [
      {
        url: routes.toCEPerspectives({ accountId }),
        label: getString('ce.perspectives.sideNavText')
      },
      {
        url: routes.toPerspectiveDetails({ accountId, perspectiveId, perspectiveName }),
        label: perspectiveName
      }
    ],
    []
  )

  return (
    <>
      <Page.Header title={infoData.name || nodeId} breadcrumbs={<NGBreadcrumbs links={breadcrumbsLinks} />} />
      <Page.Body>
        <Container flex background="white" padding="small">
          <FlexExpander />
          <PerspectiveTimeRangePicker timeRange={timeRange} setTimeRange={setTimeRange} />
        </Container>
        <Container padding="large">
          <WorkloadSummary
            pageType={CCM_PAGE_TYPE.Node}
            summaryData={summaryData?.perspectiveTrendStats as any}
            fetching={summaryFetching}
            infoData={infoData}
          />
        </Container>
        {!isChartGridEmpty && (
          <Container background="white">
            <Container padding="large">
              <Container
                margin={{
                  bottom: 'medium'
                }}
              >
                <Layout.Horizontal spacing="small">
                  <Text className={css.aggregationText} padding="xsmall" font="small">
                    {getString('ce.perspectives.workloadDetails.aggregation.text')}
                  </Text>
                  <div
                    className={cx(css.aggregationTags, {
                      [css.active]: chartDataAggregation === Aggregation.Maximum
                    })}
                    onClick={() => {
                      setChartDataAggregation(Aggregation.Maximum)
                    }}
                  >
                    {getString('ce.perspectives.nodeDetails.aggregation.maximum')}
                  </div>
                  <div
                    className={cx(css.aggregationTags, {
                      [css.active]: chartDataAggregation === Aggregation.Average
                    })}
                    onClick={() => {
                      setChartDataAggregation(Aggregation.Average)
                    }}
                  >
                    {getString('ce.perspectives.nodeDetails.aggregation.average')}
                  </div>
                </Layout.Horizontal>
              </Container>
              <CloudCostInsightChart
                showLegends={false}
                pageType={CCM_PAGE_TYPE.Node}
                chartType={CCM_CHART_TYPES.LINE}
                columnSequence={[]}
                fetching={chartFetching}
                data={chartData?.perspectiveTimeSeriesStats as any}
                aggregation={isDateRangeInLast7Days ? QlceViewTimeGroupType.Hour : QlceViewTimeGroupType.Day}
                xAxisPointCount={DAYS_FOR_TICK_INTERVAL + 1}
              />
            </Container>
            <Container>
              <PerspectiveGrid
                isClusterOnly={true}
                gridData={gridData?.perspectiveGrid?.data as any}
                gridFetching={gridFetching}
                columnSequence={[]}
                setColumnSequence={noop}
                groupBy={GROUP_BY_POD}
              />
            </Container>
          </Container>
        )}
        {isChartGridEmpty && (
          <Container className={css.emptyContainer} background="white">
            <img src={EmptyView} />
            <Text
              margin={{
                top: 'large',
                bottom: 'xsmall'
              }}
              font="small"
              style={{
                fontWeight: 600
              }}
              color={Color.GREY_500}
            >
              {getString('ce.pageErrorMsg.noDataMsg')}
            </Text>
            <Text font="small">{getString('ce.pageErrorMsg.perspectiveNoData')}</Text>
          </Container>
        )}
      </Page.Body>
    </>
  )
}

export default NodeDetailsPage
