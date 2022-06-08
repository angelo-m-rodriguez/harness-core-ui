/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  act,
  fireEvent,
  getByText,
  queryByText,
  render,
  RenderResult,
  waitFor,
  queryByAttribute
} from '@testing-library/react'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, userGroupPathProps } from '@common/utils/routeUtils'
import { ResponseBoolean, useGetUserGroupAggregate } from 'services/cd-ng'
import * as hooks from '@common/hooks/useFeatureFlag'
import UserGroupDetails from '../UserGroupDetails'
import {
  mockResponse,
  userGroupInfo,
  userInfo,
  userGroupInfoSSOLinked,
  mockSSOSettings,
  inheritingChildScopeListData
} from './mock'

const deleteMember = jest.fn()
const deleteMemberMock = (): ResponseBoolean => {
  deleteMember()
  return mockResponse
}

const updateUG = jest.fn()
const updateUGMock = (): ResponseBoolean => {
  updateUG()
  return mockResponse
}

const linkToSSo = jest.fn()
const linkToSSoMock = (): ResponseBoolean => {
  linkToSSo()
  return mockResponse
}
const unLinkToSSo = jest.fn()
const unLinkToSSoMock = (): ResponseBoolean => {
  unLinkToSSo()
  return mockResponse
}

jest.mock('services/cd-ng', () => ({
  useGetUserGroupAggregate: jest.fn(),
  useGetInheritingChildScopeList: jest.fn().mockImplementation(() => inheritingChildScopeListData),
  useRemoveMember: jest.fn().mockImplementation(() => {
    return { mutate: deleteMemberMock }
  }),
  useGetUsersInUserGroup: jest.fn().mockImplementation(() => {
    return { data: userInfo, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetAuthenticationSettings: jest.fn().mockImplementation(() => {
    return mockSSOSettings
  }),
  usePutUserGroup: jest.fn().mockImplementation(() => {
    return { mutate: updateUGMock }
  }),
  useLinkToSamlGroup: jest.fn().mockImplementation(() => {
    return { mutate: linkToSSoMock }
  }),
  useUnlinkSsoGroup: jest.fn().mockImplementation(() => {
    return { mutate: unLinkToSSoMock }
  })
}))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn().mockImplementation(() => {
    return { data: userInfo, refetch: jest.fn(), error: null, loading: false }
  })
}))

describe('UserGroupDetails Test', () => {
  let container: HTMLElement
  let getAllByText: RenderResult['getAllByText']

  beforeEach(async () => {
    ;(useGetUserGroupAggregate as jest.Mock).mockImplementation(() => ({
      data: userGroupInfo,
      refetch: jest.fn(),
      error: null,
      loading: false
    }))
    const useFeatureFlags = jest.spyOn(hooks, 'useFeatureFlags')
    useFeatureFlags.mockReturnValue({
      INHERITED_USER_GROUP: true
    })
    const renderObj = render(
      <TestWrapper
        path={routes.toUserGroupDetails({ ...accountPathProps, ...userGroupPathProps })}
        pathParams={{ accountId: 'testAcc', userGroupIdentifier: 'New_RG' }}
      >
        <UserGroupDetails />
      </TestWrapper>
    )
    container = renderObj.container
    getAllByText = renderObj.getAllByText
    await waitFor(() => getAllByText('accessControl: common.userGroups'))
  })
  test('render data', () => {
    expect(container).toMatchSnapshot()
  })
  test('Delete Member', async () => {
    deleteMember.mockReset()
    const menu = container.querySelector(`[data-testid="menu-${userInfo.data?.content?.[0].uuid}"]`)
    fireEvent.click(menu!)
    const popover = findPopoverContainer()
    const deleteMenu = getByText(popover as HTMLElement, 'common.remove')
    await act(async () => {
      fireEvent.click(deleteMenu!)
      await waitFor(() => getByText(document.body, 'rbac.userGroupPage.userList.deleteTitle'))
      const form = findDialogContainer()
      expect(form).toBeTruthy()
      const deleteBtn = queryByText(form as HTMLElement, 'common.remove')
      fireEvent.click(deleteBtn!)
      expect(deleteMember).toBeCalled()
    })
  })
  test('should open link to sso modal and submit', async () => {
    linkToSSo.mockReset()
    const linkSSOButton = getAllByText('rbac.userDetails.linkToSSOProviderModal.linkLabel')[0]
    fireEvent.click(linkSSOButton)
    await act(async () => {
      fireEvent.click(linkSSOButton)
      const modal = findDialogContainer()!
      const ssoProvider = queryByAttribute('data-icon', modal, 'chevron-down')!
      fireEvent.click(ssoProvider)
      await waitFor(() => {
        fireEvent.click(getByText(modal, 'mock_SSO_Provider'))
        fireEvent.change(queryByAttribute('name', modal, 'groupName')!, {
          target: { value: 'test_sso_group_name' }
        })
      })
      fireEvent.click(queryByAttribute('data-testid', modal, 'submitLinkSSOProvider')!)
      await waitFor(() => expect(linkToSSo).toBeCalled())
    })
  })
  test('should open unlink to sso modal and submit', async () => {
    unLinkToSSo.mockReset()
    ;(useGetUserGroupAggregate as jest.Mock).mockReset()
    ;(useGetUserGroupAggregate as jest.Mock).mockImplementation(() => ({
      data: userGroupInfoSSOLinked,
      refetch: jest.fn(),
      error: null,
      loading: false
    }))
    const { getAllByText: getAllByTextLinked } = render(
      <TestWrapper
        path={routes.toUserGroupDetails({ ...accountPathProps, ...userGroupPathProps })}
        pathParams={{ accountId: 'testAcc', userGroupIdentifier: 'New_RG' }}
      >
        <UserGroupDetails />
      </TestWrapper>
    )
    await waitFor(() => getAllByTextLinked('accessControl: common.userGroups'))
    const unLinkSSOButton = getAllByTextLinked('rbac.userDetails.linkToSSOProviderModal.delinkLabel')[0]
    fireEvent.click(unLinkSSOButton)
    await act(async () => {
      const modal = findDialogContainer()!
      fireEvent.click(queryByAttribute('data-testid', modal, 'submitLinkSSOProvider')!)
      await waitFor(() => expect(unLinkToSSo).toBeCalled())
    })
  })
})
