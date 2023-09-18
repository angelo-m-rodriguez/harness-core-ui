/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import routes from '@common/RouteDefinitionsV2'
import oldRoutes from '@common/RouteDefinitions'
import { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { ModuleName } from 'framework/types/ModuleName'
import { Scope } from 'framework/types/types'
import { LICENSE_STATE_NAMES, LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import { RouteWithContext } from '@common/router/RouteWithContext/RouteWithContext'
import { NAV_MODE, accountPathProps, modulePathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { useGetSelectedScope } from '@common/navigation/SideNavV2/SideNavV2.utils'

import CETHomePage from './pages/CETHomePage'
import { CETEventsSummary } from './pages/events-summary/CETEventsSummary'
import { CETMonitoredServices } from './pages/CETMonitoredServices'
import CETTrialPage from './pages/trialPage/CETTrialPage'
import CETSettings from './pages/CET-agent-control/CETSettings'
import { CETAgents } from './pages/CET-agent-control/CET-agents/CETAgents'

const CETRedirect: React.FC<{ mode: NAV_MODE }> = props => {
  const { scope, params } = useGetSelectedScope()
  const { accountId } = useParams<AccountPathProps>()

  if (scope === Scope.PROJECT) {
    return (
      <Redirect
        to={routes.toCETEventsSummary({
          accountId: accountId,
          orgIdentifier: params?.orgIdentifier,
          projectIdentifier: params?.projectIdentifier,
          module: ModuleName.CET.toLowerCase() as Module,
          mode: props.mode
        })}
      />
    )
  }

  return (
    <Redirect
      to={routes.toCETSettings({
        accountId: accountId,
        orgIdentifier: params?.orgIdentifier,
        module: ModuleName.CET.toLowerCase() as Module,
        mode: props.mode
      })}
    />
  )
}

export const RedirectToModuleTrialHome = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={oldRoutes.toModuleTrialHome({
        accountId,
        module: 'cf'
      })}
    />
  )
}

export const RedirectToSubscriptionsFactory = (): React.ReactElement => {
  const { accountId } = useParams<AccountPathProps>() // eslint-disable-line react-hooks/rules-of-hooks

  return <Redirect to={oldRoutes.toSubscriptions({ accountId, moduleCard: ModuleName.CET.toLowerCase() as Module })} />
}

export const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CET_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHome,
  expiredTrialRedirect: RedirectToSubscriptionsFactory
}

const CETRouteDestinations = (mode = NAV_MODE.MODULE): React.ReactElement => {
  return (
    <>
      <RouteWithContext
        exact
        path={[
          routes.toMode({ ...projectPathProps, module: 'cet', mode }),
          routes.toMode({ ...orgPathProps, module: 'cet', mode }),
          routes.toMode({ ...accountPathProps, module: 'cet', mode })
        ]}
      >
        <CETRedirect mode={mode} />
      </RouteWithContext>

      <RouteWithContext
        exact
        path={routes.toCETHome({ ...projectPathProps, ...modulePathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETHomePage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCETTrial({ ...accountPathProps, ...modulePathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETTrialPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCETAgents({ ...projectPathProps, ...modulePathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETSettings>
          <CETAgents pathComponentLocation="/agents" />
        </CETSettings>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCETAgentsTokens({ ...projectPathProps, ...modulePathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETSettings>
          <CETAgents pathComponentLocation="/tokens" />
        </CETSettings>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCETCriticalEvents({ ...projectPathProps, ...modulePathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETSettings>
          <CETAgents pathComponentLocation="/criticalevents" />
        </CETSettings>
      </RouteWithContext>
      <RouteWithContext
        path={routes.toCETEventsSummary({ ...modulePathProps, ...projectPathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETEventsSummary />
      </RouteWithContext>
      <RouteWithContext
        path={routes.toCETMonitoredServices({ ...modulePathProps, ...projectPathProps, mode })}
        licenseRedirectData={licenseRedirectData}
      >
        <CETMonitoredServices />
      </RouteWithContext>
    </>
  )
}

export default CETRouteDestinations
