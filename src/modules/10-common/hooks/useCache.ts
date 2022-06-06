import { useCallback, useState } from 'react'

const CACHE: Map<string, any> = new Map()

export interface SetCacheOptions {
  skipUpdate?: boolean
}

export interface UseCacheReturn {
  set(key: string, value: unknown, options?: SetCacheOptions): void
  get<T = unknown>(key: string): T | undefined
}

/**
 * These functions are only meant for testing, do not use them directly
 */
export const __danger_clear_cache = () => CACHE.clear()
export const __danger_set_cache = (key: string, value: unknown) => CACHE.set(key, value)
export const __danger_get_cache = (key: string) => CACHE.get(key)

export function useCache(): UseCacheReturn {
  const [_, forceUpdate] = useState(0)

  const set = useCallback((key: string, value: unknown, options: SetCacheOptions = {}) => {
    const oldValue = CACHE.get(key)
    CACHE.set(key, value)

    if (oldValue !== value && !options.skipUpdate) {
      forceUpdate(c => c + 1)
    }
  }, [])
  const get = useCallback(<T = unknown>(key: string) => CACHE.get(key) as T | undefined, [])

  return { set, get }
}
