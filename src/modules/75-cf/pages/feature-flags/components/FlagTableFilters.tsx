/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FilterProps, TableFilters } from '@cf/components/TableFilters/TableFilters'
import { useStrings } from 'framework/strings'
import type { Features } from 'services/cf'
import { FeatureFlagStatus } from '../FlagStatus'

export interface FlagTableFiltersProps {
  features: Features | null | undefined
  currentFilter: FilterProps | Record<string, any>
  updateTableFilter: (filter: FilterProps) => void
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

export const FlagTableFilters: React.FC<FlagTableFiltersProps> = ({ features, currentFilter, updateTableFilter }) => {
  const { getString } = useStrings()
  return (
    <TableFilters
      filters={[
        {
          queryProps: {},
          label: getString('cf.flagFilters.allFlags'),
          total: features?.itemCount || 0
        },
        {
          queryProps: { key: FlagFilterKeys.ENABLED, value: 'true' },
          label: getString('cf.flagFilters.enabled'),
          total: features?.enabledCount || 0,
          tooltipId: 'ff_flagFilters_enabledFlags'
        },
        {
          queryProps: { key: FlagFilterKeys.LIFETIME, value: FlagFilterValues.PERMANENT },
          label: getString('cf.flagFilters.permanent'),
          total: features?.permanentCount || 0,
          tooltipId: 'ff_flagFilters_permanentFlags'
        },
        {
          queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.RECENTLY_ACCESSED },
          label: getString('cf.flagFilters.last24'),
          total: features?.recentlyActiveCount || 0
        },
        {
          queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.ACTIVE },
          label: getString('cf.flagFilters.active'),
          total: features?.activeCount || 0,
          tooltipId: 'ff_flagFilters_activeFlags'
        },
        {
          queryProps: { key: FlagFilterKeys.STATUS, value: FlagFilterValues.POTENTIALLY_STALE },
          label: getString('cf.flagFilters.potentiallyStale'),
          total: features?.potentiallyStaleCount || 0,
          tooltipId: 'ff_flagFilters_potentiallyStaleFlags'
        }
      ]}
      currentFilter={currentFilter}
      updateTableFilter={updateTableFilter}
    />
  )
}
