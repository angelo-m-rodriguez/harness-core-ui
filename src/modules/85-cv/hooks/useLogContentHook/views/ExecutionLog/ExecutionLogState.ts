/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import produce from 'immer'
import { range } from 'lodash-es'
import type { Dispatch } from 'react'
import type { ExecutionLogDTO } from 'services/cv'
import { formatDatetoLocale } from '@common/utils/dateUtils'
import { escapeStringRegexp, sanitizeHTML } from '@common/utils/StringUtils'
import { getTags } from '@cv/utils/CommonUtils'
import { Action, ActionType, State, LogLineData, TextKeys, UseActionCreatorReturn } from './ExecutionLog.types'
import { defaultReducerState } from './ExecutionLog.constants'

const setExecutionLogs = (state: State, action: Action<ActionType.SetExecutionLogs>): State => {
  const payload: LogLineData[] = action.payload.map(executionLog => ({
    text: {
      logLevel: executionLog.logLevel,
      tags: getTags(executionLog.tags),
      createdAt: executionLog.createdAt ? formatDatetoLocale(executionLog.createdAt) : '',
      log: executionLog.log
    }
  }))

  return {
    ...state,
    data: [...state.data, ...payload]
  }
}

const search = (state: State, action: Action<ActionType.Search>): State => {
  const { payload } = action
  const dataKeys: TextKeys[] = ['logLevel', 'tags', 'createdAt', 'log']
  const searchRegex = new RegExp(escapeStringRegexp(sanitizeHTML(payload)), 'gi')

  return produce(state, draft => {
    let prevLinesCount = 0
    const linesWithResults: number[] = []

    draft.data = state.data.map(log => {
      const searchIndices: Partial<Record<TextKeys, number[]>> = {}
      dataKeys.forEach(key => {
        const value = log.text[key]
        /* istanbul ignore else */ if (value) {
          const matches = value.match(searchRegex)

          if (matches && matches.length) {
            const prevResultsCount = linesWithResults.length

            searchIndices[key] = range(prevResultsCount, prevResultsCount + matches.length)
            linesWithResults.push(...Array.from<number>({ length: matches.length }).fill(prevLinesCount))
          }
        }
      })

      prevLinesCount++

      return {
        ...log,
        searchIndices
      }
    })

    draft.searchData = {
      currentIndex: 0,
      text: payload,
      linesWithResults
    }
  })
}

function resetSearch(state: State, _action: Action<ActionType.ResetSearch>): State {
  return produce(state, draft => {
    draft.searchData = { currentIndex: 0, text: '', linesWithResults: [] }
    draft.data = state.data.map(({ searchIndices, ...rest }) => rest)
  })
}

function goToNextSearchResult(state: State, _action: Action<ActionType.GoToNextSearchResult>): State {
  return produce(state, draft => {
    const index = state.searchData.currentIndex
    const total = draft.searchData.linesWithResults.length
    draft.searchData.currentIndex = total > 0 ? (index + 1) % total : 0
  })
}

function goToPrevSearchResult(state: State, _action: Action<ActionType.GoToPrevSearchResult>): State {
  return produce(state, draft => {
    const index = state.searchData.currentIndex
    const total = draft.searchData.linesWithResults.length
    draft.searchData.currentIndex = total > 0 ? (total + index - 1) % total : 0
  })
}

export function reducer<T extends ActionType>(state: State, action: Action<T>): State {
  switch (action.type) {
    case ActionType.SetExecutionLogs:
      return setExecutionLogs(state, action as Action<ActionType.SetExecutionLogs>)
    case ActionType.Search:
      return search(state, action as Action<ActionType.Search>)
    case ActionType.ResetSearch:
      return resetSearch(state, action as Action<ActionType.ResetSearch>)
    case ActionType.GoToNextSearchResult:
      return goToNextSearchResult(state, action as Action<ActionType.GoToNextSearchResult>)
    case ActionType.GoToPrevSearchResult:
      return goToPrevSearchResult(state, action as Action<ActionType.GoToPrevSearchResult>)
    case ActionType.ResetExecutionLogs:
      return defaultReducerState
    default:
      return state
  }
}

export const useActionCreator = (dispatch: Dispatch<Action<ActionType>>): UseActionCreatorReturn => {
  return {
    setExecutionLogs(payload: ExecutionLogDTO[]) {
      dispatch({ type: ActionType.SetExecutionLogs, payload })
    },
    resetExecutionLogs() {
      dispatch({ type: ActionType.ResetExecutionLogs, payload: '' })
    },
    search(payload: string) {
      dispatch({ type: ActionType.Search, payload })
    },
    resetSearch() {
      dispatch({ type: ActionType.ResetSearch, payload: '' })
    },
    goToNextSearchResult() {
      dispatch({ type: ActionType.GoToNextSearchResult, payload: '' })
    },
    goToPrevSearchResult() {
      dispatch({ type: ActionType.GoToPrevSearchResult, payload: '' })
    }
  }
}
