/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'

import routes from '@common/RouteDefinitions'
import { accountPathProps, executionPathProps } from '@common/utils/routeUtils'
import { TestWrapper } from '@common/utils/testUtils'
import type { PipelineLogsPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useGetExecutionDetailV2, useGetExecutionNode } from 'services/pipeline-ng'

import singleSectionData from './single-section-data.json'
import multiSectionData from './multi-section-data.json'
import FullPageLogView from '../FullPageLogView'

const LOGS_TEXT = `{"level":"INFO","pos":0,"out":"Initializing..","time":"2022-01-27T20:51:00.079Z","args":null}
{"level":"INFO","pos":0,"out":"\u001b[1;93m\u001b[40mRelease Name: [event-gen-smoke-test]\u001b[0m","time":"2022-01-27T20:51:00.079Z","args":null}
{"level":"INFO","pos":0,"out":"\u001b[1;97m\u001b[40m\u001b[1;97m\u001b[40mWorkload to scale is: \u001b[0m\u001b[1;96m\u001b[40moverops-snapshot/Deployment/overops-event-gen-overops-event-generator\u001b[0m","time":"2022-01-27T20:51:00.122Z","args":null}
{"level":"INFO","pos":0,"out":"Querying current replicas","time":"2022-01-27T20:51:00.122Z","args":null}
{"level":"INFO","pos":0,"out":"Current replica count is 0","time":"2022-01-27T20:51:00.325Z","args":null}
{"level":"INFO","pos":0,"out":"Target replica count is 1","time":"2022-01-27T20:51:00.325Z","args":null}
{"level":"INFO","pos":0,"out":"Done.","time":"2022-01-27T20:51:00.325Z","args":null}`

jest.mock('services/pipeline-ng', () => ({
  useGetExecutionDetailV2: jest.fn(() => ({ data: {}, loading: false })),
  useGetExecutionNode: jest.fn(() => ({ data: {}, loading: false }))
}))

jest.mock('services/logs', () => ({
  useGetToken: jest.fn(() => ({ data: 'TEST_TOKEN', loading: false })),
  logBlobPromise: jest.fn(() => Promise.resolve(LOGS_TEXT))
}))

const TEST_PATH = routes.toPipelineLogs({
  ...accountPathProps,
  ...executionPathProps,
  module: ':module',
  stageIdentifier: ':stageIdentifier',
  stepIndentifier: ':stepIndentifier'
})

const TEST_PARAMS: PipelineType<PipelineLogsPathProps> = {
  accountId: 'TEST_ACCOUNT',
  pipelineIdentifier: 'TEST_PIPELINE',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  executionIdentifier: 'TEST_EXEC',
  stageIdentifier: 'TEST_STAGE',
  stepIndentifier: 'TEST_STEP',
  source: 'executions',
  module: 'cd'
}

describe('<FullPageLogView /> tests', () => {
  let mockDate: jest.SpyInstance<unknown> | undefined
  let mocktime: jest.SpyInstance<unknown> | undefined

  beforeAll(() => {
    mockDate = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('17:00')
    mocktime = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2022-03-04')
  })

  afterAll(() => {
    mockDate?.mockRestore()
    mocktime?.mockRestore()
  })

  test('loading', () => {
    ;(useGetExecutionDetailV2 as jest.Mock).mockReturnValue({ loading: true })
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={TEST_PARAMS as any}>
        <FullPageLogView />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('single section data', async () => {
    ;(useGetExecutionDetailV2 as jest.Mock).mockReturnValue({ data: singleSectionData, loading: false })
    const { container, getByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={{ ...TEST_PARAMS, stepIndentifier: 'ASRaWM6CQbOA6Gk3dpnSxw' } as any}>
        <FullPageLogView />
      </TestWrapper>
    )

    await waitFor(() => getByTestId('single-section'))

    expect(container).toMatchSnapshot()
  })

  test('multi section data', async () => {
    ;(useGetExecutionDetailV2 as jest.Mock).mockReturnValue({ data: multiSectionData, loading: false })
    const { container, getByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={{ ...TEST_PARAMS, stepIndentifier: '4Hwky8Z5QEWUPOg0Av2_Yg' } as any}>
        <FullPageLogView />
      </TestWrapper>
    )

    await waitFor(() => getByTestId('multi-section'))

    expect(container).toMatchSnapshot()
  })

  test('retry node', async () => {
    ;(useGetExecutionDetailV2 as jest.Mock).mockReturnValue({ data: {}, loading: false })
    ;(useGetExecutionNode as jest.Mock).mockReturnValue({
      data: { data: singleSectionData.data.executionGraph.nodeMap.ASRaWM6CQbOA6Gk3dpnSxw }
    })
    const { container, getByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={{ ...TEST_PARAMS, stepIndentifier: 'ASRaWM6CQbOA6Gk3dpnSxw' } as any}>
        <FullPageLogView />
      </TestWrapper>
    )

    await waitFor(() => getByTestId('single-section'))

    expect(container).toMatchSnapshot()
  })
})
