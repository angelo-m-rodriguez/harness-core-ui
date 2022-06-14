/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import { accountPathProps, connectorPathProps, projectPathProps } from '@common/utils/routeUtils'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType, ResourceCategory } from '@rbac/interfaces/ResourceType'
import RbacFactory from '@rbac/factories/RbacFactory'
import { String } from 'framework/strings'
import { AccountSideNavProps } from '@common/RouteDestinations'
import type { ResourceDTO } from 'services/audit'
import ConnectorResourceModalBody from './components/ConnectorResourceModalBody/ConnectorResourceModalBody'

RbacFactory.registerResourceTypeHandler(ResourceType.CONNECTOR, {
  icon: 'res-connectors',
  label: 'connectorsLabel',
  category: ResourceCategory.SHARED_RESOURCES,
  permissionLabels: {
    [PermissionIdentifier.VIEW_CONNECTOR]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.UPDATE_CONNECTOR]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_CONNECTOR]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.ACCESS_CONNECTOR]: <String stringID="rbac.permissionLabels.access" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <ConnectorResourceModalBody {...props} />
})

const platformLabel = 'auditTrail.Platform'
AuditTrailFactory.registerResourceHandler('CONNECTOR', {
  moduleIcon: {
    name: 'nav-settings'
  },
  moduleLabel: platformLabel,
  resourceLabel: 'connector',
  resourceUrl: (resource: ResourceDTO, resourceScope: ResourceScope) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope

    return routes.toConnectorDetails({
      orgIdentifier,
      accountId: accountIdentifier,
      connectorId: resource.identifier,
      projectIdentifier
    })
  }
})

export default (
  <>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toConnectors({ ...accountPathProps })} exact>
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toConnectorDetails({ ...accountPathProps, ...connectorPathProps })}
      exact
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps })}
      exact
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
  </>
)

export const ConnectorRouteDestinations: React.FC<{
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}> = ({ moduleParams, licenseRedirectData, sidebarProps }) => (
  <>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
      pageName={PAGE_NAME.ConnectorsPage}
    >
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
      pageName={PAGE_NAME.CreateConnectorFromYamlPage}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toConnectorDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...connectorPathProps,
        ...moduleParams
      })}
      pageName={PAGE_NAME.ConnectorDetailsPage}
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
  </>
)
