/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { FlexExpander, Layout, SelectOption, Container } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { pick } from 'lodash-es'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'

import PerspectiveTimeRangePicker from '@ce/components/PerspectiveTimeRangePicker/PerspectiveTimeRangePicker'
import type { setTimeRangeFn } from '@ce/types'
import {
  AnomalyFilterProperties,
  FilterDTO,
  FilterStatsDTO,
  useAnomalyFilterValues,
  useGetFilterList
} from 'services/ce'
import { flattenObject, removeNullAndEmpty } from '@common/components/Filter/utils/FilterUtils'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { anomalyFilterValueColumns } from '@ce/utils/anomaliesUtils'
import type { CcmMetaData } from 'services/ce/services'
import AnomaliesFilterDrawer from './FilterDrawer/FilterDrawer'

import css from '../../pages/anomalies-overview/AnomaliesOverviewPage.module.scss'

interface AnomalyFiltersProps {
  timeRange: {
    to: string
    from: string
  }
  setTimeRange: setTimeRangeFn
  applyFilters: (filterProperties: AnomalyFilterProperties) => void
  ccmMetaData: CcmMetaData
}

const AnomalyFilters: React.FC<AnomalyFiltersProps> = ({ applyFilters, timeRange, setTimeRange, ccmMetaData }) => {
  const { accountId } = useParams<{ accountId: string }>()
  const { getString } = useStrings()

  const [selectedFilter, setSelectedFilter] = useState<FilterDTO | undefined>()

  const [fetchedFilterValues, setFetchedFilterValues] = useState<FilterStatsDTO[]>([])

  const { mutate: fetchFilterValues } = useAnomalyFilterValues({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    const getAnomalyFilters = async () => {
      const response = await fetchFilterValues(anomalyFilterValueColumns)

      setFetchedFilterValues(response.data || [])
    }

    getAnomalyFilters()
  }, [])

  const {
    data: fetchedSavedFilters,
    refetch: refetchSavedFilters,
    loading: savedFiltersLoading
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      type: 'Anomaly'
    }
  })

  const savedFilters = fetchedSavedFilters?.data?.content || []

  const onFilterSelect = (identifier?: string): void => {
    let filter
    if (identifier) {
      filter = savedFilters.find(item => item.identifier === identifier)
    }
    setSelectedFilter(filter)
    applyFilters(filter?.filterProperties || {})
  }

  const onClearAll = (): void => applyFilters({})

  const [openDrawer, closeDrawer] = useModalHook(() => {
    return (
      <AnomaliesFilterDrawer
        refetchSavedFilters={refetchSavedFilters}
        selectedFilter={selectedFilter}
        savedFilters={savedFilters}
        savedFiltersLoading={savedFiltersLoading}
        closeDrawer={closeDrawer}
        selectFilter={setSelectedFilter}
        applyFilter={(filter: FilterDTO) => {
          closeDrawer()
          setSelectedFilter(filter)
          applyFilters(filter.filterProperties)
        }}
        fetchedFilterValues={fetchedFilterValues}
        onClearAll={onClearAll}
        ccmMetaData={ccmMetaData}
      />
    )
  }, [savedFilters, selectedFilter, fetchedFilterValues])

  const fieldToLabelMapping = useMemo(
    () =>
      new Map<string, string>([
        ['gcpProduct', 'GCP Product'],
        ['gcpProjects', 'GCP Project'],
        ['gcpSKUDescriptions', 'GCP SKU Description'],
        ['k8sClusterNames', 'Cluster Name'],
        ['k8sNamespaces', 'Namespace'],
        ['k8sWorkloadNames', 'Workload'],
        ['awsAccounts', 'AWS Account'],
        ['awsServices', 'AWS Service'],
        ['awsUsageTypes', 'AWS Usage Type'],
        ['minActualAmount', getString('ce.anomalyDetection.filters.actualSpend')],
        ['minAnomalousSpend', getString('ce.anomalyDetection.filters.anomalousSpend')]
      ]),
    [getString]
  )

  return (
    <Layout.Horizontal className={css.header}>
      <FlexExpander />
      <FilterSelector<FilterDTO>
        appliedFilter={selectedFilter}
        filters={savedFilters}
        onFilterBtnClick={openDrawer}
        onFilterSelect={(option: SelectOption) => {
          onFilterSelect(option.value as string)
        }}
        fieldToLabelMapping={fieldToLabelMapping}
        filterWithValidFields={removeNullAndEmpty(
          pick(flattenObject(selectedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
        )}
      />
      <Container className={css.separator} />
      <PerspectiveTimeRangePicker timeRange={timeRange} setTimeRange={setTimeRange} />
    </Layout.Horizontal>
  )
}

export default AnomalyFilters
