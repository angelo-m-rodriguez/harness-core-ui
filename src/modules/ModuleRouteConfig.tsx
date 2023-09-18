/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, Switch } from 'react-router-dom'

import { ModuleName, moduleNameToModuleMapping } from 'framework/types/ModuleName'
import { NAV_MODE, accountPathProps } from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitionsV2'
import { NavModuleName } from '@common/hooks/useNavModuleInfo'
import CommonRouteDestinations from '@user-profile/CommonRouteDestinations'
import CDRouteDestinations from '@cd/CDRouteDestinations'
import CDSideNavLinks from '@cd/components/CDSideNav/CDSideNavLinks'
import CISideNavLinks from '@ci/components/CISideNav/CISideNavV2'
import CIRouteDestinations from '@ci/CIRouteDestinations'
import CFSideNav from '@cf/components/SideNav/CFSideNav'
import CFRouteDestinations from '@cf/CFRouteDestinations'
import CVSideNavLinks from '@cv/components/SideNav/CVSideNavLinks'
import CVRouteDestinations from '@cv/CVRouteDestinations'
import CCMSideNavLinks from '@ce/components/CESideNav/CESideNavV2'
import CERouteDestinations from '@ce/CERouteDestinations'
import ChaosSideNavLinks from '@chaos/components/ChaosSideNav/ChaosSideNavLinks'
import ChaosRouteDestinations from '@chaos/ChaosRouteDestinations'
import STOSideNavLinks from '@sto/components/STOSideNav/STOSideNavLinks'
import STORouteDestinations from '@sto/STORouteDestinations'
import GitOpsRouteDestinations from '@gitops/GitOpsRouteDestinations'
import SSCASideNavLinks from '@ssca/components/SSCASideNavLinks'
import SSCARouteDestinations from '@ssca/SSCARouteDestinations'
import IACMSideNavLinks from '@iacm/components/IACMSideNav/Nav2'
import IACMRouteDestinations from '@iacm/RouteDestinationsV2'
import CETRouteDestinations from '@cet/CETRouteDestinations'
import CETSideNavLinks from '@cet/components/SideNav/CETSideNavLinks'

interface IModuleRouteConfig {
  sideNavLinks: (mode: NAV_MODE) => React.ReactElement
  routes: (mode: NAV_MODE) => React.ReactElement
}

const ModuleRouteConfig: Record<NavModuleName, IModuleRouteConfig> = {
  [ModuleName.CD]: {
    sideNavLinks: CDSideNavLinks,
    routes: CDRouteDestinations
  },
  [ModuleName.CI]: {
    sideNavLinks: CISideNavLinks,
    routes: CIRouteDestinations
  },
  [ModuleName.CF]: {
    sideNavLinks: CFSideNav,
    routes: CFRouteDestinations
  },
  [ModuleName.CV]: {
    sideNavLinks: CVSideNavLinks,
    routes: CVRouteDestinations
  },
  [ModuleName.CHAOS]: {
    sideNavLinks: ChaosSideNavLinks,
    routes: ChaosRouteDestinations
  },
  [ModuleName.CODE]: {
    sideNavLinks: () => <></>,
    routes: () => <></>
  },
  [ModuleName.CET]: {
    sideNavLinks: CETSideNavLinks,
    routes: CETRouteDestinations
  },
  [ModuleName.CE]: {
    sideNavLinks: CCMSideNavLinks,
    routes: CERouteDestinations
  },
  [ModuleName.STO]: {
    sideNavLinks: STOSideNavLinks,
    routes: STORouteDestinations
  },
  [ModuleName.IACM]: {
    sideNavLinks: IACMSideNavLinks,
    routes: IACMRouteDestinations
  },
  [ModuleName.IDP]: {
    sideNavLinks: () => <></>,
    routes: () => <></>
  },
  [ModuleName.SSCA]: {
    sideNavLinks: SSCASideNavLinks,
    routes: SSCARouteDestinations
  },
  [ModuleName.SEI]: {
    sideNavLinks: () => <></>,
    routes: () => <></>
  }
}

export const ModulesRouteDestinations: React.FC<{ mode?: NAV_MODE }> = ({ mode = NAV_MODE.MODULE }) => {
  const modules = Object.keys(ModuleRouteConfig)

  return (
    <Switch>
      {modules.map(module => (
        <Route
          key={module}
          path={routes.toModule({
            mode,
            module: moduleNameToModuleMapping[module as NavModuleName],
            ...accountPathProps
          })}
        >
          {CommonRouteDestinations({ mode }).props.children}
          {ModuleRouteConfig[module as NavModuleName].routes(mode)}
          {GitOpsRouteDestinations({ mode }).props.children}
        </Route>
      ))}
    </Switch>
  )
}

export default ModuleRouteConfig
