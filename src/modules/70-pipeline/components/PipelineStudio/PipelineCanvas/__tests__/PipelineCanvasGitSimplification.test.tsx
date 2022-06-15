import React from 'react'
import { useParams } from 'react-router-dom'
import { render, fireEvent, act } from '@testing-library/react'
import * as useModal from '@harness/use-modal'
import { TestWrapper } from '@common/utils/testUtils'
import { useMutateAsGet } from '@common/hooks'
import routes from '@common/RouteDefinitions'
import { StoreType } from '@common/constants/GitSyncTypes'
import { PipelineCanvas, PipelineCanvasProps } from '../PipelineCanvas'
import { PipelineContext } from '../../PipelineContext/PipelineContext'
import { DefaultNewPipelineId } from '../../PipelineContext/PipelineActions'
import { getGitContext, mockPipelineTemplateYaml } from './PipelineCanvasTestHelper'

const getProps = (): PipelineCanvasProps => ({
  toPipelineStudio: jest.fn(),
  toPipelineDetail: jest.fn(),
  toPipelineList: jest.fn(),
  toPipelineProject: jest.fn()
})

const gitTestPath = routes.toPipelineStudio({
  projectIdentifier: 'harness',
  orgIdentifier: 'default',
  pipelineIdentifier: 'Pipeline',
  accountId: 'px7xd_BFRCi-pfWPYXVjvw',
  module: 'cd'
})

const gitAppStore = { isGitSimplificationEnabled: true }

const gitPathParams = {
  accountId: 'TEST_ACCOUNT_ID',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  pipelineIdentifier: 'Pipeline',
  module: 'cd'
}

const gitQueryParams = {
  branch: 'mainBranchName',
  repoName: 'harnessRepoName',
  connectorRef: 'harness',
  storeType: StoreType.REMOTE
}

const gitSimplificationTestProps = {
  path: gitTestPath,
  pathParams: gitPathParams,
  queryParams: gitQueryParams,
  defaultAppStoreValues: gitAppStore
}

/* Mocks */
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn().mockReturnValue({ error: { size: 2 } })
}))
jest.mock('resize-observer-polyfill', () => {
  class ResizeObserver {
    static default = ResizeObserver
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    observe() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    unobserve() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    disconnect() {
      // do nothing
    }
  }
  return ResizeObserver
})
jest.mock('framework/GitRepoStore/GitSyncStoreContext', () => ({
  useGitSyncStore: jest.fn().mockReturnValue({ gitSyncRepos: [{ identifier: 'repoIdentifier', name: 'repoName' }] })
}))
// eslint-disable-next-line jest-no-mock
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useParams: jest.fn()
}))

jest.mock('services/pipeline-ng', () => ({
  putPipelinePromise: jest.fn(),
  createPipelinePromise: jest.fn(),
  useGetInputsetYaml: () => jest.fn(),
  useGetTemplateFromPipeline: jest.fn()
}))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn()
}))

const showError = jest.fn()
const showSuccess = jest.fn()
const toasterClear = jest.fn()

jest.mock('@wings-software/uicore', () => ({
  ...jest.requireActual('@wings-software/uicore'),
  useToaster: jest.fn(() => ({ showError, showSuccess, clear: toasterClear }))
}))

describe('Git simplication', () => {
  beforeEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useParams.mockImplementation(() => {
      return { pipelineIdentifier: DefaultNewPipelineId }
    })

    // eslint-disable-next-line
    // @ts-ignore
    useMutateAsGet.mockImplementation(() => {
      return mockPipelineTemplateYaml
    })
  })

  test('Git repo and branch are shown for remote pipelines', () => {
    const props = getProps()
    const contextValue = getGitContext()
    const { getByText, container } = render(
      <TestWrapper {...gitSimplificationTestProps}>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container.querySelector('.gitRemoteDetailsWrapper')).toBeInTheDocument()
    expect(getByText(gitQueryParams.repoName)).toBeInTheDocument()
    expect(container.querySelector('[data-icon="repository"]')).toBeInTheDocument()
    expect(getByText(gitQueryParams.branch)).toBeInTheDocument()
    expect(container.querySelector('[data-icon="git-new-branch"]')).toBeInTheDocument()
  })

  test('If pipeline not found in remote, we show branch selector', () => {
    const props = getProps()
    const contextValue = getGitContext(true)
    const { getByText, container } = render(
      <TestWrapper {...gitSimplificationTestProps}>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container.querySelector('.normalInputStyle')).toBeInTheDocument()
    expect(container.querySelector('[data-icon="git-new-branch"]')).toBeInTheDocument()
    expect(getByText('pipeline.gitExperience.noEntityFound')).toBeInTheDocument()
    expect(getByText('pipeline.gitExperience.selectDiffBranch')).toBeInTheDocument()
    const remoteBranchInput = container.querySelector('input[name="remoteBranch"]') as HTMLInputElement
    expect(remoteBranchInput).toBeInTheDocument()
    expect(remoteBranchInput.value).toBe(gitQueryParams.branch)
  })

  test('Edit button opens modal', () => {
    const openModal = jest.fn()
    jest.spyOn(useModal, 'useModalHook').mockReturnValue([openModal, jest.fn()])

    const props = getProps()
    const contextValue = getGitContext()
    const { container } = render(
      <TestWrapper {...gitSimplificationTestProps}>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(openModal).not.toHaveBeenCalled()
    const editButton = container.querySelector('[data-icon="Edit"]')?.parentElement as HTMLButtonElement
    act(() => {
      fireEvent.click(editButton)
    })
    expect(openModal).toBeCalledTimes(1)
  })
})
