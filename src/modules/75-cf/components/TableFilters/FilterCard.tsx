/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Layout, Text } from '@harness/uicore'
import type { FilterProps } from './TableFilters'
interface FilterCardProps {
  filter: FilterProps
  selected: boolean
  updateTableFilter: (filter: FilterProps) => void
}

export const FilterCard: React.FC<FilterCardProps> = ({ filter, selected, updateTableFilter }) => (
  <Card
    interactive
    elevation={1}
    onClick={() => {
      updateTableFilter(filter)
    }}
    style={{ minWidth: '150px', maxWidth: '250px' }}
    selected={selected}
  >
    <Layout.Vertical>
      <Text font={{ size: 'small' }} lineClamp={1} tooltipProps={{ dataTooltipId: filter.tooltipId }}>
        {filter.label}
      </Text>
      {<Text font={{ size: 'large' }}>{filter.total}</Text>}
    </Layout.Vertical>
  </Card>
)
