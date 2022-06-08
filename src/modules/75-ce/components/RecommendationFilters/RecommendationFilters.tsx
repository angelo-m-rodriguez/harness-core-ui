/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import type { SelectOption } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'

import {
  CCMRecommendationFilterProperties,
  FilterDTO,
  FilterStatsDTO,
  useGetFilterList,
  useRecommendationFilterValues
} from 'services/ce'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { flattenObject, removeNullAndEmpty } from '@common/components/Filter/utils/FilterUtils'
import RecommendationFilterDrawer from './FilterDrawer/FilterDrawer'

interface RecommendationFiltersProps {
  applyFilters: (filterProperties: CCMRecommendationFilterProperties) => void
}

const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({ applyFilters }) => {
  const { accountId } = useParams<{ accountId: string }>()
  const { getString } = useStrings()

  const [selectedFilter, setSelectedFilter] = useState<FilterDTO | undefined>()

  const [fetchedFilterValues, setFetchedFilterValues] = useState<FilterStatsDTO[]>([])

  const { mutate: fetchFilterValues } = useRecommendationFilterValues({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    const getRecommendationFilters = async () => {
      const response = await fetchFilterValues({
        columns: ['name', 'resourceType', 'namespace', 'clusterName']
      })

      setFetchedFilterValues(response.data || [])
    }

    getRecommendationFilters()
  }, [])

  const {
    data: fetchedSavedFilters,
    refetch: refetchSavedFilters,
    loading: savedFiltersLoading
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      type: 'CCMRecommendation'
    }
  })

  const savedFilters = fetchedSavedFilters?.data?.content || []

  const onFilterSelect = (identifier?: string): void => {
    let filter
    if (identifier) {
      filter = savedFilters.find(item => item.identifier === identifier)
    }
    setSelectedFilter(filter)
    applyFilters?.(filter?.filterProperties || {})
  }

  const onClearAll = (): void => applyFilters({})

  const [openDrawer, closeDrawer] = useModalHook(() => {
    return (
      <RecommendationFilterDrawer
        refetchSavedFilters={refetchSavedFilters}
        selectedFilter={selectedFilter}
        savedFilters={savedFilters}
        savedFiltersLoading={savedFiltersLoading}
        closeDrawer={closeDrawer}
        selectFilter={setSelectedFilter}
        applyFilter={(filter: FilterDTO) => {
          closeDrawer()
          setSelectedFilter(filter)
          applyFilters?.(filter.filterProperties)
        }}
        fetchedFilterValues={fetchedFilterValues}
        onClearAll={onClearAll}
      />
    )
  }, [savedFilters, selectedFilter, fetchedFilterValues])

  const fieldToLabelMapping = useMemo(
    () =>
      new Map<string, string>([
        ['names', getString('ce.recommendation.listPage.filters.name')],
        ['namespaces', getString('ce.recommendation.listPage.filters.namespace')],
        ['clusterNames', getString('ce.recommendation.listPage.filters.clusterName')],
        ['resourceTypes', getString('common.resourceTypeLabel')],
        ['minCost', getString('ce.recommendation.listPage.filters.potentialSpend')],
        ['minSaving', getString('ce.recommendation.listPage.filters.savings')]
      ]),
    [getString]
  )

  return (
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
  )
}

export default RecommendationFilters
