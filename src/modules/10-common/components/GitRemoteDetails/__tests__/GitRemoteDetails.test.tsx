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
const testPath = '/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/'

const branchChangehandler = jest.fn(() => noop)

describe('<GitRemoteDetails />', () => {
  test('default rendering GitRemoteDetails', () => {
    const { container, getByText } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
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

  test('readonly', () => {
    const { container, getByText } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <GitRemoteDetails
          repoName={'testRepoName'}
          filePath={'filePath.yaml'}
          branch={'testBranch'}
          flags={{ readOnly: true }}
        />
      </TestWrapper>
    )
    expect(container.querySelector('[data-icon="repository"]')).toBeInTheDocument()
    expect(container.querySelector('p.repoDetails')).toBeInTheDocument()
    expect(getByText('testRepoName')).toBeInTheDocument()

    expect(container.querySelector('.separator')).toBeInTheDocument()

    expect(container.querySelector('[data-icon="git-new-branch"]')).toBeInTheDocument()
    expect(getByText('testBranch')).toBeInTheDocument()
    expect(container.querySelector('.branchSelector')).not.toBeInTheDocument()
    expect(container.querySelector('input')).not.toBeInTheDocument()
  })

  test('hide repo and show normal select input', () => {
    const { container, queryByText } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <GitRemoteDetails
          connectorRef="connectorId"
          onBranchChange={branchChangehandler}
          branch={'testBranch'}
          flags={{ showRepo: false, normalInputStyle: true }}
        />
      </TestWrapper>
    )

    const remoteBranchInput = container.querySelector('input[name="remoteBranch"]') as HTMLInputElement
    expect(remoteBranchInput).toBeInTheDocument()
    expect(remoteBranchInput.value).toBe('testBranch')

    expect(container.querySelector('.normalInputStyle')).toBeInTheDocument()
    expect(container.querySelector('[data-icon="repository"]')).not.toBeInTheDocument()
    expect(queryByText('testRepoName')).not.toBeInTheDocument()
    expect(container.querySelector('.separator')).not.toBeInTheDocument()
  })
})
