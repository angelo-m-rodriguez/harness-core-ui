/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, getByText } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import FeatureFlagsPage from '../FeatureFlagsPage'

jest.mock('@cf/hooks/useGitSync', () => ({
  useGitSync: jest.fn(() => ({
    getGitSyncFormMeta: jest.fn().mockReturnValue({
      gitSyncInitialValues: {},
      gitSyncValidationSchema: {}
    }),
    isAutoCommitEnabled: false,
    isGitSyncEnabled: true,
    handleAutoCommit: jest.fn()
  }))
}))

describe('FeatureFlagsPage', () => {
  test('FeatureFlagsPage should render error correctly', async () => {
    const message = 'ERROR OCCURS'

    // Mock setTimeout
    const localGlobal = global as Record<string, any>
    localGlobal.window = Object.create(window)
    localGlobal.window.setTimeout = jest.fn()

    mockImport('services/cd-ng', {
      useGetEnvironmentListForProject: () => ({ error: { message }, refetch: jest.fn() })
    })
    mockImport('services/cf', {
      useGetAllFeatures: () => ({ data: undefined, refetch: jest.fn() })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FeatureFlagsPage />
      </TestWrapper>
    )

    expect(getByText(document.body, message)).toBeDefined()
  })
})
