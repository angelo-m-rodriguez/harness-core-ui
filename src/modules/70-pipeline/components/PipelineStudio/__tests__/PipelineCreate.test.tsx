/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { gitConfigs, sourceCodeManagers, branchStatusMock } from '@connectors/mocks/mock'
import * as GitSyncStoreContext from 'framework/GitRepoStore/GitSyncStoreContext'
import PipelineCreate from '../CreateModal/PipelineCreate'
import type { PipelineCreateProps } from '../CreateModal/PipelineCreate'
import { DefaultNewPipelineId } from '../PipelineContext/PipelineActions'

const afterSave = jest.fn()
const closeModal = jest.fn()

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.mock('services/cd-ng', () => ({
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  }),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitConfigs, refetch: getListGitSync }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))

jest.spyOn(GitSyncStoreContext, 'useGitSyncStore').mockImplementation((): GitSyncStoreContext.GitSyncStoreProps => {
  return {
    loadingRepos: false,
    gitSyncRepos: gitConfigs,
    codeManagers: sourceCodeManagers.data || [],
    loadingCodeManagers: false,
    updateStore: jest.fn(),
    refreshStore: jest.fn()
  }
})

const getEditProps = (
  identifier = 'test',
  description = 'desc',
  name = 'pipeline',
  repo = '',
  branch = ''
): PipelineCreateProps => ({
  afterSave,
  initialValues: { identifier, description, name, repo, branch, stages: [] },
  closeModal
})

describe('PipelineCreate test', () => {
  test('initializes ok for CI module', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/ci/dashboard/:pipelineIdentifier/"
        pathParams={{
          accountId: 'dummy',
          pipelineIdentifier: -1
        }}
      >
        <PipelineCreate />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    const nameInput = container.querySelector('[name="name"]')
    expect(nameInput).not.toBeNull()
    const collpase = container.querySelector('.Collapse--main')?.querySelector('.CollapseHeader--leftSection')
    expect(collpase).not.toBeNull()
    const submit = container.getElementsByTagName('button')[0]
    await act(async () => {
      fireEvent.change(nameInput as Element, 'Sample Pipeline')
      fireEvent.click(submit)
    })
    await waitFor(() => nameInput?.getAttribute('value') == 'Sample Pipeline')
    if (collpase) {
      await act(async () => {
        fireEvent.click(collpase)
      })

      expect(container.querySelector('.Collapse--main')).not.toBeNull()
    }
  })
  test('initializes ok for CD module', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/dashboard/:pipelineIdentifier/"
        pathParams={{
          accountId: 'dummy',
          pipelineIdentifier: -1
        }}
      >
        <PipelineCreate />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    const nameInput = container.querySelector('[name="name"]')
    expect(nameInput).not.toBeNull()
    const collpase = container.querySelector('.Collapse--main')?.querySelector('.CollapseHeader--leftSection')
    expect(collpase).not.toBeNull()
    const submit = container.getElementsByTagName('button')[0]
    await act(async () => {
      fireEvent.change(nameInput as Element, 'Sample Pipeline')
      fireEvent.click(submit)
    })
    await waitFor(() => nameInput?.getAttribute('value') == 'Sample Pipeline')
    if (collpase) {
      await act(async () => {
        fireEvent.click(collpase)
      })

      expect(container.querySelector('.Collapse--main')).not.toBeNull()
    }
  })
  test('initializes ok edit pipeline', async () => {
    afterSave.mockReset()
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/dashboard/:pipelineIdentifier/"
        pathParams={{
          accountId: 'dummy',
          pipelineIdentifier: 'test'
        }}
      >
        <PipelineCreate {...getEditProps()} />
      </TestWrapper>
    )
    await waitFor(() => getByText('continue'))
    expect(container).toMatchSnapshot()
    const continueBtn = getByText('continue')
    fireEvent.click(continueBtn)
    await waitFor(() => expect(afterSave).toBeCalledTimes(1))
    expect(afterSave).toBeCalledWith(
      {
        description: 'desc',
        identifier: 'test',
        name: 'pipeline',
        stages: []
      },
      { connectorRef: undefined, storeType: undefined },
      undefined,
      undefined
    )
    const closeBtn = getByText('cancel')
    fireEvent.click(closeBtn!)
    await waitFor(() => expect(closeModal).toBeCalledTimes(1))
    expect(closeModal).toBeCalled()
  })
  test('initializes ok new pipeline', async () => {
    closeModal.mockReset()
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/dashboard"
        pathParams={{
          accountId: 'dummy'
        }}
      >
        <PipelineCreate {...getEditProps(DefaultNewPipelineId)} />
      </TestWrapper>
    )
    await waitFor(() => getByText('start'))
    expect(container).toMatchSnapshot()
  })

  test('when git exp is enabled - pipeline edit modal should display repo and branch to save pipeline to', async () => {
    const initialPipelineCreateData = {
      identifier: 'pipeline1',
      name: 'Pipeline 1',
      description: 'abc',
      repo: 'repo',
      branch: 'branch',
      stages: []
    }
    const { getByText } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:ordIdentifier/projects/:projectIdentifier/pipelines/:pipelineIdentifier/pipeline-studio"
        pathParams={{
          accountId: 'dummy',
          ordIdentifier: 'testOrg',
          projectIdentifier: 'testProject',
          pipelineIdentifier: DefaultNewPipelineId,
          module: 'cd'
        }}
        defaultAppStoreValues={{ isGitSyncEnabled: true }}
      >
        <PipelineCreate initialValues={initialPipelineCreateData} afterSave={afterSave} />
      </TestWrapper>
    )

    await waitFor(() => getByText('continue'))
    expect(getByText('COMMON.GITSYNC.GITREPOSITORYDETAILS')).not.toBeNull()
    expect(getByText('common.git.selectRepoLabel')).not.toBeNull()
    expect(getByText('common.gitSync.selectBranchLabel')).not.toBeNull()

    const continueBtn = getByText('continue').parentElement
    act(() => {
      fireEvent.click(continueBtn!)
    })

    await waitFor(() => expect(afterSave).toHaveBeenCalledTimes(1))
    expect(afterSave).toBeCalledWith(
      {
        identifier: 'pipeline1',
        name: 'Pipeline 1',
        description: 'abc',
        stages: []
      },
      {
        connectorRef: undefined,
        storeType: undefined
      },
      {
        repoIdentifier: 'identifier',
        branch: 'branch'
      },
      undefined
    )
  })
})
