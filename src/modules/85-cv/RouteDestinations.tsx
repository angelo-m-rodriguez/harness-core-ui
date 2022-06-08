/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, useParams, Redirect } from 'react-router-dom'

import { parse } from 'yaml'
import CVHomePage from '@cv/pages/home/CVHomePage'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import {
  accountPathProps,
  projectPathProps,
  connectorPathProps,
  secretPathProps,
  delegatePathProps,
  delegateConfigProps,
  resourceGroupPathProps,
  rolePathProps,
  userGroupPathProps,
  userPathProps,
  orgPathProps,
  modulePathProps,
  serviceAccountProps,
  templatePathProps
} from '@common/utils/routeUtils'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { MinimalLayout } from '@common/layouts'

import './components/PipelineSteps'
import './components/MonitoredServiceTemplate'
import './components/ExecutionVerification'
import CVMonitoredService from '@cv/pages/monitored-service/CVMonitoredService/CVMonitoredService'
import MonitoredServicePage from '@cv/pages/monitored-service/MonitoredServicePage'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import SideNav from '@cv/components/SideNav/SideNav'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import { ModuleName } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import Roles from '@rbac/pages/Roles/Roles'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import UsersPage from '@rbac/pages/Users/UsersPage'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import { PubSubPipelineActions } from '@pipeline/factories/PubSubPipelineAction'
import { PipelineActions } from '@pipeline/factories/PubSubPipelineAction/types'
// import TemplatesPage from '@templates-library/pages/TemplatesPage/TemplatesPage'
import { TemplateStudioWrapper } from '@templates-library/components/TemplateStudio/TemplateStudioWrapper'
import { inputSetTemplatePromise } from 'services/cv'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { CVChanges } from '@cv/pages/changes/CVChanges'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import CVTrialHomePage from './pages/home/CVTrialHomePage'
import { editParams, isVerifyStepPresent } from './utils/routeUtils'
import CVSLOsListingPage from './pages/slos/CVSLOsListingPage'
import CVSLODetailsPage from './pages/slos/CVSLODetailsPage/CVSLODetailsPage'
import CVCreateSLO from './pages/slos/components/CVCreateSLO/CVCreateSLO'
import ChildAppMounter from '../../microfrontends/ChildAppMounter'

PubSubPipelineActions.subscribe(
  PipelineActions.RunPipeline,
  async ({ template, accountPathProps: accountPathParams, pipeline }) => {
    let response = { ...template }
    const payload = { pipelineYaml: yamlStringify({ pipeline }), templateYaml: yamlStringify(template) }

    // Making the BE call to get the updated template, only if the stage contains verify step then
    if (isVerifyStepPresent(pipeline)) {
      const updatedResponse = await inputSetTemplatePromise({
        queryParams: { accountId: accountPathParams?.accountId },
        body: payload
      })
      if (updatedResponse?.data?.inputSetTemplateYaml) {
        response = { ...parse(updatedResponse.data.inputSetTemplateYaml)?.pipeline }
      }
    }
    return Promise.resolve(response)
  }
)

const cvModule = ':module(cv)'
const templateModuleParams: ModulePathParams = {
  module: cvModule
}

const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier, module: 'cv' })} />
}

const RedirectToDelegatesHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toDelegateList({ accountId, projectIdentifier, orgIdentifier, module: 'cv' })} />
}

const RedirectToCVProject = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject?.modules?.includes(ModuleName.CV)) {
    return (
      <Redirect
        to={routes.toCVMonitoringServices({
          accountId: params.accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier
        })}
      />
    )
  } else {
    return <Redirect to={routes.toCVHome(params)} />
  }
}

export const cvModuleParams: ModulePathParams = {
  module: cvModule
}

const CVSideNavProps: SidebarContext = {
  navComponent: SideNav,
  subtitle: 'Service',
  title: 'Reliability',
  icon: 'cv-main'
}

// eslint-disable-next-line import/no-unresolved
const ErrorTracking = React.lazy(() => import('errortracking/App'))

export default (
  <>
    <Route
      path={[routes.toCV({ ...accountPathProps }), routes.toCVProject({ ...accountPathProps, ...projectPathProps })]}
      exact
    >
      <RedirectToCVProject />
    </Route>
    <RouteWithLayout exact sidebarProps={CVSideNavProps} path={routes.toCVHome({ ...accountPathProps })}>
      <CVHomePage />
    </RouteWithLayout>

    <RouteWithLayout
      layout={MinimalLayout}
      path={routes.toModuleTrialHome({ ...accountPathProps, module: 'cv' })}
      exact
    >
      <CVTrialHomePage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVMonitoringServices({ ...accountPathProps, ...projectPathProps, module: cvModule })}
    >
      <CVMonitoredService />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVChanges({ ...accountPathProps, ...projectPathProps, module: cvModule })}
    >
      <CVChanges />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVSLOs({ ...accountPathProps, ...projectPathProps, module: cvModule })}
    >
      <CVSLOsListingPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toErrorTracking({ ...accountPathProps, ...projectPathProps, module: cvModule })}
    >
      <ChildAppMounter ChildApp={ErrorTracking} />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toErrorTrackingArc({ ...accountPathProps, ...projectPathProps, module: cvModule })}
    >
      <ChildAppMounter ChildApp={ErrorTracking} />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVCreateSLOs({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <CVCreateSLO />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCVSLODetailsPage({
        ...accountPathProps,
        ...projectPathProps,
        ...editParams,
        ...cvModuleParams
      })}
    >
      <CVSLODetailsPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={[
        routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
        routes.toCVAddMonitoringServicesEdit({
          ...accountPathProps,
          ...projectPathProps,
          ...editParams,
          ...cvModuleParams
        })
      ]}
    >
      <MonitoredServicePage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <ConnectorsPage />
    </RouteWithLayout>
    {/* uncomment once BE integration is complete  */}
    {/* <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toTemplates({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <TemplatesPage />
    </RouteWithLayout> */}

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      exact
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...templateModuleParams })}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toSecrets({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <SecretsPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toVariables({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <VariablesPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toDelegates({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <RedirectToDelegatesHome />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toDelegateList({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <DelegatesPage>
        <DelegateListing />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toDelegateConfigs({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}
    >
      <DelegatesPage>
        <DelegateConfigurations />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toDelegatesDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...delegatePathProps,
        ...cvModuleParams
      })}
    >
      <DelegateDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={[
        routes.toDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...cvModuleParams
        }),
        routes.toEditDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...cvModuleParams
        })
      ]}
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={[
        routes.toDelegateTokens({
          ...accountPathProps,
          ...projectPathProps,
          ...cvModuleParams
        })
      ]}
    >
      <DelegatesPage>
        <DelegateTokens />
      </DelegatesPage>
    </RouteWithLayout>

    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toConnectorDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...connectorPathProps,
        ...cvModuleParams
      })}
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...modulePathProps })}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...orgPathProps })}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toSecretDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...cvModuleParams
      })}
    >
      <RedirectToSecretDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toSecretDetailsOverview({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...cvModuleParams
      })}
    >
      <SecretDetailsHomePage>
        <SecretDetails />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      sidebarProps={CVSideNavProps}
      path={routes.toSecretDetailsReferences({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...cvModuleParams
      })}
    >
      <SecretDetailsHomePage>
        <SecretReferences />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toAccessControl({ ...projectPathProps, ...cvModuleParams })]}
      exact
    >
      <RedirectToAccessControlHome />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toUsers({ ...projectPathProps, ...cvModuleParams })]}
      exact
    >
      <AccessControlPage>
        <UsersPage />
      </AccessControlPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toUserDetails({ ...projectPathProps, ...cvModuleParams, ...userPathProps })}
      exact
    >
      <UserDetails />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toUserGroups({ ...projectPathProps, ...cvModuleParams })]}
      exact
    >
      <AccessControlPage>
        <UserGroups />
      </AccessControlPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toUserGroupDetails({ ...projectPathProps, ...cvModuleParams, ...userGroupPathProps })}
      exact
    >
      <UserGroupDetails />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toServiceAccounts({ ...projectPathProps, ...cvModuleParams })}
      exact
    >
      <AccessControlPage>
        <ServiceAccountsPage />
      </AccessControlPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={routes.toServiceAccountDetails({ ...projectPathProps, ...cvModuleParams, ...serviceAccountProps })}
      exact
    >
      <ServiceAccountDetails />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toResourceGroups({ ...projectPathProps, ...cvModuleParams })]}
      exact
    >
      <AccessControlPage>
        <ResourceGroups />
      </AccessControlPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toRoles({ ...projectPathProps, ...cvModuleParams })]}
      exact
    >
      <AccessControlPage>
        <Roles />
      </AccessControlPage>
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toRoleDetails({ ...projectPathProps, ...cvModuleParams, ...rolePathProps })]}
      exact
    >
      <RoleDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CVSideNavProps}
      path={[routes.toResourceGroupDetails({ ...projectPathProps, ...cvModuleParams, ...resourceGroupPathProps })]}
      exact
    >
      <ResourceGroupDetails />
    </RouteWithLayout>
  </>
)
