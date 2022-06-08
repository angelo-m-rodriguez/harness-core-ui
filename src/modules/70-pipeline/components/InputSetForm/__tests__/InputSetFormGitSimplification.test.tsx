/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent, getByText as getElementByText, findByText } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { noop } from 'lodash-es'
import { GitSyncTestWrapper } from '@common/utils/gitSyncTestUtils'
import gitSyncListResponse from '@common/utils/__tests__/mocks/gitSyncRepoListMock.json'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, inputSetFormPathProps } from '@common/utils/routeUtils'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { EnhancedInputSetForm } from '../InputSetForm'
import {
  TemplateResponse,
  PipelineResponse,
  GetInputSetsResponse,
  GetInputSetEdit,
  MergeInputSetResponse,
  GetOverlayInputSetEdit,
  createInputSetCallFirstArg,
  createInputSetCallSecondArg,
  updateInputSetCallSecondArgNewBranch,
  gitSimpplificationMockData
} from './InputSetMocks'
import pipelineContextMock from '../../PipelineStudio/PipelineCanvas/__tests__/PipelineCanvasGitSyncTestHelper'
import { StoreType } from '@common/constants/GitSyncTypes'
import { gitHubMock } from '@gitsync/components/gitSyncRepoForm/__tests__/mockData'

const successResponse = (): Promise<{ status: string }> => Promise.resolve({ status: 'SUCCESS' })

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

const mockRepos = {
  status: 'SUCCESS',
  data: [{ name: 'repo1' }, { name: 'repo2' }, { name: 'repo3' }, { name: 'repotest1' }, { name: 'repotest2' }],
  metaData: null,
  correlationId: 'correlationId'
}

const mockBranches = {
  status: 'SUCCESS',
  data: {
    branches: [{ name: 'main' }, { name: 'main-demo' }, { name: 'main-patch' }, { name: 'main-patch2' }],
    defaultBranch: { name: 'main' }
  },
  metaData: null,
  correlationId: 'correlationId'
}

const getGitConnector = jest.fn(() => Promise.resolve(gitHubMock))
const fetchRepos = jest.fn(() => Promise.resolve(mockRepos))
const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))

jest.mock('services/cd-ng', () => ({
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(gitHubMock)),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: gitHubMock.data.content[0], refetch: getGitConnector, loading: false }
  }),
  useGetListOfReposByRefConnector: jest.fn().mockImplementation(() => {
    return { data: mockRepos, refetch: fetchRepos, loading: false }
  }),
  useGetListOfBranchesByRefConnectorV2: jest.fn().mockImplementation(() => {
    return { data: mockBranches, refetch: fetchBranches }
  }),
  useCreatePR: jest.fn(() => noop),
  useCreatePRV2: jest.fn(() => noop),
  useGetFileContent: jest.fn(() => noop),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitSyncListResponse, refetch: getListGitSync, loading: false }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  }),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  })
}))

const createInputSet = jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' }))
const updateInputSet = jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' }))

jest.mock('services/pipeline-ng', () => ({
  useGetInputSetForPipeline: jest.fn(() => GetInputSetEdit),
  useCreateVariablesV2: () => jest.fn(() => ({})),
  useGetMergeInputSetFromPipelineTemplateWithListInput: jest.fn(() => MergeInputSetResponse),
  useGetPipeline: jest.fn(() => PipelineResponse),
  useGetTemplateFromPipeline: jest.fn(() => TemplateResponse),
  useGetStagesExecutionList: jest.fn(() => ({})),
  useGetOverlayInputSetForPipeline: jest.fn(() => GetOverlayInputSetEdit),
  useCreateInputSetForPipeline: jest.fn(() => ({ mutate: createInputSet })),
  useUpdateInputSetForPipeline: jest.fn().mockImplementation(() => ({ mutate: updateInputSet })),
  useUpdateOverlayInputSetForPipeline: jest.fn().mockImplementation(() => ({ mutate: successResponse })),
  useCreateOverlayInputSetForPipeline: jest.fn(() => ({})),
  useGetInputSetsListForPipeline: jest.fn(() => GetInputSetsResponse),
  useGetSchemaYaml: jest.fn(() => ({})),
  useSanitiseInputSet: jest.fn(() => PipelineResponse),
  useDeleteInputSetForPipeline: jest.fn(() => ({ mutate: jest.fn() }))
}))

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

const TEST_INPUT_SET_FORM_PATH = routes.toInputSetForm({
  ...accountPathProps,
  ...inputSetFormPathProps,
  ...pipelineModuleParams
})

describe('InputSetFrom testing - When Git Simplification is enabled', () => {
  describe('Edit InputSet', () => {
    test.only('render Input Set Form view in edit mode', async () => {
      const { container } = render(
        <PipelineContext.Provider value={pipelineContextMock}>
          <GitSyncTestWrapper
            path={TEST_INPUT_SET_FORM_PATH}
            pathParams={{
              accountId: 'testAcc',
              orgIdentifier: 'testOrg',
              projectIdentifier: 'test',
              pipelineIdentifier: 'pipeline',
              inputSetIdentifier: 'asd',
              module: 'cd'
            }}
            queryParams={{
              repoName: 'identifier',
              branch: 'feature',
              connectorRef: 'connectorRef',
              storeType: StoreType.REMOTE
            }}
            defaultAppStoreValues={{ ...defaultAppStoreValues, isGitSimplificationEnabled: true }}
          >
            <EnhancedInputSetForm />
          </GitSyncTestWrapper>
        </PipelineContext.Provider>
      )
      expect(container).toMatchSnapshot()
      const saveBtn = (await findByText(container, 'save')).parentElement
      expect(saveBtn).toBeInTheDocument()
      fireEvent.click(saveBtn!)
      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getElementByText(portalDiv, 'common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      userEvent.click(saveToGitSaveBtn!)
      await waitFor(() => {
        expect(updateInputSet).toHaveBeenCalled()
        expect(updateInputSet).toHaveBeenCalledWith(
          gitSimpplificationMockData.createInputSetCallFirstArg,
          gitSimpplificationMockData.createInputSetCallSecondArg
        )
      })
    })

    test('save an existing input set to a new branch', async () => {
      const { container } = render(
        <PipelineContext.Provider value={pipelineContextMock}>
          <GitSyncTestWrapper
            path={TEST_INPUT_SET_FORM_PATH}
            pathParams={{
              accountId: 'testAcc',
              orgIdentifier: 'testOrg',
              projectIdentifier: 'test',
              pipelineIdentifier: 'pipeline',
              inputSetIdentifier: 'asd',
              module: 'cd'
            }}
            queryParams={{
              repoIdentifier: 'identifier',
              branch: 'feature'
            }}
            defaultAppStoreValues={{ ...defaultAppStoreValues, isGitSyncEnabled: true }}
          >
            <EnhancedInputSetForm />
          </GitSyncTestWrapper>
        </PipelineContext.Provider>
      )
      jest.runOnlyPendingTimers()
      const saveBtn = (await findByText(container, 'save')).parentElement
      expect(saveBtn).toBeInTheDocument()
      fireEvent.click(saveBtn!)
      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getElementByText(portalDiv, 'common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        const commitToANewBranch = getElementByText(portalDiv, 'common.git.newBranchCommitLabel')
        fireEvent.click(commitToANewBranch)

        const branchInput = portalDiv.querySelector('input[name="branch"]')
        expect(branchInput).not.toBeDisabled()
        expect(branchInput?.getAttribute('value')).toBe('feature-patch')

        fireEvent.change(branchInput!, { target: { value: 'feature1' } })

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      userEvent.click(saveToGitSaveBtn!)
      await waitFor(() => {
        expect(updateInputSet).toHaveBeenCalled()
        expect(updateInputSet).toHaveBeenCalledWith(createInputSetCallFirstArg, updateInputSetCallSecondArgNewBranch)
      })
    })
  })

  describe('Create InputSet', () => {
    beforeEach(() => {
      delete GetInputSetEdit.data?.data?.gitDetails?.filePath
      delete GetInputSetEdit.data?.data?.gitDetails?.objectId

      jest.mock('services/pipeline-ng', () => ({
        useGetInputSetForPipeline: jest.fn(() => GetInputSetEdit)
      }))
    })
    test('render Input Set Form view in create mode', async () => {
      const { container } = render(
        <PipelineContext.Provider value={pipelineContextMock}>
          <GitSyncTestWrapper
            path={TEST_INPUT_SET_FORM_PATH}
            pathParams={{
              accountId: 'testAcc',
              orgIdentifier: 'testOrg',
              projectIdentifier: 'test',
              pipelineIdentifier: 'pipeline',
              inputSetIdentifier: '-1',
              module: 'cd'
            }}
            queryParams={{
              repoIdentifier: 'identifier',
              branch: 'feature'
            }}
            defaultAppStoreValues={{ ...defaultAppStoreValues, isGitSyncEnabled: true }}
          >
            <EnhancedInputSetForm />
          </GitSyncTestWrapper>
        </PipelineContext.Provider>
      )
      jest.runOnlyPendingTimers()
      const saveBtn = (await findByText(container, 'save')).parentElement
      expect(saveBtn).toBeInTheDocument()
      fireEvent.click(saveBtn!)
      let saveToGitSaveBtn: HTMLElement
      await waitFor(() => {
        const portalDiv = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
        const savePipelinesToGitHeader = getElementByText(portalDiv, 'common.git.saveResourceLabel')
        expect(savePipelinesToGitHeader).toBeInTheDocument()

        saveToGitSaveBtn = getElementByText(portalDiv, 'save').parentElement as HTMLElement
        expect(saveToGitSaveBtn).toBeInTheDocument()
      })
      fireEvent.click(saveToGitSaveBtn!)
      await waitFor(() => {
        expect(createInputSet).toHaveBeenCalled()
        expect(createInputSet).toHaveBeenCalledWith(createInputSetCallFirstArg, createInputSetCallSecondArg)
      })
    })
  })
})
