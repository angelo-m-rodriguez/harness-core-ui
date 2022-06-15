/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { createContext, useContext } from 'react'
import { useParams } from 'react-router-dom'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { Scope } from 'services/cd-ng'
import { useLocalStorage } from '@common/hooks'

export enum DashboardTimeRange {
  '30Days' = '30Days',
  '60Days' = '60Days',
  '90Days' = '90Days',
  '1Year' = '1Year'
}

export enum TimeRangeToDays {
  '30Days' = 30,
  '60Days' = 60,
  '90Days' = 90,
  '1Year' = 365
}

interface LandingDashboardContextProps {
  selectedTimeRange: DashboardTimeRange
  selectTimeRange: (timeRange: DashboardTimeRange) => void
  scope: Scope
}

const LandingDashboardContext = createContext<LandingDashboardContextProps>({
  selectedTimeRange: DashboardTimeRange['30Days'],
  selectTimeRange: () => void 0,
  scope: {}
})

export function LandingDashboardContextProvider(props: React.PropsWithChildren<unknown>): React.ReactElement {
  const [selectedTimeRange, setSelectedTimeRange] = useLocalStorage(
    'timeRangeHome',
    DashboardTimeRange['30Days'],
    window.sessionStorage
  )
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const selectTimeRange = (timeRange: DashboardTimeRange): void => {
    setSelectedTimeRange(timeRange)
  }

  return (
    <LandingDashboardContext.Provider
      value={{
        selectedTimeRange,
        selectTimeRange,
        scope: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
      }}
    >
      {props.children}
    </LandingDashboardContext.Provider>
  )
}

export function useLandingDashboardContext(): LandingDashboardContextProps {
  return useContext(LandingDashboardContext)
}

export default LandingDashboardContext
