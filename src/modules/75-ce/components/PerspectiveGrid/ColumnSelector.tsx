/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { Container, Icon, Checkbox, Layout, Text, FlexExpander } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { Column } from './Columns'
import css from './ColumnSelector.module.scss'

interface ColumnSelectorProps {
  columns: Column[]
  selectedColumns: Column[]
  onChange: (cols: Column[]) => void
  openDownloadCSVModal?: () => void
  allowExportAsCSV?: boolean
}

const ColumSelector = (props: ColumnSelectorProps): JSX.Element => {
  const { getString } = useStrings()
  const { columns, selectedColumns, onChange, openDownloadCSVModal, allowExportAsCSV = false } = props

  const handleSelectOne = (column: Column): void => {
    const originalPosition = columns.indexOf(column)
    const idx = selectedColumns.indexOf(column)
    const sc =
      idx > -1
        ? [...selectedColumns.slice(0, idx), ...selectedColumns.slice(idx + 1)]
        : [...selectedColumns.slice(0, originalPosition), column, ...selectedColumns.slice(originalPosition)]

    onChange(sc)
  }

  return (
    <Layout.Horizontal style={{ alignItems: 'flex-end' }}>
      {allowExportAsCSV ? (
        <Text
          onClick={openDownloadCSVModal}
          font={{ variation: FontVariation.SMALL_BOLD }}
          rightIcon="launch"
          color={Color.PRIMARY_7}
          rightIconProps={{ size: 12, color: Color.PRIMARY_7 }}
          className={css.exportCsvBtn}
        >
          {getString('ce.perspectives.exportCSV')}
        </Text>
      ) : null}
      <FlexExpander />
      <Popover
        interactionKind={PopoverInteractionKind.CLICK}
        position={Position.BOTTOM_LEFT}
        modifiers={{
          arrow: { enabled: false },
          flip: { enabled: true },
          keepTogether: { enabled: true },
          preventOverflow: { enabled: true }
        }}
        content={
          <div className={css.dropDown}>
            {columns.map(column => {
              return (
                <div key={column.accessor} className={css.columnInfo}>
                  <Checkbox
                    disabled={column.hideable === false}
                    label={column.Header}
                    onClick={() => handleSelectOne(column)}
                    checked={selectedColumns.includes(column)}
                    data-testid={`checkbox-${column.accessor}`}
                  />
                </div>
              )
            })}
          </div>
        }
      >
        <Container className={css.container}>
          <div className={css.selectBtn}>
            <span>{getString('ce.gridColumnSelector')}</span>
            <Icon name="chevron-down" />
          </div>
        </Container>
      </Popover>
    </Layout.Horizontal>
  )
}

export default ColumSelector
