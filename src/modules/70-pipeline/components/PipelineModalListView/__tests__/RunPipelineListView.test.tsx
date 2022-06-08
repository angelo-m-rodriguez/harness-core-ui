/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, act, fireEvent } from '@testing-library/react'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import PipelineModalList from '../PipelineModalListView'
import { EmptyResponse, mockData, mockDataWithGitDetails } from './RunPipelineListViewMocks'

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline1',
  module: 'cd'
}

jest.mock('services/cd-ng', () => ({
  useGetSourceCodeManagers: () => ({
    data: []
  }),
  useCreatePR: () => ({ data: [], mutate: jest.fn() }),
  useCreatePRV2: () => ({ data: [], mutate: jest.fn() }),
  useGetFileContent: () => ({
    data: [],
    mutate: jest.fn(),
    refetch: jest.fn()
  }),
  useListGitSync: () => ({
    data: [],
    refetch: jest.fn()
  }),
  useGetListOfBranchesWithStatus: () => ({
    data: [],
    refetch: jest.fn()
  })
}))

const TEST_PATH = routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })

describe('PipelineModal List View', () => {
  test('render list view', async () => {
    jest.mock('services/pipeline-ng', () => ({
      useGetPipelineList: () => mockData
    }))
    const { getByTestId, container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <PipelineModalList onClose={jest.fn()} mockData={mockData} />
      </TestWrapper>
    )
    await waitFor(() => getByTestId(params.pipelineIdentifier))
    expect(container).toMatchSnapshot()
  })

  test('CD - render empty data', async () => {
    jest.mock('services/pipeline-ng', () => ({
      useGetPipelineList: () => EmptyResponse
    }))
    const { queryByText } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <PipelineModalList onClose={jest.fn()} mockData={EmptyResponse} />
      </TestWrapper>
    )

    await waitFor(() => expect(queryByText('pipeline.noDeploymentText')).toBeTruthy())
  })

  test('CI - render empty data', async () => {
    jest.mock('services/pipeline-ng', () => ({
      useGetPipelineList: () => EmptyResponse
    }))
    const { queryByText } = render(
      <TestWrapper
        path={TEST_PATH}
        pathParams={{ ...params, module: 'ci' }}
        defaultAppStoreValues={defaultAppStoreValues}
      >
        <PipelineModalList onClose={jest.fn()} mockData={EmptyResponse} />
      </TestWrapper>
    )

    await waitFor(() => expect(queryByText('pipeline.runModalNoPipelineText')).toBeTruthy())
  })

  test('render data with git sync enabled', async () => {
    jest.mock('services/pipeline-ng', () => ({
      useGetPipelineList: () => mockDataWithGitDetails
    }))
    const { queryByDisplayValue } = render(
      <TestWrapper
        path={TEST_PATH}
        pathParams={params}
        defaultAppStoreValues={{ ...defaultAppStoreValues, isGitSyncEnabled: true }}
      >
        <PipelineModalList onClose={jest.fn()} mockData={mockDataWithGitDetails} />
      </TestWrapper>
    )

    // Git filters are seen
    await waitFor(() => expect(queryByDisplayValue('common.gitSync.defaultBranches')).toBeTruthy())
    await waitFor(() => expect(queryByDisplayValue('common.gitSync.allRepositories')).toBeTruthy())
  })

  test('if search works', async () => {
    jest.mock('services/pipeline-ng', () => ({
      useGetPipelineList: () => mockData
    }))
    const { getByPlaceholderText } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={{ ...defaultAppStoreValues }}>
        <PipelineModalList onClose={jest.fn()} mockData={mockData} />
      </TestWrapper>
    )

    act(() => {
      fireEvent.change(getByPlaceholderText('search'), { target: { value: 'searchstring' } })
    })
    // fetch pipelines called after search
    await waitFor(() => expect(mockData.mutate).toBeCalled())
  })
})
