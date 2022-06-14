/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

interface MonitoredServiceContextInterface {
  isTemplate: boolean
}
export const MonitoredServiceContext = React.createContext<MonitoredServiceContextInterface>({
  isTemplate: false
})

export const MonitoredServiceProvider = ({
  isTemplate,
  children
}: React.PropsWithChildren<MonitoredServiceContextInterface>) => {
  return <MonitoredServiceContext.Provider value={{ isTemplate }}>{children}</MonitoredServiceContext.Provider>
}

export function useMonitoredServiceContext(): MonitoredServiceContextInterface {
  return React.useContext(MonitoredServiceContext)
}
