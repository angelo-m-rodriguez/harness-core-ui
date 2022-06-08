/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  ButtonVariation,
  Container,
  ExpandingSearchInput,
  Layout,
  Pagination,
  PageHeader,
  PageBody
} from '@wings-software/uicore'

import { useHistory, useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { Role, RoleResponse, useGetRoleList } from 'services/rbac'
import RoleCard from '@rbac/components/RoleCard/RoleCard'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useRoleModal } from '@rbac/modals/RoleModal/useRoleModal'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import routes from '@common/RouteDefinitions'
import { setPageNumber } from '@common/utils/utils'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { isAccountBasicRole } from '@rbac/utils/utils'
import css from '../Roles.module.scss'

const RolesList: React.FC = () => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  const history = useHistory()
  useDocumentTitle(getString('roles'))
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const { data, loading, error, refetch } = useGetRoleList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pageIndex: page,
      pageSize: 12,
      searchTerm: searchTerm
    },
    debounce: 300
  })

  useEffect(() => {
    setPageNumber({ setPage, page, pageItemsCount: data?.data?.pageItemCount })
  }, [data?.data])

  const { openRoleModal } = useRoleModal({
    onSuccess: role => {
      history.push(
        routes.toRoleDetails({
          accountId,
          orgIdentifier,
          projectIdentifier,
          module,
          roleIdentifier: role.identifier
        })
      )
    }
  })

  const editRoleModal = (role: Role): void => {
    openRoleModal(role)
  }

  const newRoleButton = (): JSX.Element => (
    <RbacButton
      text={getString('newRole')}
      data-testid="createRole"
      variation={ButtonVariation.PRIMARY}
      icon="plus"
      onClick={() => openRoleModal()}
      permission={{
        permission: PermissionIdentifier.UPDATE_ROLE,
        resource: {
          resourceType: ResourceType.ROLE
        },
        resourceScope: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        }
      }}
      featuresProps={{
        featuresRequest: {
          featureNames: [FeatureIdentifier.CUSTOM_ROLES]
        }
      }}
    />
  )

  return (
    <>
      <PageHeader
        title={<Layout.Horizontal>{newRoleButton()}</Layout.Horizontal>}
        toolbar={
          <Layout.Horizontal margin={{ right: 'small' }} height="xxxlarge">
            <ExpandingSearchInput
              alwaysExpanded
              placeholder={getString('common.searchPlaceholder')}
              onChange={text => {
                setSearchTerm(text.trim())
                setPage(0)
              }}
              width={250}
            />
          </Layout.Horizontal>
        }
      />
      <PageBody
        loading={loading}
        error={(error?.data as Error)?.message || error?.message}
        retryOnError={() => refetch()}
        noData={
          !searchTerm
            ? {
                when: () => !data?.data?.content?.length,
                icon: 'nav-project',
                message: getString('rbac.roleDetails.noDataText'),
                button: newRoleButton()
              }
            : {
                when: () => !data?.data?.content?.length,
                icon: 'nav-project',
                message: getString('noRoles')
              }
        }
        className={css.pageContainer}
      >
        <div className={css.masonry}>
          {data?.data?.content?.map((roleResponse: RoleResponse) =>
            isAccountBasicRole(roleResponse.role.identifier) ? null : (
              <RoleCard
                key={roleResponse.role.identifier}
                data={roleResponse}
                reloadRoles={refetch}
                editRoleModal={editRoleModal}
              />
            )
          )}
        </div>
        <Container className={css.pagination}>
          <Pagination
            itemCount={data?.data?.totalItems || 0}
            pageSize={data?.data?.pageSize || 10}
            pageCount={data?.data?.totalPages || 0}
            pageIndex={data?.data?.pageIndex || 0}
            gotoPage={(pageNumber: number) => setPage(pageNumber)}
          />
        </Container>
      </PageBody>
    </>
  )
}

export default RolesList
