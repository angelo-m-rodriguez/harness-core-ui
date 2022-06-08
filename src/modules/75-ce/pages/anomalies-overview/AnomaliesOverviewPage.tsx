/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Container, PageBody, PageHeader, Text, getErrorInfoFromErrorObject } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useModalHook } from '@harness/use-modal'
import { Drawer, Position } from '@blueprintjs/core'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/exports'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { CcmMetaData, QlceViewTimeFilterOperator, useFetchCcmMetaDataQuery } from 'services/ce/services'
import {
  AnomalyData,
  AnomalyFilterProperties,
  AnomalySummary,
  useGetAnomalyWidgetsData,
  useListAnomalies
} from 'services/ce'
import AnomaliesSummary from '@ce/components/AnomaliesSummary/AnomaliesSummary'
import AnomalyFilters from '@ce/components/AnomaliesFilter/AnomaliesFilter'
import AnomaliesListGridView from '@ce/components/AnomaliesListView/AnomaliesListView'
import AnomaliesSearch from '@ce/components/AnomaliesSearch/AnomaliesSearch'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import {
  CE_DATE_FORMAT_INTERNAL,
  DATE_RANGE_SHORTCUTS,
  getGMTEndDateTime,
  getGMTStartDateTime
} from '@ce/utils/momentUtils'
import type { orderType, sortType } from '@common/components/Table/react-table-config'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import type { TimeRangeFilterType } from '@ce/types'
import AnomaliesSettings from '@ce/components/AnomaliesSettings/AnomaliesSettings'
import { PAGE_NAMES } from '@ce/TrackingEventsConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'

const getTimeFilters = (from: number, to: number) => {
  return [
    {
      operator: QlceViewTimeFilterOperator.After,
      timestamp: from
    },
    {
      operator: QlceViewTimeFilterOperator.Before,
      timestamp: to
    }
  ]
}

interface SortByObjInterface {
  sort?: sortType
  order?: orderType
}

const AnomaliesOverviewPage: React.FC = () => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const [searchText, setSearchText] = React.useState('')
  const { accountId } = useParams<AccountPathProps>()
  const [listData, setListData] = useState<AnomalyData[] | null>(null)
  const [costData, setCostData] = useState<AnomalySummary | null>(null)
  const [perspectiveAnomaliesData, setPerspectiveANomaliesData] = useState([])
  const [cloudProvidersWiseData, setCloudProvidersWiseData] = useState([])
  const [statusWiseData, setStatusWiseData] = useState([])
  const [selectedFilterProperties, setSelectedFilterProperties] = useState<AnomalyFilterProperties>({})
  const { trackEvent } = useTelemetry()

  const [timeRange, setTimeRange] = useQueryParamsState<TimeRangeFilterType>('timeRange', {
    to: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[1].format(CE_DATE_FORMAT_INTERNAL),
    from: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[0].format(CE_DATE_FORMAT_INTERNAL)
  })

  const [sortByObj, setSortByObj] = useState<SortByObjInterface>({})

  const drawerProps = {
    autoFocus: true,
    canEscapeKeyClose: true,
    canOutsideClickClose: true,
    enforceFocus: true,
    isOpen: true,
    hasBackdrop: true,
    position: Position.RIGHT,
    usePortal: true,
    size: '54%',
    isCloseButtonShown: true
  }

  const {
    mutate: getAnomaliesList,
    error: isAnomaliesListError,
    loading: isListFetching
  } = useListAnomalies({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const {
    mutate: getAnomalySummary,
    loading: isSummaryDataFetching,
    error: isAnomaliesSummaryError
  } = useGetAnomalyWidgetsData({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  // Fetch the default workload ID's for redirections
  const [ccmMetaResult] = useFetchCcmMetaDataQuery()
  const { data: ccmData, fetching: isFetchingCcmMetaData } = ccmMetaResult

  const ccmMetaData = defaultTo(ccmData?.ccmMetaData, {}) as CcmMetaData

  useEffect(() => {
    const getList = async () => {
      try {
        const response = await getAnomaliesList({
          ...selectedFilterProperties,
          timeFilters: getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to)),
          groupBy: [],
          orderBy: [
            {
              field: sortByObj.sort || 'ACTUAL_COST',
              order: sortByObj.order === 'ASC' ? 'ASCENDING' : 'DESCENDING'
            }
          ],
          searchText: [searchText],
          filterType: 'Anomaly',
          limit: 100,
          offset: 0
        })
        setListData(response?.data as AnomalyData[])
      } catch (error) {
        showError(getErrorInfoFromErrorObject(error))
      }
    }

    getList()
  }, [JSON.stringify(selectedFilterProperties), sortByObj, getAnomaliesList, searchText, timeRange.from, timeRange.to])

  useEffect(() => {
    const getSummary = async () => {
      try {
        const response = await getAnomalySummary({
          ...selectedFilterProperties,
          searchText: [searchText],
          timeFilters: getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to)),
          filterType: 'Anomaly'
        })
        const { data } = response
        parseSummaryData(data)
      } catch (error) {
        showError(getErrorInfoFromErrorObject(error))
      }
    }
    getSummary()
  }, [JSON.stringify(selectedFilterProperties), getAnomalySummary, searchText, timeRange.from, timeRange.to])

  useEffect(() => {
    if (listData && costData) {
      trackEvent(PAGE_NAMES.ANOMALY_LANDING_PAGE, {
        count: listData.length,
        totalCostImpact: costData?.anomalousCost,
        ...selectedFilterProperties,
        timeFilters: getTimeFilters(getGMTStartDateTime(timeRange.from), getGMTEndDateTime(timeRange.to))
      })
    }
  }, [listData, costData])

  /* istanbul ignore next */
  const parseSummaryData = (summaryData: any) => {
    summaryData.forEach((item: any) => {
      switch (item.widgetDescription) {
        case 'TOP_N_ANOMALIES':
          setPerspectiveANomaliesData(item.widgetData)
          break

        case 'TOTAL_COST_IMPACT':
          setCostData(item.widgetData?.[0])
          break

        case 'ANOMALIES_BY_CLOUD_PROVIDERS':
          setCloudProvidersWiseData(item.widgetData)
          break

        case 'ANOMALIES_BY_STATUS':
          setStatusWiseData(item.widgetData)
          break
      }
    })
  }

  const [showModal, hideDrawer] = useModalHook(() => {
    return (
      <Drawer
        onClose={() => {
          hideDrawer()
        }}
        {...drawerProps}
      >
        <AnomaliesSettings hideDrawer={hideDrawer} />
      </Drawer>
    )
  }, [])

  return (
    <>
      <PageHeader
        title={
          <Text
            color="grey800"
            style={{ fontSize: 20, fontWeight: 'bold' }}
            tooltipProps={{ dataTooltipId: 'ccmAnomalies' }}
          >
            {getString('ce.anomalyDetection.sideNavText')}
          </Text>
        }
        breadcrumbs={<NGBreadcrumbs />}
      />
      <AnomalyFilters
        applyFilters={(properties: AnomalyFilterProperties) => {
          setSelectedFilterProperties(properties)
        }}
        ccmMetaData={ccmMetaData}
        setTimeRange={setTimeRange}
        timeRange={timeRange}
      />
      <PageBody loading={isListFetching || isFetchingCcmMetaData || isSummaryDataFetching}>
        <Container
          padding={{
            right: 'xxxlarge',
            left: 'xxxlarge',
            bottom: 'medium',
            top: 'medium'
          }}
        >
          <AnomaliesSearch onChange={setSearchText} showModal={showModal} />
          <AnomaliesSummary
            costData={costData}
            perspectiveAnomaliesData={perspectiveAnomaliesData}
            cloudProvidersWiseData={cloudProvidersWiseData}
            statusWiseData={statusWiseData}
            allDefaultProviders={ccmMetaData}
            isAnomaliesSummaryError={Boolean(isAnomaliesSummaryError)}
          />
          <AnomaliesListGridView
            searchText={searchText}
            timeRange={timeRange}
            listData={listData}
            sortByObj={sortByObj}
            setSortByObj={setSortByObj}
            isAnomaliesListError={Boolean(isAnomaliesListError)}
          />
        </Container>
      </PageBody>
    </>
  )
}

export default AnomaliesOverviewPage
