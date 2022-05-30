/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { ButtonSize, ButtonVariation, ExpandingSearchInput, Layout, PageHeader } from '@wings-software/uicore'

import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { Page } from '@common/exports'
import { useGetUserGroupAggregateList } from 'services/cd-ng'
import { useUserGroupModal } from '@rbac/modals/UserGroupModal/useUserGroupModal'
import UserGroupsListView from '@rbac/pages/UserGroups/views/UserGroupsListView'
import { useRoleAssignmentModal } from '@rbac/modals/RoleAssignmentModal/useRoleAssignmentModal'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PrincipalType } from '@rbac/utils/utils'
import ManagePrincipalButton from '@rbac/components/ManagePrincipalButton/ManagePrincipalButton'
import { setPageNumber } from '@common/utils/utils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getPrincipalScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import UserGroupEmptyState from './user-group-empty-state.png'
import css from './UserGroups.module.scss'

interface UserGroupBtnProp {
  size?: ButtonSize
}

const UserGroupsPage: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const scope = getPrincipalScopeFromDTO({
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier
  })
  const { getString } = useStrings()
  useDocumentTitle(getString('common.userGroups'))
  const { INHERITED_USER_GROUP } = useFeatureFlags()
  const [page, setPage] = useState(0)
  const [searchTerm, setsearchTerm] = useState<string>('')
  const { data, loading, error, refetch } = useGetUserGroupAggregateList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pageIndex: page,
      pageSize: 10,
      searchTerm: searchTerm,
      filterType: 'INCLUDE_INHERITED_GROUPS'
    },
    debounce: 300
  })

  useEffect(() => {
    setPageNumber({ setPage, page, pageItemsCount: data?.data?.pageItemCount })
  }, [data?.data])

  const { openUserGroupModal } = useUserGroupModal({
    onSuccess: refetch
  })

  const { openRoleAssignmentModal } = useRoleAssignmentModal({
    onSuccess: refetch
  })

  const UserGroupBtn: React.FC<UserGroupBtnProp> = ({ size }): JSX.Element => (
    <ManagePrincipalButton
      text={getString('rbac.userGroupPage.newUserGroup')}
      variation={ButtonVariation.PRIMARY}
      icon="plus"
      onClick={() => openUserGroupModal()}
      resourceType={ResourceType.USERGROUP}
      size={size}
    />
  )

  const AssignRolesBtn: React.FC<UserGroupBtnProp> = ({ size }): JSX.Element => (
    <ManagePrincipalButton
      text={getString('rbac.userGroupPage.assignRoles')}
      variation={ButtonVariation.SECONDARY}
      onClick={() => openRoleAssignmentModal(PrincipalType.USER_GROUP)}
      resourceType={ResourceType.USERGROUP}
      size={size}
      className={css.assignRolesButton}
    />
  )

  const CombinedBtnLarge: React.FC<UserGroupBtnProp> = () => (
    <Layout.Horizontal spacing="small">
      <UserGroupBtn size={ButtonSize.LARGE} />
      {INHERITED_USER_GROUP && <AssignRolesBtn size={ButtonSize.LARGE} />}
    </Layout.Horizontal>
  )

  return (
    <>
      {data?.data?.content?.length || searchTerm || loading || error ? (
        <PageHeader
          title={
            <Layout.Horizontal spacing="small" flex={{ justifyContent: 'start' }}>
              <UserGroupBtn />
              {INHERITED_USER_GROUP && <AssignRolesBtn />}
            </Layout.Horizontal>
          }
          toolbar={
            <Layout.Horizontal margin={{ right: 'small' }} height="xxxlarge">
              <ExpandingSearchInput
                alwaysExpanded
                placeholder={getString('rbac.userGroupPage.search')}
                onChange={text => {
                  setsearchTerm(text.trim())
                  setPage(0)
                }}
                width={250}
              />
            </Layout.Horizontal>
          }
        />
      ) : null}

      <Page.Body
        loading={loading}
        error={(error?.data as Error)?.message || error?.message}
        retryOnError={() => refetch()}
        noData={{
          when: () => !data?.data?.content?.length,
          message: searchTerm
            ? getString('rbac.userGroupPage.noUserGroups')
            : getString('rbac.userGroupPage.userGroupEmptyState', {
                scope: scope
              }),
          button: !searchTerm ? <CombinedBtnLarge /> : undefined,
          image: UserGroupEmptyState,
          imageClassName: css.userGroupsEmptyState
        }}
      >
        <UserGroupsListView
          data={data}
          openRoleAssignmentModal={openRoleAssignmentModal}
          gotoPage={(pageNumber: number) => setPage(pageNumber)}
          reload={refetch}
          openUserGroupModal={openUserGroupModal}
        />
      </Page.Body>
    </>
  )
}

export default UserGroupsPage
