/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import {
  Text,
  Layout,
  Button,
  Popover,
  Switch,
  Container,
  Icon,
  Select,
  MultiSelectOption,
  ButtonVariation,
  TableV2
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { CellProps, Renderer, Column } from 'react-table'
import { Classes, Menu, PopoverInteractionKind, Position, Tag } from '@blueprintjs/core'
import { startCase } from 'lodash-es'
import produce from 'immer'
import { useStrings } from 'framework/strings'
import type { NotificationRules, PipelineEvent } from 'services/pipeline-ng'
import { getIconByNotificationMethod } from '@notifications/Utils/Utils'
import type { NotificationType } from '@notifications/interfaces/Notifications'
import { useNotificationModal } from './useNotificationModal'
import { PipelineEventType } from './Steps/PipelineEvents'
import { Actions } from './NotificationUtils'
import { getAllNotificationTypeSelectOption, NotificationTypeSelectOptions } from './NotificationTypeOptions'
import { useVariablesExpression } from '../PipelineStudio/PiplineHooks/useVariablesExpression'
import css from './NotificationTable.module.scss'

export interface NotificationRulesItem {
  index: number
  notificationRules: NotificationRules
}

export interface NotificationTableProps {
  data: NotificationRulesItem[]
  onUpdate?: (data?: NotificationRulesItem, action?: Actions, closeModal?: () => void) => void
  onFilterType: (type: string | undefined) => void
  filterType: string | undefined
  gotoPage: (index: number) => void
  totalPages: number
  totalItems: number
  pageItemCount?: number
  pageSize: number
  pageIndex: number
  stagesOptions?: MultiSelectOption[]
  getExistingNotificationNames?: (skipIndex?: number) => string[]
  isReadonly?: boolean
}

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  onUpdate?: (data: NotificationRulesItem) => void
}

export const getPipelineEventColor = (option?: Required<PipelineEvent>['type']): Color => {
  switch (option) {
    case PipelineEventType.ALL_EVENTS:
      return Color.BLUE_500
    case PipelineEventType.PipelineSuccess:
      return Color.BLUE_300
    case PipelineEventType.StageSuccess:
      return Color.BLUE_300
    case PipelineEventType.StageFailed:
      return Color.BLUE_300
    case PipelineEventType.StageStart:
      return Color.BLUE_300
    case PipelineEventType.PipelineEnd:
      return Color.BLUE_300
    case PipelineEventType.PipelineStart:
      return Color.BLUE_300
  }
  return Color.GREY_200
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnEnabled: Renderer<CellProps<NotificationRulesItem>> = ({ row, column }) => {
  const data = row.original
  return (
    <Switch
      checked={data.notificationRules.enabled}
      onChange={e => {
        ;(column as any).onUpdate?.(
          produce(data, draft => {
            draft.notificationRules.enabled = e.currentTarget.checked
          }),
          Actions.Update
        )
      }}
      disabled={(column as any).disabled}
    />
  )
}
// eslint-disable-next-line react/function-component-definition
const RenderColumnName: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
  const data = row.original
  return (
    <Text color={Color.BLACK} lineClamp={1}>
      {data.notificationRules.name}
    </Text>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnEvents: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
  const data = row.original.notificationRules.pipelineEvents?.map(event => event.type)
  const baseData = data?.slice(0, 3)
  const popoverData = data?.slice(3, data.length)
  return (
    <Layout.Horizontal spacing="xsmall">
      {baseData?.map(event => (
        <Tag round={true} key={event} style={{ backgroundColor: getPipelineEventColor(event) }}>
          {startCase(event)}
        </Tag>
      ))}
      {popoverData?.length ? (
        <Popover interactionKind={PopoverInteractionKind.HOVER}>
          <Layout.Horizontal flex={{ align: 'center-center' }} spacing="xsmall">
            <Icon name="main-tags" size={15} />
          </Layout.Horizontal>
          <Layout.Vertical padding="small" spacing="small">
            {popoverData?.map(event => (
              <Tag round={true} key={event} style={{ backgroundColor: getPipelineEventColor(event) }}>
                {startCase(event)}
              </Tag>
            ))}
          </Layout.Vertical>
        </Popover>
      ) : null}
    </Layout.Horizontal>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnMethod: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
  const data = row.original.notificationRules.notificationMethod?.type
  return (
    <Layout.Horizontal spacing="small">
      <Icon name={getIconByNotificationMethod(data as NotificationType)} />
      <Text>{data}</Text>
    </Layout.Horizontal>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnMenu: Renderer<CellProps<NotificationRulesItem>> = ({ row, column }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { getString } = useStrings()
  const data = row.original

  const handleEdit = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    ;(column as any).openNotificationModal?.(data.notificationRules, data.index)
  }

  const handleDelete = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    ;(column as any).onUpdate?.(row.original, Actions.Delete)
  }
  return (
    <Layout.Horizontal>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu>
          <Menu.Item icon="edit" text={getString('edit')} onClick={handleEdit} disabled={(column as any).disabled} />
          <Menu.Item
            icon="trash"
            text={getString('delete')}
            onClick={handleDelete}
            disabled={(column as any).disabled}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

function NotificationTable(props: NotificationTableProps): React.ReactElement {
  const {
    data,
    onUpdate,
    gotoPage,
    filterType,
    onFilterType,
    totalPages,
    totalItems,
    pageSize,
    pageIndex,
    stagesOptions = [],
    getExistingNotificationNames = (_skipIndex?: number) => [],
    isReadonly = false
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const { openNotificationModal, closeNotificationModal } = useNotificationModal({
    onCreateOrUpdate: (_data?: NotificationRules, _index?: number, _action?: Actions) => {
      onUpdate?.({ notificationRules: _data!, index: _index! }, _action, closeNotificationModal)
    },
    stagesOptions,
    getExistingNotificationNames,
    expressions
  })

  const columns: CustomColumn<NotificationRulesItem>[] = useMemo(
    () => [
      {
        Header: getString('enabledLabel').toUpperCase(),
        id: 'enabled',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRules.enabled,
        onUpdate: onUpdate,
        width: '15%',
        Cell: RenderColumnEnabled,
        disableSortBy: true,
        disabled: isReadonly
      },
      {
        Header: getString('notifications.nameOftheRule').toUpperCase(),
        id: 'name',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRules.name,
        width: '20%',
        Cell: RenderColumnName,
        disableSortBy: true
      },
      {
        Header: getString('notifications.pipelineEvents').toUpperCase(),
        id: 'events',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRules.pipelineEvents,
        width: '35%',
        Cell: RenderColumnEvents,
        disableSortBy: true
      },
      {
        Header: getString('notifications.notificationMethod').toUpperCase(),
        id: 'methods',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRules.notificationMethod?.type,
        width: '28%',
        Cell: RenderColumnMethod,
        disableSortBy: true
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.notificationRules.notificationMethod?.spec,
        className: css.notificationTableHeader,
        width: '2%',
        Cell: RenderColumnMenu,
        onUpdate: onUpdate,
        openNotificationModal: openNotificationModal,
        disableSortBy: true,
        disabled: isReadonly
      }
    ],
    [onUpdate, openNotificationModal, data]
  )

  const filterOptions = [getAllNotificationTypeSelectOption(getString), ...NotificationTypeSelectOptions]

  return (
    <>
      <Container>
        <Layout.Horizontal flex className={css.headerActions}>
          <Button
            variation={ButtonVariation.PRIMARY}
            text={getString('notifications.name')}
            icon="plus"
            id="newNotificationBtn"
            onClick={() => openNotificationModal()}
            disabled={isReadonly}
          />

          <Select
            value={filterOptions.find(item => item.value === filterType)}
            items={filterOptions}
            onChange={value => {
              onFilterType?.(value.value as string)
            }}
            className={css.filterDropdown}
          />
        </Layout.Horizontal>
      </Container>
      <Container padding={{ bottom: 'huge' }} className={css.content}>
        <TableV2<NotificationRulesItem>
          columns={columns}
          data={data}
          className={css.notificationTable}
          pagination={{
            itemCount: totalItems,
            pageSize: pageSize,
            pageCount: totalPages,
            pageIndex: pageIndex,
            gotoPage: gotoPage
          }}
        />
      </Container>
    </>
  )
}

export default NotificationTable
