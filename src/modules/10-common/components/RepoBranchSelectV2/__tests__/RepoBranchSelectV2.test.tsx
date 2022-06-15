/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, queryByText, fireEvent } from '@testing-library/react'
import { Formik } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { useGetListOfBranchesByRefConnectorV2 } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { modulePathProps, pipelinePathProps, projectPathProps } from '@common/utils/routeUtils'
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

const testPath = routes.toPipelineStudio({
  ...projectPathProps,
  ...pipelinePathProps,
  ...modulePathProps
})

const pathParams = {
  accountId: 'dummy',
  orgIdentifier: 'default',
  projectIdentifier: 'dummyProject',
  module: 'cd',
  pipelineIdentifier: '-1'
}

const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))

jest.mock('services/cd-ng', () => ({
  useGetListOfBranchesByRefConnectorV2: jest.fn().mockImplementation(() => {
    return { data: mockBranches, refetch: fetchBranches, error: null, loading: false }
  })
}))

describe('RepoBranchSelectV2 test', () => {
  afterEach(() => {
    fetchBranches.mockReset()
  })

  test('default rendering RepoBranchSelectV2', async () => {
    const { container, getByText } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" />
      </TestWrapper>
    )
    //fetchBranches should be called once
    await waitFor(() => expect(fetchBranches).toBeCalledTimes(1))
    expect(getByText('gitBranch')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('rendering RepoBranchSelectV2 as disabled and no label as used in saveToGitForm for target branch selection', async () => {
    const { container } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" disabled={true} noLabel={true} />
        </Formik>
      </TestWrapper>
    )

    expect(queryByText(container, 'gitBranch')).toBeFalsy()
    expect(fetchBranches).not.toBeCalled()
  })

  test('Branch list api called only if connectorRef and repoName are provided and field is not disabled', () => {
    render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" disabled={true} />
        </Formik>
      </TestWrapper>
    )

    expect(fetchBranches).not.toBeCalled()

    render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 repoName="repoName" disabled={false} />
        </Formik>
      </TestWrapper>
    )

    expect(fetchBranches).not.toBeCalled()

    render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 connectorIdentifierRef="connectorId" disabled={false} />
        </Formik>
      </TestWrapper>
    )

    expect(fetchBranches).not.toBeCalled()

    render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" disabled={false} />
        </Formik>
      </TestWrapper>
    )

    expect(fetchBranches).toBeCalledTimes(1)
  })

  test('Show refetch button if branch list api failed', () => {
    ;(useGetListOfBranchesByRefConnectorV2 as jest.Mock).mockImplementation(() => ({
      data: [],
      refetch: fetchBranches,
      error: {
        data: {
          responseMessages: ['error']
        }
      },
      loading: false
    }))

    const { container, getByText } = render(
      <TestWrapper path={testPath} pathParams={pathParams}>
        <Formik onSubmit={jest.fn()} formName={''} initialValues={undefined}>
          <RepoBranchSelectV2 connectorIdentifierRef="connectorId" repoName="repoName" disabled={false} />
        </Formik>
      </TestWrapper>
    )

    const refreshButton = container.querySelector('[data-icon="refresh"]') as HTMLSpanElement

    expect(getByText('refresh')).toBeInTheDocument()
    expect(refreshButton).toBeInTheDocument()
    expect(fetchBranches).toBeCalledTimes(1)

    fireEvent.click(refreshButton)

    expect(fetchBranches).toBeCalledTimes(2)
  })
})
