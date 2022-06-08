/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { queryByAttribute, render } from '@testing-library/react'
import { noop } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import GitRemoteDetails from '../GitRemoteDetails'

const pathParams = { accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }

const branchChangehandler = jest.fn(() => noop)

describe('GitRemoteDetails test', () => {
  test('default rendering GitRemoteDetails', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <GitRemoteDetails
          connectorRef="connectorId"
          onBranchChange={branchChangehandler}
          repoName={'testRepoName'}
          filePath={'filePath.yaml'}
          branch={'main'}
        />
      </TestWrapper>
    )
    expect(getByText('testRepoName')).toBeInTheDocument()
    const branchSelect = queryByAttribute('name', container, 'remoteBranch') as HTMLInputElement
    expect(branchSelect).toBeTruthy()
    expect(branchSelect.value).toEqual('main')
    expect(getByText('testRepoName')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
