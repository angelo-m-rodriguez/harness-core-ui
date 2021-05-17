import React from 'react'
import { Route, Redirect, useParams } from 'react-router-dom'

import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, withAccountId } from '@common/utils/routeUtils'

import AdminPage from '@common/pages/AccountSettings/AdminPage'
import Configuration from '@common/pages/AuthenticationSettings/Configuration/Configuration'
import GovernancePage from '@common/pages/governance/GovernancePage'
import type { SidebarContext } from './navigation/SidebarProvider'
import type { AccountPathProps } from './interfaces/RouteInterfaces'
import GenericErrorPage from './pages/GenericError/GenericErrorPage'
import { PurposePage } from './pages/purpose/PurposePage'
import HomeSideNav from './components/HomeSideNav/HomeSideNav'

const RedirectToProjects = (): React.ReactElement => {
  const { accountId } = useParams<AccountPathProps>()
  return <Redirect to={routes.toProjects({ accountId })} />
}

const RedirectToResourcesHome = (): React.ReactElement => {
  const params = useParams<AccountPathProps>()
  return <Redirect to={routes.toResourcesConnectors(params)} />
}

const RedirectToConfiguration = (): React.ReactElement => {
  const params = useParams<AccountPathProps>()
  return <Redirect to={routes.toAccountConfiguration(params)} />
}

const HomeSideNavProps: SidebarContext = {
  navComponent: HomeSideNav,
  icon: 'harness'
}

const justAccountPath = withAccountId(() => '/')

export default (
  <>
    <Route exact path={justAccountPath({ ...accountPathProps })}>
      <RedirectToProjects />
    </Route>
    <Route exact path={routes.toResources({ ...accountPathProps })}>
      <RedirectToResourcesHome />
    </Route>
    <RouteWithLayout sidebarProps={HomeSideNavProps} path={routes.toSetup({ ...accountPathProps })} exact>
      <AdminPage />
    </RouteWithLayout>
    <Route sidebarProps={HomeSideNavProps} path={routes.toAuthenticationSettings({ ...accountPathProps })} exact>
      <RedirectToConfiguration />
    </Route>
    <RouteWithLayout
      sidebarProps={HomeSideNavProps}
      path={routes.toAccountConfiguration({ ...accountPathProps })}
      exact
    >
      <Configuration />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={HomeSideNavProps}
      path={[
        routes.toGovernance({ ...accountPathProps }),
        routes.toOrgGovernance({ ...accountPathProps, ...orgPathProps })
      ]}
      exact
    >
      <GovernancePage />
    </RouteWithLayout>
    <Route path={routes.toGenericError({ ...accountPathProps })}>
      <GenericErrorPage />
    </Route>
    <Route path={routes.toPurpose({ ...accountPathProps })} exact>
      <PurposePage />
    </Route>
  </>
)
