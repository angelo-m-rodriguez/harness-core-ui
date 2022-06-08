/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  ButtonVariation,
  Container,
  Icon,
  IconName,
  Layout,
  Popover,
  TableV2,
  Text
} from '@wings-software/uicore'
import React from 'react'
import { Color } from '@harness/design-system'
import type { CellProps, Column, Renderer } from 'react-table'
import { useParams } from 'react-router-dom'
import { Classes, Menu, Position } from '@blueprintjs/core'
import type {
  PageInputSetSummaryResponse,
  InputSetSummaryResponse,
  ResponseInputSetTemplateWithReplacedExpressionsResponse
} from 'services/pipeline-ng'
import { TagsPopover } from '@common/components'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams, Module } from '@common/interfaces/RouteInterfaces'
import GitDetailsColumn from '@common/components/Table/GitDetailsColumn/GitDetailsColumn'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { isInputSetInvalid } from '@pipeline/utils/inputSetUtils'
import { useRunPipelineModal } from '@pipeline/components/RunPipelineModal/useRunPipelineModal'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import useDeleteConfirmationDialog from '../utils/DeleteConfirmDialog'
import { Badge } from '../utils/Badge/Badge'
import css from './InputSetList.module.scss'

interface InputSetListViewProps {
  data?: PageInputSetSummaryResponse
  goToInputSetDetail?: (inputSet?: InputSetSummaryResponse) => void
  cloneInputSet?: (identifier?: string) => void
  refetchInputSet?: () => void
  gotoPage: (pageNumber: number) => void
  canUpdate?: boolean
  pipelineHasRuntimeInputs?: boolean
  isPipelineInvalid?: boolean
  onDeleteInputSet: (commitMsg: string) => Promise<void>
  onDelete: (inputSet: InputSetSummaryResponse) => void
  template?: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
}

export interface InputSetLocal extends InputSetSummaryResponse {
  action?: string
  lastUpdatedBy?: string
  createdBy?: string
  inputFieldSummary?: string
}

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  goToInputSetDetail?: (inputSet?: InputSetSummaryResponse) => void
  cloneInputSet?: (identifier?: string) => void
  refetchInputSet?: () => void
  onDeleteInputSet?: (commitMsg: string) => Promise<void>
  onDelete?: (inputSet: InputSetSummaryResponse) => void
  template?: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
}

const getIconByType = (type: InputSetSummaryResponse['inputSetType']): IconName => {
  return type === 'OVERLAY_INPUT_SET' ? 'step-group' : 'yaml-builder-input-sets'
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnInputSet: Renderer<CellProps<InputSetLocal>> = ({ row }) => {
  const { getString } = useStrings()
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      <Icon
        name={getIconByType(data.inputSetType)}
        color={data.inputSetType === 'INPUT_SET' ? Color.BLACK : Color.BLUE_500}
        size={30}
      />
      <Layout.Horizontal
        flex={{ alignItems: 'center' }}
        spacing="small"
        style={{ flexShrink: 1 }}
        padding={{ right: 'medium' }}
      >
        <div>
          <Layout.Horizontal spacing="small" data-testid={data.identifier}>
            <Text lineClamp={1} color={Color.BLACK}>
              {data.name}
            </Text>
            {data.tags && Object.keys(data.tags || {}).length ? <TagsPopover tags={data.tags} /> : null}
          </Layout.Horizontal>
          <Text lineClamp={1} color={Color.GREY_400}>
            {getString('idLabel', { id: data.identifier })}
          </Text>
        </div>
        {isInputSetInvalid(data) && (
          <Container padding={{ left: 'large' }}>
            <Badge
              text={'common.invalid'}
              iconName="error-outline"
              showTooltip={true}
              entityName={data.name}
              entityType={data.inputSetType === 'INPUT_SET' ? 'Input Set' : 'Overlay Input Set'}
              uuidToErrorResponseMap={data.inputSetErrorDetails?.uuidToErrorResponseMap}
              overlaySetErrorDetails={data.overlaySetErrorDetails}
            />
          </Container>
        )}
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnDescription: Renderer<CellProps<InputSetLocal>> = ({ row }) => {
  const data = row.original
  return (
    <Text padding={{ right: 'medium' }} lineClamp={2} color={Color.BLACK}>
      {data.description}
    </Text>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnMenu: Renderer<CellProps<InputSetLocal>> = ({ row, column }) => {
  const data = row.original
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { getString } = useStrings()
  const isPipelineInvalid = (column as any)?.isPipelineInvalid

  const { confirmDelete } = useDeleteConfirmationDialog(
    data,
    data.inputSetType === 'OVERLAY_INPUT_SET' ? 'overlayInputSet' : 'inputSet',
    (column as any).onDeleteInputSet
  )

  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }}>
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
          className={css.actionButton}
          icon="more"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu
          className={css.listItemMenu}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
          }}
        >
          <Menu.Item
            icon="edit"
            text={getString('edit')}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              ;(column as any).goToInputSetDetail?.(data)
              setMenuOpen(false)
            }}
            disabled={!(column as any).canUpdate || isPipelineInvalid}
          />
          <Menu.Item
            icon="duplicate"
            disabled
            text={getString('projectCard.clone')}
            onClick={
              /* istanbul ignore next */
              (e: React.MouseEvent) => {
                e.stopPropagation()
                ;(column as any).cloneInputSet?.(data.identifier)
                setMenuOpen(false)
              }
            }
          />
          <Menu.Divider />
          <Menu.Item
            icon="trash"
            text={getString('delete')}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              ;(column as any).onDelete?.(data)
              confirmDelete()
              setMenuOpen(false)
            }}
            disabled={!(column as any).canUpdate}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

// eslint-disable-next-line react/function-component-definition
const RenderColumnActions: Renderer<CellProps<InputSetLocal>> = ({ row, column }) => {
  const rowData = row.original
  const isPipelineInvalid = (column as any)?.isPipelineInvalid
  const isGitSyncEnabled = (column as any)?.isGitSyncEnabled

  const { pipelineIdentifier } = useParams<{
    pipelineIdentifier: string
    module: Module
  }>()

  const { repoIdentifier, branch, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const runPipeline = (): void => {
    openRunPipelineModal()
  }

  const { openRunPipelineModal } = useRunPipelineModal({
    inputSetSelected: [
      {
        type: rowData.inputSetType || /* istanbul ignore next */ 'INPUT_SET',
        value: rowData.identifier || /* istanbul ignore next */ '',
        label: rowData.name || /* istanbul ignore next */ '',
        gitDetails: isGitSyncEnabled
          ? rowData.gitDetails
          : { repoIdentifier: rowData.gitDetails?.repoName, branch: branch }
      }
    ],
    pipelineIdentifier: (rowData.pipelineIdentifier || '') as string,
    repoIdentifier: isGitSyncEnabled ? repoIdentifier : repoName,
    branch,
    connectorRef,
    storeType
  })

  return (
    <RbacButton
      disabled={!(column as any)?.pipelineHasRuntimeInputs || isPipelineInvalid}
      tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
      icon="run-pipeline"
      variation={ButtonVariation.PRIMARY}
      intent="success"
      text={getString('runPipeline')}
      onClick={e => {
        e.stopPropagation()
        runPipeline()
      }}
      featuresProps={getFeaturePropsForRunPipelineButton({
        modules: (column as any).template?.data?.modules,
        getString
      })}
      permission={{
        resource: {
          resourceType: ResourceType.PIPELINE,
          resourceIdentifier: pipelineIdentifier
        },
        permission: PermissionIdentifier.EXECUTE_PIPELINE
      }}
    />
  )
}

export function InputSetListView({
  data,
  gotoPage,
  goToInputSetDetail,
  refetchInputSet,
  cloneInputSet,
  canUpdate = true,
  pipelineHasRuntimeInputs,
  isPipelineInvalid,
  onDeleteInputSet,
  onDelete,
  template
}: InputSetListViewProps): React.ReactElement {
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()
  const columns: CustomColumn<InputSetLocal>[] = React.useMemo(
    () => [
      {
        Header: getString('pipeline.inputSets.inputSetNameLabel').toUpperCase(),
        accessor: 'name',
        width: isGitSyncEnabled ? '25%' : '30%',
        Cell: RenderColumnInputSet
      },
      {
        Header: getString('description').toUpperCase(),
        accessor: 'description',
        width: isGitSyncEnabled ? '30%' : '35%',
        Cell: RenderColumnDescription,
        disableSortBy: true
      },
      {
        Header: getString('common.gitSync.repoDetails').toUpperCase(),
        accessor: 'gitDetails',
        width: '25%',
        Cell: GitDetailsColumn,
        disableSortBy: true
      },
      {
        Header: getString('action').toUpperCase(),
        accessor: 'identifier',
        width: isGitSyncEnabled ? '15%' : '30%',
        Cell: RenderColumnActions,
        disableSortBy: true,
        goToInputSetDetail,
        pipelineHasRuntimeInputs,
        isPipelineInvalid,
        template,
        isGitSyncEnabled
      },
      {
        Header: '',
        accessor: 'action',
        width: '5%',
        Cell: RenderColumnMenu,
        disableSortBy: true,
        isPipelineInvalid,
        goToInputSetDetail,
        refetchInputSet,
        cloneInputSet,
        canUpdate,
        onDeleteInputSet,
        onDelete
      }
    ],
    [goToInputSetDetail, refetchInputSet, cloneInputSet, pipelineHasRuntimeInputs]
  )

  if (!isGitSyncEnabled) {
    columns.splice(2, 1)
  }

  return (
    <TableV2<InputSetLocal>
      className={css.table}
      columns={columns}
      data={data?.content || /* istanbul ignore next */ []}
      onRowClick={item => !isPipelineInvalid && pipelineHasRuntimeInputs && goToInputSetDetail?.(item)}
      pagination={{
        itemCount: data?.totalItems || /* istanbul ignore next */ 0,
        pageSize: data?.pageSize || /* istanbul ignore next */ 10,
        pageCount: data?.totalPages || /* istanbul ignore next */ -1,
        pageIndex: data?.pageIndex || /* istanbul ignore next */ 0,
        gotoPage
      }}
    />
  )
}
