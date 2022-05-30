/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
import React, { FC, useMemo } from 'react'
import { TableV2 } from '@harness/uicore'
import type { Column } from 'react-table'
import type { Feature } from 'services/cf'
import { useStrings } from 'framework/strings'
import FlagDetailsCell from './FlagDetailsCell'
import VariationsCell from './VariationsCell'
import VariationsWithPercentageRolloutCell from './VariationsWithPercentageRolloutCell'
import AddFlagCheckboxCell from './AddFlagCheckboxCell'
import DeleteFlagButtonCell from './DeleteFlagButtonCell'

import css from './FlagsListing.module.scss'

export interface TargetManagementFlagsListingProps {
  flags: Feature[]
  includePercentageRollout?: boolean
  includeAddFlagCheckbox?: boolean
  disableRowVariations?: (flag: Feature) => boolean
  onRowDelete?: (flag: Feature) => void
  ReasonTooltip?: FC
}

const TargetManagementFlagsListing: FC<TargetManagementFlagsListingProps> = ({
  flags,
  includePercentageRollout = false,
  includeAddFlagCheckbox = false,
  onRowDelete,
  disableRowVariations = () => false,
  ReasonTooltip = ({ children }) => children
}) => {
  const { getString } = useStrings()

  const columns = useMemo<Column<Feature>[]>(() => {
    let flagColWidth = 100

    if (includeAddFlagCheckbox) {
      flagColWidth -= 5
    }

    if (onRowDelete) {
      flagColWidth -= 5
    }

    const cols: Column<Feature>[] = [
      {
        Header: getString('cf.segmentDetail.headingFeatureFlag'),
        width: `calc(${flagColWidth}% - 300px)`,
        id: 'flag-info',
        Cell: FlagDetailsCell
      },
      {
        Header: getString('cf.segmentDetail.headingVariation'),
        id: 'variation',
        width: '300px',
        accessor: (flag: Feature) => ({
          disabled: disableRowVariations(flag),
          ReasonTooltip
        }),
        Cell: includePercentageRollout ? VariationsWithPercentageRolloutCell : VariationsCell
      }
    ]

    if (includeAddFlagCheckbox) {
      cols.unshift({
        Header: '',
        width: '5%',
        id: 'checked',
        Cell: AddFlagCheckboxCell
      })
    }

    if (onRowDelete) {
      cols.push({
        Header: '',
        width: '5%',
        id: 'actions',
        accessor: (flag: Feature) => ({
          onRowDelete: () => onRowDelete(flag),
          ReasonTooltip
        }),
        Cell: DeleteFlagButtonCell
      })
    }

    return cols
  }, [disableRowVariations, includeAddFlagCheckbox, onRowDelete])

  return (
    <TableV2<Feature>
      className={css.autoHeight}
      getRowClassName={() => css.alignBaseline}
      columns={columns}
      data={flags}
    />
  )
}

export default TargetManagementFlagsListing
