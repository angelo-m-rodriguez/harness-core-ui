/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useCallback } from 'react'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { createAppDynamicsData, createAppDynamicsPayload } from './AppDHealthSource.utils'
import AppDMonitoredSource from './AppDHealthSource'

interface AppDynamicsHealthSource {
  data: any
  onSubmit: (formdata: any, UpdatedHealthSource: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}

export default function AppDHealthSourceContainer(props: AppDynamicsHealthSource): JSX.Element {
  const { data: sourceData, onSubmit, isTemplate, expressions } = props
  const { onPrevious } = useContext(SetupSourceTabsContext)

  const handleSubmit = useCallback(
    async (value: UpdatedHealthSource) => {
      const appDynamicsPayload = createAppDynamicsPayload(value)
      appDynamicsPayload && (await onSubmit(sourceData, appDynamicsPayload))
    },
    [sourceData]
  )

  return (
    <>
      <AppDMonitoredSource
        data={createAppDynamicsData(sourceData)}
        onSubmit={handleSubmit}
        onPrevious={() => onPrevious(sourceData)}
        isTemplate={isTemplate}
        expressions={expressions}
      />
    </>
  )
}
