/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { MultiSelectOption } from '@harness/uicore'
import * as Yup from 'yup'
import { FilterDTO, FilterStatsDTO, useDeleteFilter, usePostFilter, useUpdateFilter } from 'services/ce'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import { UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import { StringUtils } from '@common/exports'
import type { FilterDataInterface } from '@common/components/Filter/Constants'
import type { CcmMetaData } from 'services/ce/services'
import { getAnomalyFilterPropertiesFromForm, getAnomalyFormValuesFromFilterProperties } from './utils'
import AnomaliesFilterForm from './AnomaliesFilterForm'

interface FilterDrawerProps {
  refetchSavedFilters: () => Promise<void>
  selectedFilter?: FilterDTO
  savedFilters?: FilterDTO[]
  savedFiltersLoading: boolean
  closeDrawer: () => void
  selectFilter: (filter: FilterDTO) => void
  applyFilter: (filter: FilterDTO) => void
  fetchedFilterValues: FilterStatsDTO[]
  onClearAll: () => void
  ccmMetaData: CcmMetaData
}

export interface AnomaliesFilterFormType {
  gcpProducts?: MultiSelectOption[]
  gcpProjects?: MultiSelectOption[]
  gcpSKUDescriptions?: MultiSelectOption[]
  k8sClusterNames?: MultiSelectOption[]
  k8sNamespaces?: MultiSelectOption[]
  k8sWorkloadNames?: MultiSelectOption[]
  awsAccounts?: MultiSelectOption[]
  awsServices?: MultiSelectOption[]
  awsUsageTypes?: MultiSelectOption[]
  minActualAmount?: number
  minAnomalousSpend?: number
}

const RecommendationFilterDrawer: React.FC<FilterDrawerProps> = ({
  refetchSavedFilters,
  selectedFilter,
  savedFilters,
  closeDrawer,
  selectFilter,
  applyFilter,
  fetchedFilterValues,
  onClearAll,
  ccmMetaData
}) => {
  const { accountId } = useParams<{ accountId: string }>()
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)

  const { mutate: createFilter } = usePostFilter({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: updateFilter } = useUpdateFilter({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: deleteFilter } = useDeleteFilter({
    queryParams: {
      accountIdentifier: accountId,
      type: 'Anomaly'
    }
  })

  const onFiltersApply = (formData: AnomaliesFilterFormType): void => {
    const filterFromFormData = getAnomalyFilterPropertiesFromForm(formData)

    applyFilter({
      name: UNSAVED_FILTER,
      identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
      filterProperties: filterFromFormData
    })
  }

  /* istanbul ignore next */
  const handleDelete = async (identifier: string): Promise<void> => {
    setIsRefreshingFilters(true)
    selectFilter({
      name: UNSAVED_FILTER,
      identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
      filterProperties: {}
    })
    const deleteHandler = filterRef.current?.deleteFilterHandler
    if (deleteHandler && typeof deleteFilter === 'function') {
      await deleteHandler(identifier)
    }

    await refetchSavedFilters()
    setIsRefreshingFilters(false)
  }

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<AnomaliesFilterFormType, FilterDTO>
  ): Promise<void> => {
    setIsRefreshingFilters(true)
    const saveOrUpdateHandler = filterRef.current?.saveOrUpdateFilterHandler
    if (saveOrUpdateHandler && typeof saveOrUpdateHandler === 'function') {
      const payload = {
        ...data.metadata,
        identifier: isUpdate ? data.metadata.identifier : StringUtils.getIdentifierFromName(data.metadata.name),
        filterProperties: getAnomalyFilterPropertiesFromForm(data.formValues)
      }
      await saveOrUpdateHandler(isUpdate, payload)
    }
    setIsRefreshingFilters(false)
    await refetchSavedFilters()
  }

  return (
    <Filter<AnomaliesFilterFormType, FilterDTO>
      formFields={<AnomaliesFilterForm fetchedFilterValues={fetchedFilterValues} ccmMetaData={ccmMetaData} />}
      validationSchema={Yup.object().shape({
        minActualAmount: Yup.number(),
        minAnomalousSpend: Yup.number()
      })}
      onApply={onFiltersApply}
      filters={savedFilters}
      initialFilter={{
        formValues: selectedFilter ? getAnomalyFormValuesFromFilterProperties(selectedFilter.filterProperties) : {},
        metadata: {
          filterVisibility: selectedFilter?.filterVisibility,
          name: selectedFilter?.name || '',
          identifier: selectedFilter?.identifier || '',
          filterProperties: {}
        }
      }}
      onClear={() => {
        selectFilter({
          name: UNSAVED_FILTER,
          identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
          filterProperties: {}
        })
        onClearAll()
      }}
      onDelete={handleDelete}
      isRefreshingFilters={isRefreshingFilters}
      onFilterSelect={(identifier: string) => {
        if (identifier !== UNSAVED_FILTER) {
          const filter = savedFilters?.find(filtr => filtr.identifier === identifier)
          if (filter) {
            selectFilter(filter)
          }
        }
      }}
      onSuccessfulCrudOperation={refetchSavedFilters}
      onSaveOrUpdate={handleSaveOrUpdate}
      onClose={closeDrawer}
      ref={filterRef}
      dataSvcConfig={
        new Map<CrudOperation, (...rest: any[]) => Promise<any>>([
          ['ADD', createFilter],
          ['UPDATE', updateFilter],
          ['DELETE', deleteFilter]
        ])
      }
    />
  )
}

export default RecommendationFilterDrawer
