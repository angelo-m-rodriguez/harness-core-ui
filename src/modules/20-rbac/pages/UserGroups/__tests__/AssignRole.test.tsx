/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, render } from '@testing-library/react'

import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import type { ResponseBoolean } from 'services/cd-ng'
import { clickSubmit } from '@common/utils/JestFormHelper'
import routes from '@common/RouteDefinitions'
import { projectPathProps } from '@common/utils/routeUtils'
import AssignRoles from '@rbac/modals/RoleAssignmentModal/views/AssignRoles'
import { mockResponse, userGroupsAggregate, roleMockData, resourceGroupsMockData } from './UserGroupsMock'

jest.useFakeTimers()

const createRole = jest.fn()
const createRoleMock = (): ResponseBoolean => {
  createRole()
  return mockResponse
}

jest.mock('services/rbac', () => ({
  useGetRoleList: jest.fn().mockImplementation(() => {
    return { data: roleMockData, refetch: jest.fn(), error: null, loading: false }
  }),
  usePostRoleAssignments: jest.fn().mockImplementation(() => ({ mutate: createRoleMock })),
  useDeleteRoleAssignment: jest.fn().mockImplementation(() => ({ mutate: mockResponse }))
}))

jest.mock('services/resourcegroups', () => ({
  useGetResourceGroupListV2: jest.fn().mockImplementation(() => {
    return { data: resourceGroupsMockData, refetch: jest.fn(), error: null }
  })
}))

jest.mock('services/cd-ng', () => ({
  getUserGroupAggregateListPromise: jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      resolve({ data: userGroupsAggregate.data, refetch: jest.fn(), error: null, loading: false })
    })
  })
}))

jest.useFakeTimers()

describe('Assign Roles Test', () => {
  let container: HTMLElement

  beforeEach(async () => {
    const renderObj = render(
      <TestWrapper
        path={routes.toUserGroups({ ...projectPathProps })}
        pathParams={{ accountId: 'testAcc', orgIdentifier: 'testOrg', projectIdentifier: 'testProject', module: 'cd' }}
        defaultFeatureFlagValues={{ INHERITED_USER_GROUP: true }}
      >
        <AssignRoles />
      </TestWrapper>
    )
    container = renderObj.container
  })
  test('Assign Roles', async () => {
    createRole.mockReset()
    const selectUserGroup = getByText(container, 'common.selectUserGroups')
    await act(async () => {
      fireEvent.click(selectUserGroup)
    })
    const selectUserGroupForm = findDialogContainer()
    expect(selectUserGroupForm).toBeTruthy()

    const userGroupOption = getByText(selectUserGroupForm!, 'Testing User Group')
    act(() => {
      fireEvent.click(userGroupOption)
    })
    const applyChanges = getByText(selectUserGroupForm!, 'entityReference.apply')
    await act(async () => {
      fireEvent.click(applyChanges)
    })
    await act(async () => {
      clickSubmit(container!)
    })
    expect(createRole).toBeCalled()
  })
  test('Assign Roles When No Usergroups Selected', async () => {
    createRole.mockReset()

    await act(async () => {
      clickSubmit(container!)
    })
    const errorMessage = getByText(container!, 'rbac.userGroupRequired')
    expect(errorMessage).toBeTruthy()
  })
})
