/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { ExecutionContext, ExecutionContextParams } from '@pipeline/context/ExecutionContext'
import { LogsContent, DefaultConsoleViewStepDetails } from '../LogsContent'
import { useLogsContent } from '../useLogsContent'
import { getDefaultReducerState } from '../LogsState/utils'
import type { UseActionCreatorReturn } from '../LogsState/actions'
import { testReducerState } from './mocks'
import responseMessages from './reponseMessages.json'

jest.mock('../components/GroupedLogs', () => ({
  GroupedLogsWithRef: React.forwardRef(() => <div>Grouped logs</div>)
}))

const SELECTED_STEP_SYMBOL = Symbol('SELECTED_STEP_SYMBOL')
const RETRY_STEP_SYMBOL = Symbol(' RETRY_STEP_SYMBOL')
const actions: UseActionCreatorReturn = {
  createSections: jest.fn(),
  fetchSectionData: jest.fn(),
  fetchingSectionData: jest.fn(),
  updateSectionData: jest.fn(),
  toggleSection: jest.fn(),
  resetSection: jest.fn(),
  search: jest.fn(),
  resetSearch: jest.fn(),
  goToNextSearchResult: jest.fn(),
  goToPrevSearchResult: jest.fn()
}

const execContextValues: ExecutionContextParams = {
  pipelineExecutionDetail: null,
  allNodeMap: {},
  pipelineStagesMap: new Map(),
  selectedStageId: '',
  selectedStepId: '',
  loading: false,
  isDataLoadedForSelectedStage: false,
  queryParams: {},
  logsToken: '',
  setLogsToken: jest.fn(),
  refetch: undefined,
  addNewNodeToMap: jest.fn(),
  setStepsGraphCanvasState: jest.fn(),
  setSelectedStepId: jest.fn(),
  setSelectedStageId: jest.fn()
}

jest.mock('services/logs', () => ({
  useGetToken: jest.fn(() => ({})),
  logBlobPromise: jest.fn(() => Promise.resolve({}))
}))
jest.mock('../useLogsContent.tsx', () => ({
  useLogsContent: jest.fn(() => ({
    state: getDefaultReducerState(),
    actions
  }))
}))
describe('<LogsContent /> tests', () => {
  beforeEach(() => {
    Object.entries(actions).map(([_, fn]: [string, jest.Mock]) => fn.mockReset())
  })
  test('DefaultConsoleViewStepDetails snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <DefaultConsoleViewStepDetails step={{} as any} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('console-view snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <LogsContent mode="console-view" />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('step-details snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <LogsContent mode="step-details" />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('console-view error message test', () => {
    const { container } = render(
      <TestWrapper>
        <ExecutionContext.Provider
          value={{
            ...execContextValues,
            selectedStepId: 'SELECTED_STEP',
            selectedStageId: 'SELECTED_STAGE',
            allNodeMap: { SELECTED_STEP: { failureInfo: { responseMessages } } } as any
          }}
        >
          <LogsContent mode="console-view" />
        </ExecutionContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('console-view warning message test', () => {
    const { container } = render(
      <TestWrapper>
        <ExecutionContext.Provider
          value={{
            ...execContextValues,
            selectedStepId: 'SELECTED_STEP',
            selectedStageId: 'SELECTED_STAGE',
            allNodeMap: { SELECTED_STEP: { failureInfo: { responseMessages } } } as any
          }}
        >
          <LogsContent mode="console-view" isWarning />
        </ExecutionContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  describe('createSections tests', () => {
    test('createSections is called with correct arguments', async () => {
      render(
        <TestWrapper>
          <ExecutionContext.Provider
            value={{
              ...execContextValues,
              selectedStepId: 'SELECTED_STEP',
              selectedStageId: 'SELECTED_STAGE',
              allNodeMap: { SELECTED_STEP: SELECTED_STEP_SYMBOL, RETRY_STEP: RETRY_STEP_SYMBOL } as any
            }}
          >
            <DefaultConsoleViewStepDetails step={{} as any} />
          </ExecutionContext.Provider>
        </TestWrapper>
      )

      await waitFor(() =>
        expect(actions.createSections).toHaveBeenCalledWith({
          selectedStep: 'SELECTED_STEP',
          node: SELECTED_STEP_SYMBOL,
          selectedStage: 'SELECTED_STAGE',
          getSectionName: expect.any(Function)
        })
      )
    })

    test('createSections is called with correct arguments (retry step)', async () => {
      render(
        <TestWrapper>
          <ExecutionContext.Provider
            value={{
              ...execContextValues,
              selectedStepId: 'SELECTED_STEP',
              selectedStageId: 'SELECTED_STAGE',
              allNodeMap: { SELECTED_STEP: SELECTED_STEP_SYMBOL, RETRY_STEP: RETRY_STEP_SYMBOL } as any,
              queryParams: {
                retryStep: 'RETRY_STEP'
              }
            }}
          >
            <DefaultConsoleViewStepDetails step={{} as any} />
          </ExecutionContext.Provider>
        </TestWrapper>
      )

      await waitFor(() =>
        expect(actions.createSections).toHaveBeenCalledWith({
          selectedStep: 'SELECTED_STEP',
          node: RETRY_STEP_SYMBOL,
          selectedStage: 'SELECTED_STAGE',
          getSectionName: expect.any(Function)
        })
      )
    })
  })

  describe('search tests', () => {
    test('search works', async () => {
      const { container } = render(
        <TestWrapper>
          <LogsContent mode="console-view" errorMessage="This is an error message" />
        </TestWrapper>
      )

      const searchElem = container.querySelector('[type="search"]')!

      fireEvent.change(searchElem, { target: { value: 'hello' } })

      await waitFor(() => expect(actions.search).toHaveBeenCalledWith('hello'))

      fireEvent.change(searchElem, { target: { value: '' } })

      await waitFor(() => expect(actions.resetSearch).toHaveBeenCalledWith())
    })

    test('keyboard nav works', async () => {
      const { container } = render(
        <TestWrapper>
          <LogsContent mode="console-view" errorMessage="This is an error message" />
        </TestWrapper>
      )

      const elem = container.querySelector('.rhs')!

      fireEvent.keyDown(elem, { key: 'ArrowUp' })

      await waitFor(() => expect(actions.goToPrevSearchResult).toHaveBeenCalledWith())

      fireEvent.keyDown(elem, { key: 'ArrowDown' })

      await waitFor(() => expect(actions.goToNextSearchResult).toHaveBeenCalledWith())
    })
  })

  describe('Logs test', () => {
    test('SingleSectionLogs', () => {
      ;(useLogsContent as jest.Mock).mockImplementation(() => ({
        state: { ...testReducerState, units: ['Section 1'] },
        actions
      }))

      const { container, getByText } = render(
        <TestWrapper>
          <LogsContent mode="console-view" />
        </TestWrapper>
      )
      const button = getByText('Bottom')
      userEvent.click(button)
      expect(container).toMatchSnapshot()
    })

    test('GroupedLogs', () => {
      ;(useLogsContent as jest.Mock).mockImplementation(() => ({
        state: { ...testReducerState, units: ['Section 1', 'Section 2'] },
        actions
      }))

      const { container, getByText } = render(
        <TestWrapper>
          <LogsContent mode="console-view" />
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
      expect(getByText('Grouped logs')).toBeTruthy()
    })
  })
})
