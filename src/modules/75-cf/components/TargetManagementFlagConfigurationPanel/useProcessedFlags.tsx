/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo } from 'react'
import type { Feature } from 'services/cf'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'

export interface UseProcessedFlagsProps {
  flags: Feature[]
  searchTerm?: string
  removedFlags?: Feature[]
  pageNumber?: number
}

export interface UseProcessedFlagsPayload {
  filteredFlags: Feature[]
  searchedFlags: Feature[]
  pagedFlags: Feature[]
}

function useProcessedFlags({
  flags,
  searchTerm = '',
  removedFlags = [],
  pageNumber = 0
}: UseProcessedFlagsProps): UseProcessedFlagsPayload {
  // order flags alphabetically
  const orderedFlags = useMemo<Feature[]>(
    () => [...flags].sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB, 'en-US', { numeric: true })),
    [flags]
  )

  // filter out removed flags
  const filteredFlags = useMemo<Feature[]>(
    () => orderedFlags.filter(flag => !removedFlags.includes(flag)),
    [orderedFlags, removedFlags]
  )

  // search filtered flags
  const searchedFlags = useMemo<Feature[]>(() => {
    if (!searchTerm) {
      return filteredFlags
    }

    return filteredFlags.filter(({ name }) => name.toLocaleLowerCase().includes(searchTerm))
  }, [filteredFlags, searchTerm])

  // paginate results
  const pagedFlags = useMemo<Feature[]>(() => {
    const startIndex = pageNumber * CF_DEFAULT_PAGE_SIZE

    return searchedFlags.slice(startIndex, startIndex + CF_DEFAULT_PAGE_SIZE)
  }, [searchedFlags, pageNumber])

  return {
    filteredFlags,
    searchedFlags,
    pagedFlags
  }
}

export default useProcessedFlags
