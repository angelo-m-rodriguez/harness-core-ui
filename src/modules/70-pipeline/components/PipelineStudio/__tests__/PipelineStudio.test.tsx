/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render } from '@testing-library/react'

import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import gitSyncListResponse from '@common/utils/__tests__/mocks/gitSyncRepoListMock.json'
import { TestWrapper } from '@common/utils/testUtils'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import { ConnectorResponse } from '@pipeline/components/InputSetForm/__tests__/InputSetMocks'

import { PipelineStudio } from '../PipelineStudio'
import { PipelineContext } from '../PipelineContext/PipelineContext'
import pipelineContextMock from '../PipelineCanvas/__tests__/PipelineCanvasGitSyncTestHelper'

jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn(() => Promise.resolve(new Map())),
  useValidationError: () => ({ errorMap: new Map() })
}))
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/pipeline-ng', () => ({
  putPipelinePromise: jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' })),
  createPipelinePromise: jest.fn().mockImplementation(() => Promise.resolve({ status: 'SUCCESS' })),
  useGetInputsetYaml: jest.fn(() => ({ data: null })),
  useCreateVariablesV2: jest.fn(() => ({
    mutate: jest.fn(() => Promise.resolve({ data: { yaml: '' } })),
    loading: false,
    cancel: jest.fn()
  }))
}))

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse),
  useCreatePR: jest.fn(() => noop),
  useCreatePRV2: jest.fn(() => noop),
  useGetFileContent: jest.fn(() => noop),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  }),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitSyncListResponse, refetch: getListGitSync, loading: false }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
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

const TEST_PATH = routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })

function PipelineStudioTestWrapper({
  modifiedPipelineContextMock,
  pipelineIdentifier
}: {
  modifiedPipelineContextMock: any
  pipelineIdentifier: string
}): React.ReactElement {
  return (
    <PipelineContext.Provider value={modifiedPipelineContextMock}>
      <TestWrapper
        path={TEST_PATH}
        pathParams={{
          accountId: 'testAcc',
          orgIdentifier: 'default',
          projectIdentifier: 'testProject',
          pipelineIdentifier,
          module: 'cd'
        }}
        queryParams={{
          repoIdentifier: 'identifier',
          branch: 'feature'
        }}
        defaultAppStoreValues={{ isGitSyncEnabled: true }}
      >
        <PipelineStudio
          routePipelineStudio={routes.toPipelineStudio}
          routePipelineDetail={routes.toPipelineDetail}
          routePipelineList={routes.toPipelines}
          routePipelineProject={routes.toProjectDetails}
        />
      </TestWrapper>
    </PipelineContext.Provider>
  )
}

describe('PipelineStudio tests', () => {
  test('should render error experience when there is error in js code', () => {
    const { getByText: getElementByText } = render(
      <PipelineStudioTestWrapper
        modifiedPipelineContextMock={pipelineContextMock}
        pipelineIdentifier={'test_pipeline'}
      />
    )
    const errorTitle = getElementByText('errorTitle')
    expect(errorTitle).toBeInTheDocument()

    const errorSubtitle = getElementByText('errorSubtitle')
    expect(errorSubtitle).toBeInTheDocument()

    const clickHereBtn = getElementByText('clickHere')
    expect(clickHereBtn).toBeInTheDocument()
  })
})
