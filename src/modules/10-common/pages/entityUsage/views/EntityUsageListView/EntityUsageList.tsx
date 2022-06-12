/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import type { Column, Renderer, CellProps } from 'react-table'
import { Text, Layout, Icon, TableV2 } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type {
  EntityDetail,
  EntityReference,
  EntitySetupUsageDTO,
  ResponsePageEntitySetupUsageDTO
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import ResourceDetailFactory from '@common/factories/ResourceDetailFactory'
import { EntityType } from '@common/pages/entityUsage/EntityConstants'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import css from './EntityUsageList.module.scss'

interface EntityUsageListProps {
  entityData: ResponsePageEntitySetupUsageDTO | null
  gotoPage: (pageNumber: number) => void
}

interface ReferredByEntity extends EntityDetail {
  entityRef?: EntityReference & { versionLabel?: string }
}

const getReferredByEntityName = (referredByEntity?: ReferredByEntity) => {
  if (!referredByEntity) {
    return ''
  }

  if (referredByEntity.type === EntityType.Template && referredByEntity.entityRef?.versionLabel) {
    return `${referredByEntity.name} (${referredByEntity.entityRef.versionLabel})`
  }

  return referredByEntity.name
}

const RenderColumnEntity: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
  const data = row.original
  const checkReferredByEntityTypeHandler = ResourceDetailFactory.getReferredByEntityTypeHandler(
    data.referredByEntity.type
  )
  if (checkReferredByEntityTypeHandler)
    return checkReferredByEntityTypeHandler.getResourceDetailViewAndAction({ referredByEntity: data.referredByEntity })
  else
    return (
      <Layout.Vertical>
        <Layout.Horizontal>
          <Text color={Color.BLACK} lineClamp={1} className={css.overflow}>
            {getReferredByEntityName(data.referredByEntity)}
          </Text>
        </Layout.Horizontal>
        <Text color={Color.GREY_400} lineClamp={1} className={css.overflow}>
          {data.referredByEntity?.type}
        </Text>
      </Layout.Vertical>
    )
}
const RenderColumnDetail: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
  const data = row.original
  const chkReferredEntityDetailHandler = ResourceDetailFactory.getReferredEntityUsageDetailTypeHandler(
    data.detail?.type
  )
  if (chkReferredEntityDetailHandler)
    return chkReferredEntityDetailHandler.getResourceDetailViewAndAction({
      referredEntity: data.referredEntity,
      referredByEntity: data.referredByEntity,
      detail: data.detail
    })
  else return null
}

// Todo: Enable once BE starts maintaining lastActivity
// const RenderColumnActivity: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
//   const data = row.original
//   return (
//     <Layout.Horizontal spacing="small">
//       {data.createdAt ? <ReactTimeago date={data.createdAt} /> : null}
//     </Layout.Horizontal>
//   )
// }

export const RenderGitDetails: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
  const data = row.original

  return data.referredByEntity.entityRef?.branch && data.referredByEntity.entityRef?.repoIdentifier ? (
    <Layout.Horizontal spacing="small">
      <Icon inline name="repository" color={Color.GREY_600}></Icon>
      <Text className={css.gitText} margin={{ right: 'medium' }}>
        {data.referredByEntity.entityRef?.repoIdentifier}
      </Text>

      <Icon inline name="git-new-branch" size={14} color={Color.GREY_600}></Icon>
      <Text className={css.gitText}>{data.referredByEntity.entityRef?.branch}</Text>
    </Layout.Horizontal>
  ) : null
}

const EntityUsageList: React.FC<EntityUsageListProps> = ({ entityData, gotoPage }) => {
  const data: EntitySetupUsageDTO[] = entityData?.data?.content || []
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()
  const columns: Column<EntitySetupUsageDTO>[] = useMemo(
    () => [
      {
        Header: getString('entity'),
        accessor: 'referredByEntity',
        width: isGitSyncEnabled ? '30%' : '50%',
        Cell: RenderColumnEntity
      },
      {
        Header: getString('common.gitSync.repoDetails').toUpperCase(),
        accessor: row => row.referredByEntity?.entityRef?.repoIdentifier,
        width: '50%',
        Cell: RenderGitDetails
      },
      {
        Header: getString('details'),
        accessor: 'detail',
        width: isGitSyncEnabled ? '20%' : '50%',
        Cell: RenderColumnDetail
      }
      // {
      //   Header: getString('lastActivity'),
      //   accessor: 'createdAt',
      //   width: '34%',
      //   Cell: RenderColumnActivity
      // }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, isGitSyncEnabled]
  )

  if (!isGitSyncEnabled) {
    columns.splice(1, 1)
  }

  return (
    <TableV2<EntitySetupUsageDTO>
      className={css.table}
      columns={columns}
      data={data}
      pagination={{
        itemCount: entityData?.data?.totalElements || 0,
        pageSize: entityData?.data?.size || 10,
        pageCount: entityData?.data?.totalPages || 0,
        pageIndex: entityData?.data?.pageable?.pageNumber || 0,
        gotoPage
      }}
    />
  )
}

export default EntityUsageList
