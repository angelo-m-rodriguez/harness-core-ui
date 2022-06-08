/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import NewUserView from '../newUser/NewUserView'

jest.mock('@gitsync/modals/useCreateGitSyncModal', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue({ openGitSyncModal: jest.fn() })
  }
})

describe('GitSync Page', () => {
  test('render', () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/admin/git-sync"
        pathParams={{ accountId: 'dummyAccount', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }}
        defaultAppStoreValues={{
          isGitSyncEnabled: false,
          selectedProject: {
            identifier: 'dummy',
            name: 'dummy',
            modules: ['CI']
          }
        }}
      >
        <NewUserView />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('enable git experience', () => {
    render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/admin/git-sync"
        pathParams={{ accountId: 'dummyAccount', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }}
        defaultAppStoreValues={{
          isGitSyncEnabled: false,
          selectedProject: {
            identifier: 'dummy',
            name: 'dummy',
            modules: ['CI']
          }
        }}
      >
        <NewUserView />
      </TestWrapper>
    )

    const enableBtn = document.querySelector('.bp3-button-text')
    act(() => {
      fireEvent.click(enableBtn as Element)
    })
    expect(enableBtn).toBeDefined()
  })

  test('test when git simplification is enabled', () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/admin/git-sync"
        pathParams={{ accountId: 'dummyAccount', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }}
        defaultAppStoreValues={{
          isGitSimplificationEnabled: true
        }}
      >
        <NewUserView />
      </TestWrapper>
    )

    expect(container.querySelector('bp3-callout')).toBeDefined()
  })
})
