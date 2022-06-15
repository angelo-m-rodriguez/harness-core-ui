/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, Redirect, useParams } from 'react-router-dom'
import { ModalProvider } from '@harness/use-modal'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import { accountPathProps, withAccountId } from '@common/utils/routeUtils'

import SessionToken from 'framework/utils/SessionToken'
import type { SidebarContext } from './navigation/SidebarProvider'
import type { AccountPathProps } from './interfaces/RouteInterfaces'
import GenericErrorPage from './pages/GenericError/GenericErrorPage'
import WelcomePage from './pages/welcome/WelcomePage'
import HomeSideNav from './components/HomeSideNav/HomeSideNav'
import AccountSideNav from './components/AccountSideNav/AccountSideNav'
import AccountResources from './pages/AccountResources/AccountResources'
import SmtpDetails from './components/Smtp/SmtpDetails'

const RedirectToHome = (): React.ReactElement => {
  const { accountId } = useParams<AccountPathProps>()
  return <Redirect to={routes.toLandingDashboard({ accountId })} />
}

export const HomeSideNavProps: SidebarContext = {
  navComponent: HomeSideNav,
  icon: 'harness',
  title: 'Home'
}

export const AccountSideNavProps: SidebarContext = {
  navComponent: AccountSideNav,
  icon: 'nav-settings',
  title: 'Account Settings'
}

const justAccountPath = withAccountId(() => '/')

export default (
  <>
    {__DEV__ && (
      // Redirecting users whose default experience is CG from CG dashboard route to NG home page.
      // This will happen when auth pages are fetched from prod URL (default experience in DEV now)
      <Route path="/account/:accountId/dashboard">
        <Redirect to={routes.toHome({ accountId: SessionToken.accountId() })} />
      </Route>
    )}
    <Route exact path={[justAccountPath({ ...accountPathProps }), routes.toHome({ ...accountPathProps })]}>
      <RedirectToHome />
    </Route>

    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toAccountResources({ ...accountPathProps })} exact>
      <AccountResources />
    </RouteWithLayout>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toAccountSMTP({ ...accountPathProps })} exact>
      <SmtpDetails />
    </RouteWithLayout>
    <Route path={routes.toGenericError({ ...accountPathProps })}>
      <GenericErrorPage />
    </Route>
    <Route path={routes.toPurpose({ ...accountPathProps })} exact>
      <ModalProvider>
        <WelcomePage />
      </ModalProvider>
    </Route>
  </>
)
