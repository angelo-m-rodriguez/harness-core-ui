/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { PageSpinner } from '@harness/uicore'
import routes from '@common/RouteDefinitionsV2'
import { RouteWithContext } from '@common/router/RouteWithContext/RouteWithContext'
import {
  NAV_MODE,
  accountPathProps,
  connectorPathProps,
  delegateConfigProps,
  delegatePathProps,
  environmentGroupPathProps,
  environmentPathProps,
  getRouteParams,
  modulePathProps,
  orgPathProps,
  projectPathProps,
  resourceGroupPathProps,
  rolePathProps,
  secretPathProps,
  serviceAccountProps,
  servicePathProps,
  userGroupPathProps,
  userPathProps
} from '@common/utils/routeUtils'
import ConnectorsPage from '@platform/connectors/pages/connectors/ConnectorsPage'
import { AccountSettingsPage } from '@common/pages/SettingsPages/AccountSettingsPage'
import { OrgSettingsPage } from '@common/pages/SettingsPages/OrgSettingsPage'
import { ProjectSettingsPage } from '@common/pages/SettingsPages/ProjectSettingsPage'
import AccountOverview from '@platform/auth-settings/pages/AccountOverview/AccountOverview'
import SettingsList from '@platform/default-settings/pages/SettingsList'
import SmtpDetails from '@user-profile/components/Smtp/SmtpDetails'
import { Services } from '@cd/components/Services/Services'
import ServiceStudio from '@cd/components/Services/ServiceStudio/ServiceStudio'
import ConnectorDetailsPage from '@platform/connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import { EnvironmentsPage } from '@cd/RouteDestinations'
import EnvironmentDetails from '@cd/components/EnvironmentsV2/EnvironmentDetails/EnvironmentDetails'
import ServiceOverrides from '@cd/components/ServiceOverrides/ServiceOverrides'
import TemplatesPage from '@templates-library/pages/TemplatesPage/TemplatesPage'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { TemplateStudio } from '@templates-library/components/TemplateStudio/TemplateStudio'
import {
  GovernancePathProps,
  ModulePathParams,
  TemplateStudioPathProps,
  TemplateStudioQueryParams
} from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { LICENSE_STATE_NAMES, LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import { RedirectToModuleTrialHomeFactory } from '@common/Redirects'
import { Module, ModuleName } from 'framework/types/ModuleName'
import { RedirectToSubscriptions } from '@cf/components/routing/License'
import Configuration from '@platform/auth-settings/pages/Configuration/Configuration'
import Billing from '@platform/auth-settings/pages/Billing/BillingPage'
import SubscriptionsPage from '@platform/auth-settings/pages/subscriptions/SubscriptionsPage'
import ExternalTicketSettings from '@sto/components/ExternalTickets/Settings/ExternalTicketSettings'
import FreezeWindowsPage from '@freeze-windows/pages/FreezeWindowsPage'
import FreezeWindowStudioPage from '@freeze-windows/pages/FreezeWindowStudioPage'
import PolicyManagementMFE from '@governance/GovernanceApp'
import AuditTrailsPage from '@audit-trail/pages/AuditTrails/AuditTrailsPage'
import DelegatesPage from '@platform/delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@platform/delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@platform/delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@platform/delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@platform/delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import SecretsPage from '@platform/secrets/pages/secrets/SecretsPage'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import SecretDetails from '@platform/secrets/pages/secretDetails/SecretDetails'
import SecretReferences from '@platform/secrets/pages/secretReferences/SecretReferences'
import FileStorePage from '@platform/filestore/pages/filestore/FileStorePage'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import UsersPage from '@rbac/pages/Users/UsersPage'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import Roles from '@rbac/pages/Roles/Roles'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import VariablesPage from '@platform/variables/pages/variables/VariablesPage'
import { GitOpsPage } from '@gitops/RouteDestinations'
import { Webhooks } from '@cd/pages/webhooks/Webhooks'
import EnvironmentGroupsPage from '@cd/components/EnvironmentGroups/EnvironmentGroups'
import EnvironmentGroupDetails from '@cd/components/EnvironmentGroups/EnvironmentGroupDetails/EnvironmentGroupDetails'
import CreateSecretFromYamlPage from '@platform/secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'
import WebhookEvents from '@cd/pages/webhooks/WebhookEvents/WebhookEvents'
import CreateConnectorFromYamlPage from '@platform/connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import SLODowntimePage from '@cv/pages/slos/SLODowntimePage/SLODowntimePage'
import CVCreateDowntime from '@cv/pages/slos/components/CVCreateDowntime/CVCreateDowntime'
import { editParams } from '@cv/utils/routeUtils'
import GitSyncPage from '@gitsync/pages/GitSyncPage'
import GitSyncRepoTab from '@gitsync/pages/repos/GitSyncRepoTab'
import GitSyncEntityTab from '@gitsync/pages/entities/GitSyncEntityTab'
import GitSyncErrors from '@gitsync/pages/errors/GitSyncErrors'
import GitSyncConfigTab from '@gitsync/pages/config/GitSyncConfigTab'
import DiscoveryPage from '@discovery/pages/home/DiscoveryPage'
import DiscoveryDetails from '@discovery/pages/discovery-details/DiscoveryDetails'
import NetworkMapStudio from '@discovery/pages/network-map-studio/NetworkMapStudio'
import { CESettingsRouteDestination } from '@ce/CERouteDestinations'
import MonitoredServiceListWidget from '@cv/components/MonitoredServiceListWidget/MonitoredServiceListWidget'
import {
  CD_MONITORED_SERVICE_CONFIG,
  PROJECT_MONITORED_SERVICE_CONFIG
} from '@cv/components/MonitoredServiceListWidget/MonitoredServiceListWidget.constants'
import { MonitoredServiceProvider } from '@cv/pages/monitored-service/MonitoredServiceContext'
import CommonMonitoredServiceDetails from '@cv/components/MonitoredServiceListWidget/components/CommonMonitoredServiceDetails/CommonMonitoredServiceDetails'

const licenseRedirectDataCD: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CD_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHomeFactory(ModuleName.CD),
  expiredTrialRedirect: RedirectToSubscriptions
}

const RedirectToNewTemplateStudio = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, templateIdentifier, templateType, module } = useParams<
    TemplateStudioPathProps & ModulePathParams
  >()
  const queryParams = useQueryParams<TemplateStudioQueryParams>()
  return (
    <Redirect
      to={routes.toSettingsTemplateStudioNew({
        accountId,
        projectIdentifier,
        orgIdentifier,
        templateIdentifier,
        templateType,
        module,
        ...queryParams
      })}
    />
  )
}

const RedirectToDefaultGovernanceRoute = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<GovernancePathProps>()
  return (
    <Redirect
      to={routes.toGovernancePolicyDashboardSettings({
        accountId,
        projectIdentifier,
        orgIdentifier,
        module
      })}
    />
  )
}

function pathArrayForAllScopes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routeToMatch: (params?: any) => string,
  mode: NAV_MODE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalPathProps?: any
): string[] {
  const additionalProps = defaultTo(additionalPathProps, {})
  const propLists = [
    { ...projectPathProps, ...modulePathProps, mode, ...additionalProps },
    { ...projectPathProps, mode, ...additionalProps },
    { ...orgPathProps, ...modulePathProps, mode, ...additionalProps },
    { ...orgPathProps, mode, ...additionalProps },
    { ...accountPathProps, ...modulePathProps, mode, ...additionalProps },
    { ...accountPathProps, mode, ...additionalProps }
  ]
  return propLists.map(props => routeToMatch(props))
}

function SettingsRouteDestinations({ mode }: { mode: NAV_MODE }): React.ReactElement {
  const templatePathProps: Pick<TemplateStudioPathProps, 'templateIdentifier' | 'templateType'> = {
    templateIdentifier: ':templateIdentifier',
    templateType: ':templateType'
  }

  const { module } = getRouteParams<{ module: Module }>()
  const monitoredServiceConfig = module === 'cd' ? CD_MONITORED_SERVICE_CONFIG : PROJECT_MONITORED_SERVICE_CONFIG

  return (
    <>
      <RouteWithContext
        exact
        path={[
          routes.toSettings({ ...accountPathProps, ...modulePathProps, mode }),
          routes.toSettings({ ...accountPathProps, mode })
        ]}
      >
        <AccountSettingsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          routes.toSettings({ ...orgPathProps, ...modulePathProps, mode }),
          routes.toSettings({ ...orgPathProps, mode })
        ]}
      >
        <OrgSettingsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          routes.toSettings({ ...projectPathProps, ...modulePathProps, mode }),
          routes.toSettings({ ...projectPathProps, mode })
        ]}
      >
        <ProjectSettingsPage />
      </RouteWithContext>

      {/* Settings Resources */}
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toSettingsServices, mode)}>
        <Services calledFromSettingsPage={true} />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsServiceDetails, mode, { ...servicePathProps })}
      >
        <ServiceStudio />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toSettingsEnvironments, mode)}>
        <EnvironmentsPage calledFromSettingsPage={true} />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsEnvironmentDetails, mode, { ...environmentPathProps })}
      >
        <EnvironmentDetails />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsEnvironmentGroups, mode)}
        pageName={PAGE_NAME.EnvironmentGroups}
        licenseRedirectData={licenseRedirectDataCD}
      >
        <EnvironmentGroupsPage calledFromSettingsPage={true} />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsEnvironmentGroupDetails, mode, { ...environmentGroupPathProps })}
        licenseRedirectData={licenseRedirectDataCD}
        pageName={PAGE_NAME.EnvironmentGroupDetails}
      >
        <EnvironmentGroupDetails />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toConnectors, mode)}
        pageName={PAGE_NAME.ConnectorsPage}
      >
        <ConnectorsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toConnectorDetails, mode, { ...connectorPathProps })}
        pageName={PAGE_NAME.ConnectorDetailsPage}
      >
        <ConnectorDetailsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toCreateConnectorFromYamlSettings, mode)}
        pageName={PAGE_NAME.CreateConnectorFromYamlPage}
      >
        <CreateConnectorFromYamlPage />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toSettingsServiceOverrides, mode)}>
        <ServiceOverrides />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAccountSettingsOverview, mode)}>
        <AccountOverview />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toDefaultSettings, mode)}>
        <SettingsList />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          routes.toAccountSMTP({ ...accountPathProps, ...modulePathProps, mode }),
          routes.toAccountSMTP({ ...accountPathProps, mode })
        ]}
      >
        <SmtpDetails />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsTemplates, mode)}
        pageName={PAGE_NAME.TemplatesPage}
      >
        <TemplatesPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsTemplateStudio, mode, { ...templatePathProps })}
        pageName={PAGE_NAME.TemplatesPage}
      >
        <RedirectToNewTemplateStudio />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSettingsTemplateStudioNew, mode, { ...templatePathProps })}
        pageName={PAGE_NAME.TemplatesPage}
      >
        <TemplateStudio />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAuthenticationSettings, mode)}
        pageName={PAGE_NAME.AccountConfiguration}
      >
        <Configuration />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toBillingSettings, mode)}
        pageName={PAGE_NAME.BillingPage}
      >
        <Billing />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSubscriptions, mode)}
        pageName={PAGE_NAME.SubscriptionsPage}
      >
        <SubscriptionsPage />
      </RouteWithContext>

      <RouteWithContext exact path={pathArrayForAllScopes(routes.toTicketSettings, mode)}>
        <ExternalTicketSettings />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toFreezeWindowsSettings, mode)}>
        <FreezeWindowsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toFreezeWindowStudioSettings, mode, {
          ...{
            windowIdentifier: ':windowIdentifier'
          }
        })}
      >
        <FreezeWindowStudioPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toGovernanceSettings, mode)}
        pageName={PAGE_NAME.OPAPolicyDashboard}
      >
        <RedirectToDefaultGovernanceRoute />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          ...pathArrayForAllScopes(routes.toGovernancePolicyDashboardSettings, mode),
          ...pathArrayForAllScopes(routes.toGovernanceNewPolicySettings, mode),
          ...pathArrayForAllScopes(routes.toGovernancePolicyListingSettings, mode),
          ...pathArrayForAllScopes(routes.toGovernanceEditPolicySettings, mode, {
            policyIdentifier: ':policyIdentifier'
          }),
          ...pathArrayForAllScopes(routes.toGovernanceViewPolicySettings, mode, {
            policyIdentifier: ':policyIdentifier'
          }),
          ...pathArrayForAllScopes(routes.toGovernancePolicySetsListingSettings, mode),
          ...pathArrayForAllScopes(routes.toGovernancePolicySetDetail, mode, {
            policySetIdentifier: ':policySetIdentifier'
          }),
          ...pathArrayForAllScopes(routes.toGovernanceEvaluationsListing, mode),
          ...pathArrayForAllScopes(routes.toGovernanceEvaluationDetail, mode, {
            evaluationId: ':evaluationId'
          })
        ]}
        pageName={PAGE_NAME.OPAPolicyDashboard}
      >
        <PolicyManagementMFE />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAuditTrailSettings, mode)}>
        <AuditTrailsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          ...pathArrayForAllScopes(routes.toDelegatesSettings, mode),
          ...pathArrayForAllScopes(routes.toDelegateListSettings, mode)
        ]}
        pageName={PAGE_NAME.DelegateListing}
      >
        <DelegatesPage>
          <DelegateListing />
        </DelegatesPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDelegateConfigsSettings, mode)}
        pageName={PAGE_NAME.DelegateConfigurations}
      >
        <DelegatesPage>
          <DelegateConfigurations />
        </DelegatesPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDelegatesDetailsSettings, mode, { ...delegatePathProps })}
        pageName={PAGE_NAME.DelegateDetails}
      >
        <DelegateDetails />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDelegateConfigsDetailsSettings, mode, { ...delegateConfigProps })}
        pageName={PAGE_NAME.DelegateProfileDetails}
      >
        <DelegateProfileDetails />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDelegateTokensSettings, mode)}
        pageName={PAGE_NAME.DelegateTokens}
      >
        <DelegatesPage>
          <DelegateTokens />
        </DelegatesPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSecretsSettings, mode)}
        pageName={PAGE_NAME.SecretsPage}
      >
        <SecretsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toCreateSecretFromYamlSettings, mode)}
        pageName={PAGE_NAME.CreateSecretFromYamlPage}
      >
        <CreateSecretFromYamlPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          ...pathArrayForAllScopes(routes.toSecretDetailsSettings, mode, { ...secretPathProps }),
          ...pathArrayForAllScopes(routes.toSecretDetailsOverviewSettings, mode, { ...secretPathProps })
        ]}
        pageName={PAGE_NAME.SecretDetails}
      >
        <SecretDetailsHomePage>
          <SecretDetails />
        </SecretDetailsHomePage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toSecretDetailsReferencesSettings, mode, { ...secretPathProps })}
      >
        <SecretDetailsHomePage>
          <SecretReferences />
        </SecretDetailsHomePage>
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toFileStoreSettings, mode)}>
        <FileStorePage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          ...pathArrayForAllScopes(routes.toAccessControlUsersSettings, mode),
          ...pathArrayForAllScopes(routes.toAccessControlSettings, mode)
        ]}
      >
        <AccessControlPage>
          <UsersPage />
        </AccessControlPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAccessControlUsersDetailsSettings, mode, { ...userPathProps })}
      >
        <UserDetails />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAccessControlUserGroupsSettings, mode)}>
        <AccessControlPage>
          <UserGroups />
        </AccessControlPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAccessControlUserGroupsDetailsSettings, mode, { ...userGroupPathProps })}
      >
        <UserGroupDetails />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAccessControlServiceAccountsSettings, mode)}>
        <AccessControlPage>
          <ServiceAccountsPage />
        </AccessControlPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAccessControlServiceAccountsDetailsSettings, mode, {
          ...serviceAccountProps
        })}
      >
        <ServiceAccountDetails />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAccessControlResourceGroupsSettings, mode)}>
        <AccessControlPage>
          <ResourceGroups />
        </AccessControlPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAccessControlResourceGroupDetailsSettings, mode, {
          ...resourceGroupPathProps
        })}
      >
        <ResourceGroupDetails />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAccessControlRoleSettings, mode)}>
        <AccessControlPage>
          <Roles />
        </AccessControlPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toAccessControlRoleDetailsSettings, mode, { ...rolePathProps })}
      >
        <RoleDetails />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toVariablesSettings, mode)}>
        <VariablesPage />
      </RouteWithContext>

      <RouteWithContext exact path={pathArrayForAllScopes(routes.toCVSLODowntime, mode)}>
        <SLODowntimePage />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toCVCreateSLODowntime, mode)}>
        <CVCreateDowntime />
      </RouteWithContext>
      <RouteWithContext exact path={pathArrayForAllScopes(routes.toCVEditSLODowntime, mode, { ...editParams })}>
        <CVCreateDowntime />
      </RouteWithContext>

      <RouteWithContext
        path={[
          ...pathArrayForAllScopes(routes.toGitOpsResources, mode, { entity: 'agents' }),
          ...pathArrayForAllScopes(routes.toGitOpsResources, mode, { entity: 'repositories' }),
          ...pathArrayForAllScopes(routes.toGitOpsResources, mode, { entity: 'repoCertificates' }),
          ...pathArrayForAllScopes(routes.toGitOpsResources, mode, { entity: 'clusters' }),
          ...pathArrayForAllScopes(routes.toGitOpsResources, mode, { entity: 'gnuPGKeys' })
        ]}
        pageName={PAGE_NAME.GitOpsPage}
      >
        <GitOpsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toWebhooksSettings, mode)}
        pageName={PAGE_NAME.Webhooks}
      >
        <Webhooks />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toWebhooksEventsSettings, mode)}
        pageName={PAGE_NAME.WebhookEvents}
      >
        <WebhookEvents />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          ...pathArrayForAllScopes(routes.toGitSyncAdminSettings, mode),
          ...pathArrayForAllScopes(routes.toGitSyncReposAdminSettings, mode)
        ]}
        pageName={PAGE_NAME.GitSyncRepoTab}
      >
        <GitSyncPage>
          <GitSyncRepoTab />
        </GitSyncPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toGitSyncEntitiesAdminSettings, mode)}
        pageName={PAGE_NAME.GitSyncEntityTab}
      >
        <GitSyncPage>
          <GitSyncEntityTab />
        </GitSyncPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toGitSyncErrorsAdminSettings, mode)}
        pageName={PAGE_NAME.GitSyncErrors}
      >
        <GitSyncPage>
          <GitSyncErrors />
        </GitSyncPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toGitSyncConfigAdminSettings, mode)}
        pageName={PAGE_NAME.GitSyncConfigTab}
      >
        <GitSyncPage>
          <GitSyncConfigTab />
        </GitSyncPage>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDiscoverySettings, mode)}
        pageName={PAGE_NAME.DiscoveryPage}
      >
        <React.Suspense fallback={<PageSpinner />}>
          <DiscoveryPage />
        </React.Suspense>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toDiscoveryDetailsSettings, mode, { dAgentId: ':dAgentId' })}
        pageName={PAGE_NAME.DiscoveryDetails}
      >
        <React.Suspense fallback={<PageSpinner />}>
          <DiscoveryDetails />
        </React.Suspense>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={pathArrayForAllScopes(routes.toCreateNetworkMapSettings, mode, { dAgentId: ':dAgentId' })}
        pageName={PAGE_NAME.CreateNetworkMap}
      >
        <React.Suspense fallback={<PageSpinner />}>
          <NetworkMapStudio />
        </React.Suspense>
      </RouteWithContext>

      <RouteWithContext
        path={[
          ...pathArrayForAllScopes(routes.toMonitoredServicesSettings, mode),
          ...pathArrayForAllScopes(routes.toMonitoredServices, mode)
        ]}
        exact
      >
        <MonitoredServiceListWidget config={monitoredServiceConfig} />
      </RouteWithContext>

      <RouteWithContext exact path={pathArrayForAllScopes(routes.toAddMonitoredServices, mode)}>
        <MonitoredServiceProvider isTemplate={false}>
          <CommonMonitoredServiceDetails config={monitoredServiceConfig} />
        </MonitoredServiceProvider>
      </RouteWithContext>

      <RouteWithContext
        path={pathArrayForAllScopes(routes.toMonitoredServicesConfigurations, mode, { ...editParams })}
        exact
      >
        <CommonMonitoredServiceDetails config={monitoredServiceConfig} />
      </RouteWithContext>

      {/* CCM Setting pages */}
      {
        CESettingsRouteDestination({
          path: [
            ...pathArrayForAllScopes(routes.toCECloudIntegration, mode),
            ...pathArrayForAllScopes(routes.toCECurrencyPreferences, mode)
          ]
        }).props.children
      }
    </>
  )
}

export default SettingsRouteDestinations
