/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, queryByText } from '@testing-library/react'
import { noop } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import RepoBranchSelectV2 from '../RepoBranchSelectV2'

const mockBranches = {
  status: 'SUCCESS',
  data: {
    branches: [{ name: 'main' }, { name: 'main-demo' }, { name: 'main-patch' }, { name: 'main-patch2' }],
    defaultBranch: { name: 'main' }
  },
  metaData: null,
  correlationId: 'correlationId'
}

const pathParams = { accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }

const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))
const branchChangehandler = jest.fn(() => noop)

jest.mock('services/cd-ng', () => ({
  useGetListOfBranchesByRefConnectorV2: jest.fn().mockImplementation(() => {
    return { data: mockBranches, refetch: fetchBranches }
  })
}))

describe('RepoBranchSelectV2 test', () => {
  afterEach(() => {
    fetchBranches.mockReset()
  })

  test('default rendering RepoBranchSelectV2', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" onChange={branchChangehandler} />
      </TestWrapper>
    )
    //refetch should not be called
    await waitFor(() => expect(fetchBranches).toBeCalledTimes(0))
    expect(getByText('gitBranch')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('rendering RepoBranchSelectV2 as disabled and no label as used in saveToGitForm for target branch selection', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <RepoBranchSelectV2
          connectorIdentifierRef="connectorId"
          repoName="repoName"
          onChange={branchChangehandler}
          disabled={true}
          noLabel={true}
        />
      </TestWrapper>
    )

    expect(queryByText(container, 'gitBranch')).toBeFalsy()
    expect(fetchBranches).not.toBeCalled()
  })
})
