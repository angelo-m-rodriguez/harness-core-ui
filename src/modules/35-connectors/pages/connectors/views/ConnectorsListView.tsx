/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import {
  Text,
  Layout,
  Icon,
  Button,
  Popover,
  Container,
  useToaster,
  TagsPopover,
  TableV2,
  useConfirmationDialog
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import type { CellProps, Renderer, Column } from 'react-table'
import { Menu, Classes, Position, Intent, TextArea, Tooltip } from '@blueprintjs/core'
import { useParams, useHistory, Link } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import classNames from 'classnames'
import { pick } from 'lodash-es'
import defaultTo from 'lodash-es/defaultTo'
import { useStrings } from 'framework/strings'
import {
  ConnectorResponse,
  useDeleteConnector,
  PageConnectorResponse,
  ConnectorInfoDTO,
  ConnectorValidationResult,
  EntityGitDetails
} from 'services/cd-ng'

import type { UseCreateConnectorModalReturn } from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import routes from '@common/RouteDefinitions'
import { getIconByType, isSMConnector } from '../utils/ConnectorUtils'
import { getConnectorDisplaySummary } from '../utils/ConnectorListViewUtils'
import ConnectivityStatus from './connectivityStatus/ConnectivityStatus'
import { ConnectorDetailsView } from '../utils/ConnectorHelper'
import css from './ConnectorsListView.module.scss'

interface ConnectorListViewProps {
  data?: PageConnectorResponse
  reload?: () => Promise<void>
  gotoPage: (pageNumber: number) => void
  openConnectorModal: UseCreateConnectorModalReturn['openConnectorModal']
}

type CustomColumn = Column<ConnectorResponse> & {
  reload?: () => Promise<void>
}

export type ErrorMessage = ConnectorValidationResult & { useErrorHandler?: boolean }

const connectorDetailsUrlWithGit = (url: string, gitInfo: EntityGitDetails = {}): string => {
  const urlForGit = `${url}?repoIdentifier=${gitInfo.repoIdentifier}&branch=${gitInfo.branch}`
  return gitInfo?.objectId ? urlForGit : url
}

export const RenderColumnConnector: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  const tags = data.connector?.tags || {}
  const { getString } = useStrings()
  return (
    <Layout.Horizontal spacing="small">
      <Icon name={getIconByType(data.connector?.type)} size={30}></Icon>
      <div className={css.wrapper}>
        <Layout.Horizontal spacing="small">
          <div className={css.name} color={Color.BLACK} title={data.connector?.name}>
            {data.connector?.name}
          </div>
          {tags && Object.keys(tags).length ? <TagsPopover tags={tags} /> : null}
          {data.entityValidityDetails?.valid === false ? (
            <Tooltip
              position="bottom"
              content={
                <Layout.Horizontal flex={{ alignItems: 'baseline' }}>
                  <Icon name="warning-sign" color={Color.RED_600} size={12} margin={{ right: 'small' }} />
                  <Layout.Vertical>
                    <Text color={Color.WHITE} font={{ variation: FontVariation.SMALL }}>
                      {getString('common.gitSync.outOfSync', { entityType: 'Connector', name: data.connector?.name })}
                    </Text>
                    <Text color={Color.WHITE} font={{ variation: FontVariation.SMALL }}>
                      {getString('common.gitSync.fixAllErrors')}
                    </Text>
                  </Layout.Vertical>
                </Layout.Horizontal>
              }
            >
              <Icon name="warning-sign" color={Color.RED_600} size={16} padding={{ left: 'xsmall' }} />
            </Tooltip>
          ) : (
            <></>
          )}
        </Layout.Horizontal>
        <div className={css.identifier} title={data.connector?.identifier}>
          {`${getString('common.ID')}: ${data.connector?.identifier}`}
        </div>
      </div>
    </Layout.Horizontal>
  )
}
export const RenderColumnDetails: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original

  return data.connector ? (
    <div className={css.wrapper}>
      <div color={Color.BLACK}>{getConnectorDisplaySummary(data.connector)}</div>
    </div>
  ) : null
}

export const RenderGitDetails: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original

  return data.gitDetails ? (
    <div className={css.wrapper}>
      <Layout.Horizontal>
        <Container
          className={css.name}
          color={Color.BLACK}
          title={data.gitDetails?.repoIdentifier}
          padding={{ top: 'xsmall' }}
          margin={{ right: 'small' }}
        >
          {data.gitDetails?.repoIdentifier}
        </Container>
        {data.gitDetails?.branch && (
          <Layout.Horizontal
            border
            spacing="xsmall"
            padding={'xsmall'}
            background={Color.GREY_100}
            width={'fit-content'}
          >
            <Icon
              inline
              name="git-new-branch"
              size={12}
              margin={{ left: 'xsmall', top: 'xsmall' }}
              color={Color.GREY_700}
            ></Icon>
            <Text lineClamp={1} className={classNames(css.name, css.listingGitBranch)} color={Color.BLACK}>
              {data.gitDetails?.branch}
            </Text>
          </Layout.Horizontal>
        )}
      </Layout.Horizontal>
    </div>
  ) : null
}

export const RenderColumnActivity: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      <Icon name="activity" />
      {data.activityDetails?.lastActivityTime ? <ReactTimeago date={data.activityDetails?.lastActivityTime} /> : null}
    </Layout.Horizontal>
  )
}
export const RenderColumnLastUpdated: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      {data.lastModifiedAt ? <ReactTimeago date={data.lastModifiedAt} /> : null}
    </Layout.Horizontal>
  )
}
const RenderColumnStatus: Renderer<CellProps<ConnectorResponse>> = ({ row }) => {
  const data = row.original
  return <ConnectivityStatus data={data} />
}

const RenderColumnMenu: Renderer<CellProps<ConnectorResponse>> = ({ row, column }) => {
  const history = useHistory()
  const params = useParams<PipelineType<ProjectPathProps>>()
  const data = row.original
  const gitDetails = data?.gitDetails ?? {}
  const isHarnessManaged = data.harnessManaged
  const { isGitSyncEnabled: gitSyncAppStoreEnabled } = useAppStore()
  const isGitSyncEnabled = gitSyncAppStoreEnabled && !isSMConnector(row.original.connector?.type)
  const [menuOpen, setMenuOpen] = useState(false)
  const { showSuccess, showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const [commitMsg, setCommitMsg] = useState<string>(
    `${getString('connectors.confirmDeleteTitle')} ${data.connector?.name}`
  )
  const gitParams = gitDetails?.objectId
    ? {
        ...pick(gitDetails, ['branch', 'repoIdentifier', 'filePath', 'rootFolder']),
        commitMsg,
        lastObjectId: gitDetails.objectId
      }
    : {}
  const { mutate: deleteConnector } = useDeleteConnector({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      ...gitParams
    }
  })

  const [canUpdate, canDelete] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CONNECTOR,
        resourceIdentifier: data.connector?.identifier || ''
      },
      permissions: [PermissionIdentifier.UPDATE_CONNECTOR, PermissionIdentifier.DELETE_CONNECTOR]
    },
    []
  )

  const getConfirmationDialogContent = (): JSX.Element => {
    return (
      <div className={'connectorDeleteDialog'}>
        <Text margin={{ bottom: 'medium' }} className={css.confirmText} title={data.connector?.name}>{`${getString(
          'connectors.confirmDelete'
        )} ${data.connector?.name}?`}</Text>
        {gitDetails?.objectId && (
          <>
            <Text>{getString('common.git.commitMessage')}</Text>
            <TextArea
              value={commitMsg}
              onInput={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                setCommitMsg(event.target.value)
              }}
            />
          </>
        )}
      </div>
    )
  }

  const { openDialog: openReferenceErrorDialog } = useConfirmationDialog({
    contentText: (
      <span>
        <Text inline font={{ weight: 'bold' }}>
          {`${data.connector?.name} `}
        </Text>
        {getString('connectors.connectorReferenceText')}
        <Link
          to={{
            pathname: routes.toConnectorDetails({
              ...params,
              connectorId: data.connector?.identifier
            }),
            search: `?view=${ConnectorDetailsView.referencedBy}`
          }}
        >
          {getString('clickHere')}
        </Link>
      </span>
    ),
    titleText: getString('connectors.cantDeleteConnector'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER
  })

  const handleConnectorDeleteError = (code: string, message: string) => {
    if (code === 'ENTITY_REFERENCE_EXCEPTION') {
      openReferenceErrorDialog()
    } else {
      showError(message)
    }
  }

  const { openDialog } = useConfirmationDialog({
    contentText: getConfirmationDialogContent(),
    titleText: getString('connectors.confirmDeleteTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        try {
          const deleted = await deleteConnector(data.connector?.identifier || '', {
            headers: { 'content-type': 'application/json' }
          })

          if (deleted) {
            showSuccess(getString('connectors.deletedSuccssMessage', { name: data.connector?.name }))
          }
          ;(column as any).reload?.()
        } catch (err) {
          handleConnectorDeleteError(err?.data.code, defaultTo(err?.data?.message, err?.message))
        }
      }
    }
  })

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    if (!data?.connector?.identifier) {
      return
    }
    openDialog()
  }

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    const isEntityInvalid = data.entityValidityDetails?.valid === false
    e.stopPropagation()
    setMenuOpen(false)
    if (!data?.connector?.identifier) {
      return
    }
    if (!isEntityInvalid) {
      ;(column as any).openConnectorModal(true, row?.original?.connector?.type as ConnectorInfoDTO['type'], {
        connectorInfo: row.original.connector,
        gitDetails: row.original?.gitDetails
      })
    } else {
      const url = routes.toConnectorDetails({ ...params, connectorId: data.connector?.identifier })
      history.push(connectorDetailsUrlWithGit(url, row.original?.gitDetails))
    }
  }

  return (
    !isHarnessManaged && // if isGitSyncEnabled then gitobjectId should also be there to support edit/delete
    !isGitSyncEnabled === !gitDetails?.objectId && (
      <Layout.Horizontal className={css.layout}>
        <Popover
          isOpen={menuOpen}
          onInteraction={nextOpenState => {
            setMenuOpen(nextOpenState)
          }}
          className={Classes.DARK}
          position={Position.RIGHT_TOP}
        >
          <Button
            minimal
            icon="Options"
            onClick={e => {
              e.stopPropagation()
              setMenuOpen(true)
            }}
          />
          <Menu
            style={{ minWidth: 'unset' }}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <Menu.Item icon="edit" text="Edit" onClick={handleEdit} disabled={!canUpdate} />
            <Menu.Item icon="trash" text="Delete" onClick={handleDelete} disabled={!canDelete} />
          </Menu>
        </Popover>
      </Layout.Horizontal>
    )
  )
}

const ConnectorsListView: React.FC<ConnectorListViewProps> = props => {
  const { data, reload, gotoPage } = props
  const params = useParams<PipelineType<ProjectPathProps>>()
  const history = useHistory()
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()
  const listData: ConnectorResponse[] = useMemo(() => data?.content || [], [data?.content])
  const columns: CustomColumn[] = useMemo(
    () => [
      {
        Header: getString('connector').toUpperCase(),
        accessor: row => row.connector?.name,
        id: 'name',
        width: isGitSyncEnabled ? '19%' : '25%',
        Cell: RenderColumnConnector
      },
      {
        Header: getString('details').toUpperCase(),
        accessor: row => row.connector?.description,
        id: 'details',
        width: '25%',
        Cell: RenderColumnDetails
      },
      {
        Header: getString('common.gitSync.repoDetails').toUpperCase(),
        accessor: row => row.connector?.identifier,
        id: 'gitDetails',
        width: '20%',
        Cell: RenderGitDetails
      },
      {
        Header: getString('lastActivity').toUpperCase(),
        accessor: 'activityDetails',
        id: 'activity',
        width: isGitSyncEnabled ? '10%' : '15%',
        Cell: RenderColumnActivity
      },
      {
        Header: getString('connectivityStatus').toUpperCase(),
        accessor: 'status',
        id: 'status',
        width: '15%',
        Cell: RenderColumnStatus
      },
      {
        Header: getString('lastUpdated').toUpperCase(),
        accessor: 'lastModifiedAt',
        id: 'lastModifiedAt',
        width: isGitSyncEnabled ? '6%' : '15%',
        Cell: RenderColumnLastUpdated
      },
      {
        Header: '',
        accessor: row => row.connector?.identifier,
        width: '5%',
        id: 'action',
        Cell: RenderColumnMenu,
        openConnectorModal: props.openConnectorModal,
        reload: reload,
        disableSortBy: true
      }
    ],
    [props.openConnectorModal, reload, isGitSyncEnabled]
  )

  if (!isGitSyncEnabled) {
    columns.splice(2, 1)
  }

  return (
    <TableV2<ConnectorResponse>
      className={css.table}
      columns={columns}
      data={listData}
      name="ConnectorsListView"
      onRowClick={connector => {
        const url = routes.toConnectorDetails({ ...params, connectorId: connector.connector?.identifier })
        history.push(connectorDetailsUrlWithGit(url, connector.gitDetails))
      }}
      pagination={{
        itemCount: data?.totalItems || 0,
        pageSize: data?.pageSize || 10,
        pageCount: data?.totalPages || -1,
        pageIndex: data?.pageIndex || 0,
        gotoPage
      }}
    />
  )
}

export default ConnectorsListView
