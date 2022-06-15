/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { TimeAgo } from '@common/exports'
import { useStrings } from 'framework/strings'

export enum FeatureFlagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  NEVER_REQUESTED = 'never-requested',
  POTENTIALLY_STALE = 'potentially-stale',
  RECENTLY_ACCESSED = 'recently-accessed'
}
export interface FlagStatusProps {
  status?: FeatureFlagStatus
  lastAccess?: number
}

export const FlagStatus: React.FC<FlagStatusProps> = ({ status, lastAccess }) => {
  const { getString } = useStrings()
  const isNeverRequested = status === FeatureFlagStatus.NEVER_REQUESTED
  const isPotentiallyStale = status === FeatureFlagStatus.POTENTIALLY_STALE
  const textStyle = {
    fontWeight: 600,
    fontSize: '10px',
    lineHeight: '16px',
    textAlign: 'center',
    borderRadius: '5px',
    padding: '2px 6px',
    ...{ color: '#8EB0F4', background: '#EDF8FF' },
    ...(status === FeatureFlagStatus.INACTIVE ? { background: '#F3F3FA', color: '#9293AB' } : undefined),
    ...(isNeverRequested
      ? {
          color: 'rgba(146, 170, 202, 0.8)',
          background: 'transparent',
          border: '1px solid rgba(189, 210, 219, 0.6)',
          padding: '0 4px'
        }
      : undefined)
  } as React.CSSProperties
  const subTextStyle = { color: '#8F90A6', fontSize: '12px' }
  const ComponentLayout = isNeverRequested ? Layout.Vertical : Layout.Horizontal

  if (!status || !lastAccess) {
    return null
  }

  return (
    <ComponentLayout spacing="xsmall" style={{ alignItems: isNeverRequested ? 'baseline' : 'center' }}>
      <Text inline style={textStyle}>
        {(status || '').toLocaleUpperCase()}
      </Text>
      {!isNeverRequested && !isPotentiallyStale && <TimeAgo time={lastAccess} icon={undefined} style={subTextStyle} />}
      {isNeverRequested && <Text style={subTextStyle}>{getString('cf.featureFlags.makeSure')}</Text>}
    </ComponentLayout>
  )
}
