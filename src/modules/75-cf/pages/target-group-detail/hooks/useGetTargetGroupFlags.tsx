/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Feature, GetAllFeaturesQueryParams, Segment, useGetAllFeatures, useGetSegmentFlags } from 'services/cf'

export interface UseGetTargetGroupFlagsArgs {
  targetGroup: Segment
  accountIdentifier: string
  orgIdentifier: string
  projectIdentifier: string
}

export interface UseGetTargetGroupFlagsPayload {
  data: Feature[] | null
  loading: boolean
  error: any
  refetch: () => void
}

export default function useGetTargetGroupFlags({
  targetGroup,
  projectIdentifier,
  orgIdentifier,
  accountIdentifier
}: UseGetTargetGroupFlagsArgs): UseGetTargetGroupFlagsPayload {
  const [refetching, setRefetching] = useState<boolean>(true)

  const {
    data: targetGroupFlags,
    loading: loadingTargetGroupFlags,
    error: targetGroupFlagsError,
    refetch: refetchTargetGroupFlags
  } = useGetSegmentFlags({
    identifier: targetGroup.identifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: targetGroup.environment as string
    }
  })

  const flagsQueryParams = useMemo<GetAllFeaturesQueryParams>(
    () => ({
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: targetGroup.environment as string
    }),
    [accountIdentifier, orgIdentifier, projectIdentifier, targetGroup.environment]
  )

  const {
    data: flags,
    loading: loadingFlags,
    error: flagsError,
    refetch: refetchFlags
  } = useGetAllFeatures({
    lazy: true,
    queryParams: flagsQueryParams
  })

  const targetGroupFlagIds = useMemo<string[]>(
    () => (targetGroupFlags || []).map(({ identifier }) => identifier),
    [targetGroupFlags]
  )

  useEffect(() => {
    if (targetGroupFlagIds.length) {
      refetchFlags({
        queryParams: {
          ...flagsQueryParams,
          pageSize: targetGroupFlagIds.length,
          featureIdentifiers: targetGroupFlagIds.join(',')
        }
      })
        .catch(() => undefined) // error handled with error returned from hook
        .finally(() => {
          setRefetching(false)
        })
    } else if (targetGroupFlags !== null && !loadingTargetGroupFlags && !targetGroupFlagIds.length) {
      setRefetching(false)
    }
  }, [flagsQueryParams, loadingTargetGroupFlags, refetchFlags, targetGroupFlagIds, targetGroupFlags])

  const refetch = useCallback(async () => {
    setRefetching(true)
    return refetchTargetGroupFlags()
  }, [refetchTargetGroupFlags])

  const loading = refetching || loadingTargetGroupFlags || loadingFlags

  const data = useMemo<Feature[] | null>(() => {
    if (loading || !targetGroupFlags) {
      return null
    }

    if (!targetGroupFlagIds.length) {
      return []
    }

    return flags?.features as Feature[]
  }, [flags?.features, loading, targetGroupFlagIds.length, targetGroupFlags])

  return {
    data,
    loading,
    error: targetGroupFlagsError || flagsError,
    refetch
  }
}
