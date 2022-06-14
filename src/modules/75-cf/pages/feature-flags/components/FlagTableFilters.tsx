/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FilterProps, TableFilters } from '@cf/components/TableFilters/TableFilters'
import type { Features } from 'services/cf'
import { FeatureFlagStatus } from '../FlagStatus'

export interface FlagTableFiltersProps {
  features?: Features | null
  currentFilter: FilterProps | Record<string, any>
  updateTableFilter: (filter: FilterProps | Record<string, any>) => void
}

export enum FlagFilterKeys {
  LIFETIME = 'lifetime',
  STATUS = 'status',
  ENABLED = 'enabled'
}

export const FlagFilterValues = {
  ...FeatureFlagStatus,
  ACTIVE: 'active',
  PERMANENT: 'permanent'
}

export const featureFlagFilters = (features?: Features | null): Array<FilterProps> => [
  {
    queryProps: {},
    label: 'cf.flagFilters.allFlags',
    total: features?.featureCounts?.totalFeatures || 0
  },
  {
    queryProps: { key: FlagFilterKeys.ENABLED, value: 'true' },
    label: 'cf.flagFilters.enabled',
    total: features?.featureCounts?.totalEnabled || 0,
    tooltipId: 'ff_flagFilters_enabledFlags'
  },
  {
    queryProps: { key: FlagFilterKeys.LIFETIME, value: FlagFilterValues.PERMANENT },
    label: 'cf.flagFilters.permanent',
    total: features?.featureCounts?.totalPermanent || 0,
    tooltipId: 'ff_flagFilters_permanentFlags'
  },
  {
    queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.RECENTLY_ACCESSED },
    label: 'cf.flagFilters.last24',
    total: features?.featureCounts?.totalRecentlyAccessed || 0
  },
  {
    queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.ACTIVE },
    label: 'cf.flagFilters.active',
    total: features?.featureCounts?.totalActive || 0,
    tooltipId: 'ff_flagFilters_activeFlags'
  },
  {
    queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.POTENTIALLY_STALE },
    label: 'cf.flagFilters.potentiallyStale',
    total: features?.featureCounts?.totalPotentiallyStale || 0,
    tooltipId: 'ff_flagFilters_potentiallyStaleFlags'
  }
]

export const FlagTableFilters: React.FC<FlagTableFiltersProps> = ({ features, currentFilter, updateTableFilter }) => {
  return (
    <TableFilters
      filters={featureFlagFilters(features)}
      currentFilter={currentFilter}
      updateTableFilter={updateTableFilter}
    />
  )
}
