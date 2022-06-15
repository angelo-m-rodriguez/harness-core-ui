/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, Route, useParams } from 'react-router-dom'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import GitSyncConfigTab from '@gitsync/pages/config/GitSyncConfigTab'
import GitSyncEntityTab from '@gitsync/pages/entities/GitSyncEntityTab'
import GitSyncErrors from '@gitsync/pages/errors/GitSyncErrors'
import GitSyncPage from '@gitsync/pages/GitSyncPage'
import GitSyncRepoTab from '@gitsync/pages/repos/GitSyncRepoTab'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'

export function RedirectToGitSyncHome(): React.ReactElement {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()

  return <Redirect to={routes.toGitSyncReposAdmin({ projectIdentifier, accountId, orgIdentifier, module })} />
}

export const GitSyncRouteDestinations: React.FC<{
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}> = ({ moduleParams, licenseRedirectData, sidebarProps }) => (
  <>
    <Route
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toGitSyncAdmin({ ...accountPathProps, ...moduleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncRepoTab}
    >
      <RedirectToGitSyncHome />
    </Route>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toGitSyncReposAdmin({ ...accountPathProps, ...moduleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncRepoTab}
    >
      <GitSyncPage>
        <GitSyncRepoTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toGitSyncEntitiesAdmin({ ...accountPathProps, ...moduleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncEntityTab}
    >
      <GitSyncPage>
        <GitSyncEntityTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toGitSyncErrors({ ...accountPathProps, ...moduleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncErrors}
    >
      <GitSyncPage>
        <GitSyncErrors />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toGitSyncConfig({ ...accountPathProps, ...moduleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncConfigTab}
    >
      <GitSyncPage>
        <GitSyncConfigTab />
      </GitSyncPage>
    </RouteWithLayout>
  </>
)
