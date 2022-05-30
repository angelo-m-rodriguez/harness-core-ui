/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { Column, CellProps, Renderer } from 'react-table'
import { Layout, Text, TableV2 } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { formatDatetoLocale } from '@common/utils/dateUtils'
import type { PagePMSPipelineSummaryResponse, PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import { String, useStrings } from 'framework/strings'

import routes from '@common/RouteDefinitions'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import GitDetailsColumn from '@common/components/Table/GitDetailsColumn/GitDetailsColumn'
import type { StoreType } from '@common/constants/GitSyncTypes'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import css from './PipelineModalListView.module.scss'

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  reload?: () => Promise<void>
}

interface PipelineDTO extends PMSPipelineSummaryResponse {
  admin?: string
  collaborators?: string
  status?: string
}

interface PipelineListViewProps {
  data?: PagePMSPipelineSummaryResponse
  refetch?: () => void
  gotoPage: (pageNumber: number) => void
}

export default function RunPipelineListView({ data, refetch, gotoPage }: PipelineListViewProps): React.ReactElement {
  const { orgIdentifier, projectIdentifier, accountId, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
    }>
  >()

  const history = useHistory()
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()

  const routeToPipelinesPage = (pipeline: PipelineDTO): void => {
    history.push(
      routes.toPipelineStudio({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier: pipeline.identifier || '',
        module,
        branch: pipeline.gitDetails?.branch,
        repoIdentifier: pipeline.gitDetails?.repoIdentifier,
        connectorRef: pipeline.connectorRef,
        repoName: pipeline.gitDetails?.repoName,
        storeType: pipeline.storeType as StoreType,
        runPipeline: true
      })
    )
  }

  // eslint-disable-next-line react/function-component-definition
  const RenderColumnPipeline: Renderer<CellProps<PipelineDTO>> = ({ row }) => {
    const rowdata = row.original

    return (
      <Layout.Vertical spacing="small" data-testid={rowdata.identifier}>
        <Text color={Color.GREY_800} iconProps={{ size: 16 }}>
          {rowdata.name}
        </Text>
        <Text color={Color.GREY_400}>{rowdata.description}</Text>
      </Layout.Vertical>
    )
  }

  // eslint-disable-next-line react/function-component-definition
  const RenderLastRunDate: Renderer<CellProps<PipelineDTO>> = ({ row }) => {
    const rowdata = row.original
    return (
      <Layout.Vertical spacing="xsmall">
        <Text color={Color.GREY_400}>
          {rowdata.executionSummaryInfo?.lastExecutionTs
            ? formatDatetoLocale(rowdata.executionSummaryInfo?.lastExecutionTs)
            : getString('pipelineSteps.pullNeverLabel')}
        </Text>
      </Layout.Vertical>
    )
  }

  // eslint-disable-next-line react/function-component-definition
  const RenderColumnMenu: Renderer<CellProps<PipelineDTO>> = ({ row }): JSX.Element => {
    const rowdata = row.original
    const isPipelineInvalid = rowdata?.entityValidityDetails?.valid === false

    return (
      <RbacButton
        icon="run-pipeline"
        className={css.rbacButton}
        disabled={isPipelineInvalid}
        tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
        intent="primary"
        text={<String stringID="runPipeline" />}
        onClick={() => routeToPipelinesPage(rowdata)}
        permission={{
          resource: {
            resourceType: ResourceType.PIPELINE,
            resourceIdentifier: rowdata.identifier as string
          },
          permission: PermissionIdentifier.EXECUTE_PIPELINE
        }}
      />
    )
  }
  const columns: CustomColumn<PipelineDTO>[] = React.useMemo(
    () => [
      {
        Header: getString('common.pipeline').toUpperCase(),
        accessor: 'name',
        width: isGitSyncEnabled ? '27.5%' : '50%',
        Cell: RenderColumnPipeline
      },
      {
        Header: getString('common.gitSync.repoDetails').toUpperCase(),
        accessor: 'gitDetails',
        width: isGitSyncEnabled ? '27.5%' : 0,
        Cell: GitDetailsColumn
      },
      {
        Header: getString('lastExecutionTs').toUpperCase(),
        accessor: 'executionSummaryInfo',
        width: isGitSyncEnabled ? '25%' : '30%',
        Cell: RenderLastRunDate
      },
      {
        accessor: 'tags',
        width: '20%',
        Cell: RenderColumnMenu,
        disableSortBy: true
      }
    ],
    [refetch]
  )

  if (!isGitSyncEnabled) {
    columns.splice(1, 1)
  }

  return (
    <TableV2<PipelineDTO>
      className={css.table}
      columns={columns}
      data={data?.content || []}
      pagination={{
        itemCount: data?.totalElements || 0,
        pageSize: data?.size || 10,
        pageCount: data?.totalPages ?? 1,
        pageIndex: data?.number ?? 0,
        gotoPage
      }}
    />
  )
}
