/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { QlceViewEntityStatsDataPoint } from 'services/ce/services'
import type { Column } from '@ce/components/PerspectiveGrid/Columns'

interface Props {
  downloadData: QlceViewEntityStatsDataPoint[]
  csvFileName: string
  excludeRowsWithCost?: string
  selectedColumnsToDownload: Column[]
}

export const flattenPerspectiveGridData = (obj: Record<string, any>) => {
  const flattened: Record<string, any> = {}

  Object.keys(obj).forEach(key => {
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenPerspectiveGridData(value))
    } else {
      if (value !== null) {
        flattened[key] = value
      }
    }
  })

  return flattened
}

export const downloadPerspectiveGridAsCsv: (options: Props) => void = ({
  downloadData,
  csvFileName,
  excludeRowsWithCost,
  selectedColumnsToDownload
}) => {
  const firstRow: string[] = []
  const columnKeys: string[] = []

  selectedColumnsToDownload.forEach(key => {
    firstRow.push(key.Header)
    columnKeys.push(key.accessor)
  })

  let rowData = downloadData

  if (excludeRowsWithCost) {
    rowData = rowData.filter(row => row.cost >= Number(excludeRowsWithCost))
  }

  const formattedRowData = rowData.map(row => {
    return columnKeys
      .map(key => {
        const colKey = key
        const flattenedRow = flattenPerspectiveGridData(row)
        const colData = flattenedRow[colKey]

        return colData
      })
      .join(',')
  })

  formattedRowData.unshift(firstRow.join(','))

  downloadContentAsFile({
    data: formattedRowData.join('\n'),
    type: 'text/csv;charset=utf-8;',
    fileName: csvFileName
  })
}

const downloadContentAsFile = ({ data, type, fileName }: { data: string; type: string; fileName: string }): void => {
  const blob = new Blob([data], { type })

  const csvURL = window.URL.createObjectURL(blob)
  const tempLink = document.createElement('a')
  tempLink.href = csvURL
  tempLink.setAttribute('download', fileName)

  tempLink.onclick = function () {
    tempLink.remove()
    window.URL.revokeObjectURL(data)
  }

  tempLink.dispatchEvent(new MouseEvent('click'))
}
