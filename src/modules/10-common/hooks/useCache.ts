/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { useGlobalEventListener } from './useGlobalEventListener'

const CACHE: Map<string, any> = new Map()

export interface SetCacheOptions {
  skipUpdate?: boolean
}

export interface UseCacheReturn {
  setCache(key: string, value: unknown, options?: SetCacheOptions): void
  getCache<T = unknown>(key: string): T | undefined
}

/**
 * These functions are only meant for testing, do not use them directly
 */
export const __danger_clear_cache = () => CACHE.clear()
export const __danger_set_cache = (key: string, value: unknown) => CACHE.set(key, value)
export const __danger_get_cache = (key: string) => CACHE.get(key)

export function useCache(deps?: React.DependencyList): UseCacheReturn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState(0)

  const setCache = useCallback(
    (key: string, value: unknown, options: SetCacheOptions = {}) => {
      const oldValue = CACHE.get(key)
      CACHE.set(key, value)
      const shouldFireEventBasedOnDeps = Array.isArray(deps) ? deps.includes(key) : true

      if (oldValue !== value && !options.skipUpdate && shouldFireEventBasedOnDeps) {
        window.dispatchEvent(new CustomEvent('USE_CACHE_UPDATED'))
      }
    },
    [deps]
  )
  const getCache = useCallback(<T = unknown>(key: string) => CACHE.get(key) as T | undefined, [])

  useGlobalEventListener('USE_CACHE_UPDATED', () => {
    forceUpdate(c => c + 1)
  })

  return { setCache, getCache }
}
