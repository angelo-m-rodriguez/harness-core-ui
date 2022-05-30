/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useEffect, useState } from 'react'
import { Container, Icon } from '@wings-software/uicore'
import type { Column, Row } from 'react-table'
import { isEqual } from 'lodash-es'
import type { QlceViewFieldInputInput, QlceViewEntityStatsDataPoint, Maybe } from 'services/ce/services'
import ColumnSelector from './ColumnSelector'
import { addLegendColorToRow, GridData, getGridColumnsByGroupBy, DEFAULT_COLS } from './Columns'
import Grid from './Grid'
import './test.scss' // will find a alternative
import css from './PerspectiveGrid.module.scss'

export interface PerspectiveGridProps {
  columnSequence?: string[]
  setColumnSequence?: (cols: string[]) => void
  groupBy: QlceViewFieldInputInput
  showColumnSelector?: boolean
  tempGridColumns?: boolean
  gridData: Maybe<Maybe<QlceViewEntityStatsDataPoint>[]> | undefined
  gridFetching: boolean
  isClusterOnly?: boolean
  goToWorkloadDetails?: (clusterName: string, namespace: string, workloadName: string) => void
  highlightNode?: (id: string) => void
  resetNodeState?: () => void
  showPagination?: boolean
  totalItemCount?: number
  fetchData?: (pageIndex: number, pageSize: number) => void
  pageSize?: number
  gridPageIndex?: number
  goToNodeDetails?: (clusterName: string, nodeId: string) => void
  allowExportAsCSV?: boolean
  openDownloadCSVModal?: () => void
}

const PerspectiveGrid: React.FC<PerspectiveGridProps> = props => {
  const {
    columnSequence,
    setColumnSequence,
    groupBy,
    showColumnSelector,
    gridData: response,
    gridFetching: fetching,
    isClusterOnly = false,
    goToWorkloadDetails,
    resetNodeState,
    highlightNode,
    totalItemCount,
    pageSize,
    gridPageIndex,
    fetchData,
    goToNodeDetails,
    allowExportAsCSV = false,
    openDownloadCSVModal
  } = props

  const gridColumns = getGridColumnsByGroupBy(groupBy, isClusterOnly)
  const [selectedColumns, setSelectedColumns] = useState(gridColumns)

  const gridData = useMemo(() => {
    if (!fetching && response?.length) {
      return addLegendColorToRow(response as QlceViewEntityStatsDataPoint[])
    }
    return []
  }, [response, fetching])

  useEffect(() => {
    const newColumnSequence = gridData.slice(0, 12).map(row => row['id'])
    if (!isEqual(columnSequence, newColumnSequence) && setColumnSequence) {
      setColumnSequence(newColumnSequence as string[])
    }
  }, [gridData])

  useEffect(() => {
    setSelectedColumns(getGridColumnsByGroupBy(groupBy, isClusterOnly))
  }, [groupBy, isClusterOnly])

  if (fetching) {
    return (
      <Container className={css.gridLoadingContainer}>
        <Icon name="spinner" color="blue500" size={30} />
      </Container>
    )
  }

  const { fieldName } = groupBy

  const onRowClick = (row: Row<GridData>) => {
    if (fieldName === 'Workload Id' && isClusterOnly) {
      const { clusterName, namespace, workloadName } = row.original
      goToWorkloadDetails &&
        clusterName &&
        namespace &&
        workloadName &&
        goToWorkloadDetails(clusterName, namespace, workloadName)
    }
    if (fieldName === 'Node' && isClusterOnly) {
      const { clusterName, nodeId } = row.original as any
      goToNodeDetails && clusterName && nodeId && goToNodeDetails(clusterName, nodeId)
    }
  }

  const isRowClickable = fieldName === 'Workload Id' || fieldName === 'Node'

  return (
    <Container background="white">
      {showColumnSelector && (
        <ColumnSelector
          allowExportAsCSV={allowExportAsCSV}
          openDownloadCSVModal={openDownloadCSVModal}
          columns={gridColumns}
          selectedColumns={selectedColumns}
          onChange={columns => setSelectedColumns(columns)}
        />
      )}
      <Grid<GridData>
        data={gridData}
        onRowClick={onRowClick}
        onMouseEnter={row => {
          highlightNode && row.original.id && highlightNode(row.original.id)
        }}
        onMouseLeave={() => {
          resetNodeState && resetNodeState()
        }}
        columns={props.tempGridColumns ? (DEFAULT_COLS as Column<GridData>[]) : (selectedColumns as Column<GridData>[])}
        showPagination={props.showPagination}
        totalItemCount={totalItemCount}
        gridPageIndex={gridPageIndex}
        pageSize={pageSize}
        fetchData={fetchData}
        isRowClickable={isRowClickable}
      />
    </Container>
  )
}

PerspectiveGrid.defaultProps = {
  showColumnSelector: true
}

export default PerspectiveGrid
