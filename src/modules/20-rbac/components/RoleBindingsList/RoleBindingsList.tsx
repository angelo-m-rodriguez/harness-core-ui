/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { Tag, Popover, PopoverInteractionKind } from '@blueprintjs/core'
import { Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Link, useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { RoleAssignmentMetadataDTO, RoleBinding } from 'services/cd-ng'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { isAccountBasicRole } from '@rbac/utils/utils'
import css from './RoleBindingsList.module.scss'

interface RoleBindingsListProps {
  data?: RoleAssignmentMetadataDTO[] | RoleBinding[]
  length?: number
  showNoData?: boolean
}

const RoleBindingTag = ({ roleAssignment }: { roleAssignment: RoleBinding }): React.ReactElement => {
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  return (
    <Tag
      className={roleAssignment.managedRole ? css.harnesstag : css.customtag}
      onClick={e => {
        e.stopPropagation()
      }}
    >
      <Link
        to={routes.toRoleDetails({
          accountId,
          orgIdentifier,
          projectIdentifier,
          module,
          roleIdentifier: roleAssignment.roleIdentifier
        })}
        className={css.link}
      >
        {roleAssignment.roleName}
      </Link>
      {` - `}
      <Link
        to={routes.toResourceGroupDetails({
          accountId,
          orgIdentifier,
          projectIdentifier,
          module,
          resourceGroupIdentifier: roleAssignment.resourceGroupIdentifier
        })}
        className={css.link}
      >
        {roleAssignment.resourceGroupName}
      </Link>
    </Tag>
  )
}

const RoleBindingsList: React.FC<RoleBindingsListProps> = ({ data, length = data?.length, showNoData = false }) => {
  const filteredData = data?.filter(val => !isAccountBasicRole(val.roleIdentifier))
  const baseData = filteredData?.slice(0, length)
  const popoverData = filteredData?.slice(length, filteredData.length)
  const { getString } = useStrings()
  return (
    <>
      {showNoData && isEmpty(baseData) ? (
        <Text color={Color.GREY_500}>{getString('rbac.noRoleBinding')}</Text>
      ) : (
        baseData?.map(roleAssignment => (
          <RoleBindingTag
            key={`${roleAssignment.roleIdentifier} ${roleAssignment.resourceGroupIdentifier}`}
            roleAssignment={roleAssignment}
          />
        ))
      )}
      {popoverData?.length ? (
        <Popover interactionKind={PopoverInteractionKind.HOVER}>
          <Layout.Horizontal flex={{ align: 'center-center' }} spacing="xsmall">
            <Tag className={css.tag}>{getString('common.plusNumber', { number: popoverData?.length })}</Tag>
          </Layout.Horizontal>
          <Layout.Vertical padding="small" spacing="small">
            {popoverData?.map(roleAssignment => (
              <RoleBindingTag
                key={`${roleAssignment.roleIdentifier} ${roleAssignment.resourceGroupIdentifier}`}
                roleAssignment={roleAssignment}
              />
            ))}
          </Layout.Vertical>
        </Popover>
      ) : null}
    </>
  )
}

export default RoleBindingsList
