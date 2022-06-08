/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Container, Layout, Text, FieldArray, Select, SelectOption } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { defaultTo } from 'lodash-es'
import { useDeleteRoleAssignment, useGetRoleList } from 'services/rbac'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetResourceGroupListV2 } from 'services/resourcegroups'
import { errorCheck } from '@common/utils/formikHelpers'
import { useToaster } from '@common/components'
import { getScopeBasedDefaultResourceGroup, isAccountBasicRole, isAssignmentFieldDisabled } from '@rbac/utils/utils'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import NewUserRoleDropdown from '@rbac/components/NewUserRoleDropdown/NewUserRoleDropdown'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import type { Assignment, RoleOption, UserRoleAssignmentValues } from './UserRoleAssigment'
import type { RoleAssignmentValues } from './RoleAssignment'
import type { UserGroupRoleAssignmentValues } from './AssignRoles'
import css from './RoleAssignmentForm.module.scss'

export enum InviteType {
  ADMIN_INITIATED = 'ADMIN_INITIATED_INVITE',
  USER_INITIATED = 'USER_INITIATED_INVITE'
}

interface RoleAssignmentFormProps {
  noRoleAssignmentsText: string
  formik: FormikProps<UserRoleAssignmentValues | RoleAssignmentValues | UserGroupRoleAssignmentValues>
  onSuccess?: () => void
}

const RoleAssignmentForm: React.FC<RoleAssignmentFormProps> = ({ noRoleAssignmentsText, formik, onSuccess }) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
  const { showSuccess, showError } = useToaster()
  const defaultResourceGroup = getScopeBasedDefaultResourceGroup(scope, getString)

  const { mutate: deleteRoleAssignment } = useDeleteRoleAssignment({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })
  const { data: roleList } = useGetRoleList({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const { data: resourceGroupList } = useGetResourceGroupListV2({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const roles: RoleOption[] = useMemo(
    () =>
      roleList?.data?.content?.reduce((acc: RoleOption[], response) => {
        if (!isAccountBasicRole(response.role.identifier)) {
          acc.push({
            label: response.role.name,
            value: response.role.identifier,
            managed: defaultTo(response.harnessManaged, false),
            managedRoleAssignment: false
          })
        }
        return acc
      }, []) || [],
    [roleList]
  )

  const resourceGroups: SelectOption[] = useMemo(
    () =>
      resourceGroupList?.data?.content?.map(response => ({
        label: defaultTo(response.resourceGroup.name, ''),
        value: defaultTo(response.resourceGroup.identifier, '')
      })) || [],
    [resourceGroupList]
  )

  const handleRoleAssignmentDelete = async (identifier: string): Promise<boolean> => {
    try {
      const deleted = await deleteRoleAssignment(identifier, {
        headers: { 'content-type': 'application/json' }
      })
      if (deleted) {
        showSuccess(getString('rbac.roleAssignment.deleteSuccess'))
        onSuccess?.()
        return true
      } else {
        showError(getString('rbac.roleAssignment.deleteFailure'))
      }
    } catch (err) {
      /* istanbul ignore next */
      showError(getRBACErrorMessage(err))
    }
    return false
  }

  return (
    <Container className={css.roleAssignments}>
      <FieldArray
        label={getString('rbac.usersPage.assignRoleBindings')}
        name="assignments"
        placeholder={noRoleAssignmentsText}
        insertRowAtBeginning={false}
        isDeleteOfRowAllowed={row => !(row as Assignment).role.managedRoleAssignment}
        onDeleteOfRow={async row => {
          const assignment = (row as Assignment).role.assignmentIdentifier
          if (assignment) {
            const deleted = await handleRoleAssignmentDelete(assignment)
            if (!deleted) return false
          }
          return true
        }}
        containerProps={{ className: css.containerProps }}
        fields={[
          {
            name: 'role',
            label: getString('roles'),
            // eslint-disable-next-line react/display-name
            renderer: (value, _index, handleChange, error) => (
              <Layout.Vertical flex={{ alignItems: 'end' }} spacing="xsmall">
                <NewUserRoleDropdown value={value} handleChange={handleChange} roles={roles} />
                {errorCheck('assignments', formik) && error ? (
                  <Text intent="danger" font="xsmall">
                    {getString('rbac.usersPage.validation.role')}
                  </Text>
                ) : null}
              </Layout.Vertical>
            )
          },
          {
            name: 'resourceGroup',
            label: getString('resourceGroups'),
            defaultValue: defaultResourceGroup,
            // eslint-disable-next-line react/display-name
            renderer: (value, _index, handleChange, error) => {
              return (
                <Layout.Vertical flex={{ alignItems: 'end' }} spacing="xsmall">
                  <Select
                    items={resourceGroups}
                    value={value}
                    disabled={isAssignmentFieldDisabled(value)}
                    popoverClassName={css.selectPopover}
                    inputProps={{
                      placeholder: getString('rbac.usersPage.selectResourceGroup'),
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      'data-testid': `resourceGroup-${_index}`
                    }}
                    onChange={handleChange}
                  />
                  {errorCheck('assignments', formik) && error ? (
                    <Text intent="danger" font="xsmall">
                      {getString('rbac.usersPage.validation.resourceGroup')}
                    </Text>
                  ) : null}
                </Layout.Vertical>
              )
            }
          }
        ]}
      />
    </Container>
  )
}

export default RoleAssignmentForm
