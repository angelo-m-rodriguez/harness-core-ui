/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import { FilterCard } from './FilterCard'

export interface FilterProps {
  label: string
  total: number
  queryProps?: Record<string, any>
  tooltipId?: string
}
export interface TableFiltersProps {
  filters: Array<FilterProps>
  currentFilter: FilterProps | Record<string, any>
  updateTableFilter: (filter: FilterProps) => void
}

export const TableFilters: React.FC<TableFiltersProps> = ({ filters, currentFilter, updateTableFilter }) => (
  <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
    {filters?.map((filter, i) => {
      const filterSelected =
        currentFilter?.queryProps?.key === filter?.queryProps?.key &&
        currentFilter?.queryProps?.value === filter?.queryProps?.value
      return <FilterCard key={i} filter={filter} updateTableFilter={updateTableFilter} selected={filterSelected} />
    })}
  </Layout.Horizontal>
)
