/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TestWrapper, CurrentLocation } from '@common/utils/testUtils'
import { getPipelineStagesMap } from '@pipeline/utils/executionUtils'
import ExecutionContext from '@pipeline/context/ExecutionContext'
import type { ExecutionContextParams } from '@pipeline/context/ExecutionContext'
import ExecutionLogView from '../ExecutionLogView'
import mock from '../../ExecutionGraphView/__tests__/mock.json'

jest.mock('@pipeline/components/PipelineSteps/PipelineStepFactory', () => ({
  getStepIcon: jest.fn(),
  registerStep: jest.fn()
}))

const contextValue: ExecutionContextParams = {
  pipelineExecutionDetail: mock.data as any,
  allNodeMap: mock.data.executionGraph.nodeMap as any,
  pipelineStagesMap: getPipelineStagesMap(
    mock.data.pipelineExecutionSummary.layoutNodeMap as any,
    mock.data.pipelineExecutionSummary.startingNodeId
  ),
  selectedStageId: 'google_1',
  selectedStepId: '',
  queryParams: {},
  loading: false,
  isDataLoadedForSelectedStage: true,
  logsToken: 'token',
  setLogsToken: jest.fn(),
  addNewNodeToMap: jest.fn(),
  setSelectedStepId: jest.fn(),
  setSelectedStageId: jest.fn()
}

const fetchMock = jest.spyOn(global, 'fetch' as any)
fetchMock.mockResolvedValue({
  text: () => new Promise(resolve => resolve('')),
  json: () => new Promise(resolve => resolve({})),
  headers: { get: () => 'application/json' }
})

describe('<ExecutionLogView /> tests', () => {
  test('snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <ExecutionContext.Provider value={contextValue}>
          <ExecutionLogView />
          <CurrentLocation />
        </ExecutionContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('stage selection works', async () => {
    const { findByText, getByTestId } = render(
      <TestWrapper>
        <ExecutionContext.Provider value={contextValue}>
          <ExecutionLogView />
          <CurrentLocation />
        </ExecutionContext.Provider>
      </TestWrapper>
    )

    const stageBtn = await findByText('Google1')

    fireEvent.click(stageBtn!)

    const stage = await findByText('Google2')

    fireEvent.click(stage)

    expect(getByTestId('location').innerHTML).toContain('stage=google_2')
  })
})
