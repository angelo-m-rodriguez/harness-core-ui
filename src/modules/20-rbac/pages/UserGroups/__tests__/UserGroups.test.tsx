/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, queryByText, render, RenderResult, waitFor } from '@testing-library/react'

import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import type { ResponseBoolean } from 'services/cd-ng'
import { clickSubmit, fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import {
  mockResponse,
  userGroupsAggregate,
  usersMockData,
  roleMockData,
  resourceGroupsMockData
} from './UserGroupsMock'
import UserGroupsPage from '../UserGroups'

jest.useFakeTimers()

const deleteUserGroup = jest.fn()
const deleteUserGroupMock = (): ResponseBoolean => {
  deleteUserGroup()
  return mockResponse
}

const createUserGroup = jest.fn()
const createUserGroupMock = (): ResponseBoolean => {
  createUserGroup()
  return mockResponse
}

const editUserGroup = jest.fn()
const editUserGroupMock = (): ResponseBoolean => {
  editUserGroup()
  return mockResponse
}

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
  useGetUserGroupAggregateList: jest.fn().mockImplementation(() => {
    return { data: userGroupsAggregate, refetch: jest.fn(), error: null, loading: false }
  }),
  useDeleteUserGroup: jest.fn().mockImplementation(() => ({ mutate: deleteUserGroupMock })),
  usePostUserGroup: jest.fn().mockImplementation(() => ({ mutate: createUserGroupMock })),
  usePutUserGroup: jest.fn().mockImplementation(() => ({ mutate: editUserGroupMock }))
}))

jest.mock('@common/hooks/useMutateAsGet', () => ({
  useMutateAsGet: jest.fn().mockImplementation(() => {
    return { data: usersMockData, refetch: jest.fn(), error: null }
  })
}))

jest.useFakeTimers()

describe('UsersPage Test', () => {
  let container: HTMLElement
  let getAllByText: RenderResult['getAllByText']
  let getByTestId: RenderResult['getByTestId']

  beforeEach(async () => {
    const renderObj = render(
      <TestWrapper
        path={routes.toUserGroups({ ...accountPathProps })}
        pathParams={{ accountId: 'testAcc' }}
        defaultFeatureFlagValues={{ INHERITED_USER_GROUP: true }}
      >
        <UserGroupsPage />
      </TestWrapper>
    )
    container = renderObj.container
    getAllByText = renderObj.getAllByText
    getByTestId = renderObj.getByTestId
    await waitFor(() => getAllByText('rbac.userGroupPage.newUserGroup'))
  })
  test('render data', () => {
    expect(container).toMatchSnapshot()
  }),
    test('Delete UserGroups', async () => {
      deleteUserGroup.mockReset()
      const menu = container.querySelector(
        `[data-testid="menu-${userGroupsAggregate.data?.content?.[0].userGroupDTO.identifier}"]`
      )
      fireEvent.click(menu!)
      const popover = findPopoverContainer()
      const deleteMenu = getByText(popover as HTMLElement, 'delete')
      await act(async () => {
        fireEvent.click(deleteMenu!)
        await waitFor(() => getByText(document.body, 'rbac.userGroupPage.confirmDeleteTitle'))
        const form = findDialogContainer()
        expect(form).toBeTruthy()
        const deleteBtn = queryByText(form as HTMLElement, 'delete')
        fireEvent.click(deleteBtn!)
        expect(deleteUserGroup).toBeCalled()
      })
    }),
    test('Create UserGroups', async () => {
      createUserGroup.mockReset()
      const newUG = getByText(container, 'rbac.userGroupPage.newUserGroup')
      fireEvent.click(newUG)
      const form = findDialogContainer()
      expect(form).toBeTruthy()
      fillAtForm([{ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'name', value: 'dummy name' }])

      await act(async () => {
        clickSubmit(form!)
      })

      expect(createUserGroup).toBeCalled()
    }),
    test('Add Roles', async () => {
      createRole.mockReset()
      const addRole = container.querySelector(
        `[data-testid="addRole-${userGroupsAggregate.data?.content?.[0].userGroupDTO.identifier}"]`
      )
      expect(addRole).toBeTruthy()
      act(() => {
        fireEvent.click(addRole!)
      })
      const form = findDialogContainer()
      expect(form).toBeTruthy()

      const addButton = form?.querySelector('button[data-id="btn-add"]')

      expect(addButton).toBeTruthy()

      act(() => {
        fireEvent.click(addButton!)
      })

      await act(async () => {
        clickSubmit(form!)
      })

      expect(form).toMatchSnapshot()
    }),
    test('Click row', async () => {
      const row = getByText(container, userGroupsAggregate.data?.content?.[0].userGroupDTO.name!)
      fireEvent.click(row!)
      await waitFor(() => getByTestId('location'))
      expect(
        getByTestId('location').innerHTML.endsWith(
          routes.toUserGroupDetails({
            accountId: 'testAcc',
            userGroupIdentifier: userGroupsAggregate.data?.content?.[0].userGroupDTO.identifier
          }) + `?parentScope=${'account'}`
        )
      ).toBeTruthy()
    })
})
