/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { Column, CellProps, Renderer } from 'react-table'
import { Color, FontVariation } from '@harness/design-system'
import { Text, TableV2, Card } from '@wings-software/uicore'
import { PageError } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useGetInheritingChildScopeList, ScopeName } from 'services/cd-ng'
import type { PrincipalScope } from '@common/interfaces/SecretsInterface'
import { PageSpinner } from '@common/components'
import type { Scope } from 'services/rbac/'
import { getUserGroupQueryParams } from '@rbac/utils/utils'
import css from './UserGroupRefScopeList.module.scss'

interface UserGroupScope extends Scope {
  orgName: string
  projectName?: string | null
}

interface UserGroupScopeListProps {
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  userGroupIdentifier: string
  parentScope: PrincipalScope
}

const RenderScopeType: Renderer<CellProps<UserGroupScope>> = ({ row }) => {
  const { projectIdentifier } = row.original
  const { getString } = useStrings()
  const icon = projectIdentifier ? 'nav-project' : 'nav-organization'

  return (
    <Text icon={icon} color={Color.BLACK} iconProps={{ padding: { right: 'small' } }}>
      {getString(projectIdentifier ? 'projectLabel' : 'orgLabel')}
    </Text>
  )
}

const RenderScopeDescription: Renderer<CellProps<UserGroupScope>> = ({ row }) => {
  const { orgName, projectName } = row.original
  const { getString } = useStrings()

  if (!projectName) {
    return <Text color={Color.BLACK}>{orgName}</Text>
  }

  return (
    <>
      <Text color={Color.BLACK}>{projectName}</Text>
      <Text font={{ variation: FontVariation.SMALL }} padding={{ top: 'xsmall' }} color={Color.GREY_600}>
        {getString('rbac.inheritedScope.projectOrg', { orgName })}
      </Text>
    </>
  )
}

const UserGroupRefScopeList: React.FC<UserGroupScopeListProps> = ({
  accountId,
  orgIdentifier,
  projectIdentifier,
  userGroupIdentifier,
  parentScope
}) => {
  const { getString } = useStrings()
  const { data, loading, error, refetch } = useGetInheritingChildScopeList({
    identifier: userGroupIdentifier,
    queryParams: {
      ...getUserGroupQueryParams(accountId, orgIdentifier, projectIdentifier, parentScope)
    }
  })

  const scopeListResponse: ScopeName[] | undefined = data?.data

  const columns: Column<ScopeName>[] = [
    {
      width: '25%',
      accessor: 'orgName',
      Cell: RenderScopeType
    },
    {
      width: '75%',
      accessor: 'projectName',
      Cell: RenderScopeDescription
    }
  ]

  if (loading) {
    return (
      <div className={css.moduleSpinner}>
        <PageSpinner fixed={false} />
      </div>
    )
  }

  if (error) {
    return <PageError message={error.message} onClick={refetch as any} />
  }

  return scopeListResponse && scopeListResponse?.length ? (
    <TableV2<ScopeName> columns={columns} data={scopeListResponse} hideHeaders={true} />
  ) : (
    <Card>
      <Text>
        {orgIdentifier
          ? getString('rbac.inheritedScope.orgScopeNoData')
          : getString('rbac.inheritedScope.accountScopeNoData')}
      </Text>
    </Card>
  )
}

export default UserGroupRefScopeList
