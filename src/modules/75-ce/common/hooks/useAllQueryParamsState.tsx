/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty, isEqual, mapValues, isObject } from 'lodash-es'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'

export interface QueryParamsStateOptions {
  value?: any
  parseAsNumeric?: boolean
  parseAsObject?: boolean
}

export type QueryParamsState = Record<string, QueryParamsStateOptions>

export function useAllQueryParamsState(
  defaultValue: QueryParamsState
): [QueryParamsState, (newState: QueryParamsState) => void] {
  const { updateQueryParams } = useUpdateQueryParams()

  const { state } = useQueryParams<{ state: QueryParamsState }>({
    processQueryParams(params) {
      const returnState = { ...defaultValue }
      if (!isEmpty(params)) {
        Object.keys(params).forEach(key => {
          const { parseAsNumeric, parseAsObject } = defaultValue[key]
          if (parseAsNumeric) {
            returnState[key] = { value: Number(params[key]) }
          } else if (parseAsObject) {
            returnState[key] = { value: JSON.parse(params[key]) }
          } else {
            returnState[key] = { value: params[key] }
          }
        })
      }
      return { state: returnState }
    }
  })

  const setState = (newState: QueryParamsState) => {
    if (!isEqual(state, newState)) {
      const serializedParams = mapValues(newState, opts =>
        isObject(opts.value) ? JSON.stringify(opts.value) : opts.value
      )
      updateQueryParams(serializedParams)
    }
  }

  return [state, setState]
}
