/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import routes from '@common/RouteDefinitionsV2'
import { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { Scope } from 'framework/types/types'
import { NAV_MODE } from '@common/utils/routeUtils'
import { SideNav } from '@common/navigation/SideNavV2/SideNavV2'
import { useGetSelectedScope } from '@common/navigation/SideNavV2/SideNavV2.utils'

const module: Module = 'cet'
const CETSideNavLinks = (mode: NAV_MODE): React.ReactElement => {
  const { getString } = useStrings()

  const { accountId } = useParams<AccountPathProps>()
  const { params } = useGetSelectedScope()
  const { projectIdentifier, orgIdentifier } = params || {}

  return (
    <SideNav.Main>
      <SideNav.Section>
        <SideNav.Scope scope={Scope.PROJECT}>
          <SideNav.Link
            icon="nav-home"
            label={getString('overview')}
            to={routes.toCETHome({ accountId, projectIdentifier, orgIdentifier, module })}
          />
          <SideNav.Link
            icon="services"
            label={getString('auditTrail.eventSummary')}
            to={routes.toCETEventsSummary({ accountId, projectIdentifier, orgIdentifier, module })}
          />
          <SideNav.Link
            icon="services"
            label={getString('common.monitoredServices')}
            to={routes.toCETMonitoredServices({ accountId, projectIdentifier, orgIdentifier, module })}
          />
        </SideNav.Scope>
      </SideNav.Section>
      <SideNav.SettingsLink mode={mode} module={module} />
    </SideNav.Main>
  )
}

export default CETSideNavLinks
