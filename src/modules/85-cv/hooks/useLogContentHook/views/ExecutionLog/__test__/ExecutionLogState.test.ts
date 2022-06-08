/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  executionLogs,
  executionLogsResponse,
  executionLogState,
  executionLogStateWithSearch,
  executionLogStateWithTAGS
} from '@cv/hooks/useLogContentHook/__test__/ExecutionLog.mock'
import { reducer, useActionCreator } from '../ExecutionLogState'
import { defaultReducerState } from '../ExecutionLog.constants'
import { ActionType } from '../ExecutionLog.types'

jest.mock('@common/utils/dateUtils', () => ({
  formatDatetoLocale: (x: number) => x.toString()
}))

describe('Execution Log State', () => {
  test('useActionCreator', () => {
    const dispatch = jest.fn()

    const actions = useActionCreator(dispatch)

    actions.setExecutionLogs(executionLogsResponse.resource?.content ?? [])
    expect(dispatch).toBeCalledWith({
      type: ActionType.SetExecutionLogs,
      payload: executionLogsResponse.resource?.content
    })

    actions.resetExecutionLogs()
    expect(dispatch).toBeCalledWith({
      type: ActionType.ResetExecutionLogs,
      payload: ''
    })

    actions.search('INFO')
    expect(dispatch).toBeCalledWith({
      type: ActionType.ResetExecutionLogs,
      payload: ''
    })

    actions.resetSearch()
    expect(dispatch).toBeCalledWith({
      type: ActionType.ResetSearch,
      payload: ''
    })

    actions.goToNextSearchResult()
    expect(dispatch).toBeCalledWith({
      type: ActionType.GoToNextSearchResult,
      payload: ''
    })

    actions.goToPrevSearchResult()
    expect(dispatch).toBeCalledWith({
      type: ActionType.GoToPrevSearchResult,
      payload: ''
    })
  })

  test('reducer - SetExecutionLogs', () => {
    const state = reducer(defaultReducerState, {
      type: ActionType.SetExecutionLogs,
      payload: executionLogs
    })

    expect(state).toEqual(executionLogStateWithTAGS)
  })

  test('reducer - ResetExecutionLogs', () => {
    const state = reducer(defaultReducerState, {
      type: ActionType.ResetExecutionLogs,
      payload: ''
    })

    expect(state).toEqual(defaultReducerState)
  })

  test('reducer - Search', () => {
    const state = reducer(executionLogState, {
      type: ActionType.Search,
      payload: 'INFO'
    })

    expect(state).toEqual(executionLogStateWithSearch)
  })

  test('reducer - ResetSearch', () => {
    const state = reducer(executionLogStateWithSearch, {
      type: ActionType.ResetSearch,
      payload: ''
    })

    expect(state).toEqual(executionLogState)
  })

  test('reducer - GoToNextSearchResult', () => {
    const state = reducer(executionLogStateWithSearch, {
      type: ActionType.GoToNextSearchResult,
      payload: ''
    })

    expect(state).toEqual({
      ...executionLogStateWithSearch,
      searchData: {
        ...executionLogStateWithSearch.searchData,
        currentIndex: 1
      }
    })

    const nextState = reducer(state, {
      type: ActionType.GoToNextSearchResult,
      payload: ''
    })

    expect(nextState).toEqual(executionLogStateWithSearch)
  })

  test('reducer - GoToPrevSearchResult', () => {
    const state = reducer(executionLogStateWithSearch, {
      type: ActionType.GoToPrevSearchResult,
      payload: ''
    })

    expect(state).toEqual({
      ...executionLogStateWithSearch,
      searchData: {
        ...executionLogStateWithSearch.searchData,
        currentIndex: 1
      }
    })

    const nextState = reducer(state, {
      type: ActionType.GoToNextSearchResult,
      payload: ''
    })

    expect(nextState).toEqual(executionLogStateWithSearch)
  })

  test('reducer - default', () => {
    const state = reducer(defaultReducerState, {
      type: '' as ActionType,
      payload: ''
    })

    expect(state).toEqual(defaultReducerState)
  })
})
