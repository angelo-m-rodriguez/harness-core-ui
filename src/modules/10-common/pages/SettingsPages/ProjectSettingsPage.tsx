/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Page } from '@common/exports'
import { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { String, useStrings } from 'framework/strings'
import { useGetSettingValue } from 'services/cd-ng'
import routesV2 from '@common/RouteDefinitionsV2'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { SettingType } from '@common/constants/Utils'
import { useAnyEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { isEnterprisePlan, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import {
  SettingsPage,
  SettingsResourceCard,
  SettingsResources,
  SettingsResourcesCategory,
  isActiveLicense
} from './SettingsPage'

export const ProjectSettingsPage: React.FC = () => {
  const {
    accountId,
    projectIdentifier,
    orgIdentifier,
    module: moduleFromProps
  } = useParams<ProjectPathProps & ModulePathParams>()
  const { getString } = useStrings()
  const {
    CDS_SERVICE_OVERRIDES_2_0,
    STO_JIRA_INTEGRATION,
    PL_DISCOVERY_ENABLE,
    USE_OLD_GIT_SYNC,
    SRM_DOWNTIME,
    CVNG_TEMPLATE_MONITORED_SERVICE,
    SRM_COMMON_MONITORED_SERVICE
  } = useFeatureFlags()
  const { currentModule, isGitSimplificationEnabled, isGitSyncEnabled, gitSyncEnabledOnlyForFF } = useAppStore()
  const module = moduleFromProps || currentModule
  const showGovCard = useAnyEnterpriseLicense()
  const {
    licenseInformation,
    CD_LICENSE_STATE,
    CI_LICENSE_STATE,
    CV_LICENSE_STATE,
    CHAOS_LICENSE_STATE,
    STO_LICENSE_STATE
  } = useLicenseStore()
  const isEnterpriseEdition = isEnterprisePlan(licenseInformation, ModuleName.CD)
  const showDeploymentFreeze = isEnterpriseEdition

  //active licenses
  const haveCD = isActiveLicense(CD_LICENSE_STATE)
  const haveCI = isActiveLicense(CI_LICENSE_STATE)
  const haveCV = isActiveLicense(CV_LICENSE_STATE)
  const haveSTO = isActiveLicense(STO_LICENSE_STATE)

  const haveCIorCDorSTO = haveCI || haveCD || haveSTO

  // Supporting GIT_SIMPLIFICATION by default, old GitSync will be selected only for selected accounts
  // isGitSimplificationEnabled will true if any customers using old GitSync enabled Git SImplification using API
  const isGitSyncSupported =
    (isGitSyncEnabled && !gitSyncEnabledOnlyForFF) ||
    (USE_OLD_GIT_SYNC && (haveCIorCDorSTO || !module) && !isGitSimplificationEnabled)

  const showTemplates = haveCIorCDorSTO || haveCV || !module

  //Service overrides
  const { data: enableServiceOverrideSettings } = useGetSettingValue({
    identifier: SettingType.ENABLE_SERVICE_OVERRIDE_V2,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: false
  })
  const isServiceOverridesEnabled = CDS_SERVICE_OVERRIDES_2_0 && enableServiceOverrideSettings?.data?.value === 'true'

  return (
    <>
      <Page.Header
        title={getString('common.settingsPage.title.projectSettingsTitle')}
        breadcrumbs={<NGBreadcrumbs />}
      />
      <Page.Body>
        <SettingsPage.container>
          <SettingsPage.group
            id={SettingsResourcesCategory.General}
            title={getString('common.settingCategory.general')}
            description={getString('common.settingsPage.description.general')}
          >
            <SettingsResourceCard
              label={<String stringID="common.defaultSettings" />}
              id={SettingsResources.DefaultSettings}
              icon={'nav-settings'}
              route={routesV2.toDefaultSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
          </SettingsPage.group>
          <SettingsPage.group
            id={SettingsResourcesCategory.ProjectResource}
            title={getString('common.settingsPage.title.projectLevelResources')}
            // todo - add project-level description
          >
            <SettingsResourceCard
              label={<String stringID="services" />}
              id={SettingsResources.Services}
              icon={'services'}
              route={routesV2.toSettingsServices({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!haveCD}
            />
            <SettingsResourceCard
              label={<String stringID="environments" />}
              id={SettingsResources.Environments}
              icon={'infrastructure'}
              route={routesV2.toSettingsEnvironments({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!haveCD}
            />
            <SettingsResourceCard
              label={<String stringID="connectorsLabel" />}
              id={SettingsResources.Connectors}
              icon={'connectors-blue'}
              route={routesV2.toConnectors({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="delegate.delegates" />}
              id={SettingsResources.Delegates}
              icon={'delegates-blue'}
              route={routesV2.toDelegatesSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="common.secrets" />}
              id={SettingsResources.Secrets}
              icon={'secrets-blue'}
              route={routesV2.toSecretsSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="resourcePage.fileStore" />}
              id={SettingsResources.FileStores}
              icon={'filestore'}
              route={routesV2.toFileStoreSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="common.templates" />}
              id={SettingsResources.Templates}
              icon={'templates-blue'}
              hidden={!showTemplates}
              route={routesV2.toSettingsTemplates({
                accountId,
                orgIdentifier,
                projectIdentifier,
                module,
                templateType:
                  CVNG_TEMPLATE_MONITORED_SERVICE && haveCV && module === 'cv' ? 'MonitoredService' : undefined
              })}
            />
            <SettingsResourceCard
              label={<String stringID="common.variables" />}
              id={SettingsResources.Variables}
              icon={'variables-blue'}
              route={routesV2.toVariablesSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="common.sloDowntimeLabel" />}
              id={SettingsResources.SLODowntime}
              icon={'connectors-blue'}
              route={routesV2.toCVSLODowntime({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!(SRM_DOWNTIME && haveCV)}
            />
            <SettingsResourceCard //todo-test
              label={<String stringID="gitManagement" />}
              id={SettingsResources.GitManagement}
              icon={'setting'}
              route={routesV2.toGitSyncAdminSettings({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!isGitSyncSupported}
            />
            <SettingsResourceCard //todo-test
              label={<String stringID="common.discovery" />}
              id={SettingsResources.Discovery}
              icon={'setting'}
              route={routesV2.toDiscoverySettings({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!(PL_DISCOVERY_ENABLE && isActiveLicense(CHAOS_LICENSE_STATE))}
            />
            <SettingsResourceCard
              label={<String stringID="common.monitoredServices" />}
              id={SettingsResources.MonitoredServices}
              icon={'monitored-service'}
              route={routesV2.toMonitoredServicesSettings({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!SRM_COMMON_MONITORED_SERVICE}
            />
            <SettingsResourceCard
              label={<String stringID="common.overrides" />}
              id={SettingsResources.ServiceOverride}
              icon={'layers-outline'}
              route={routesV2.toSettingsServiceOverrides({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!(isServiceOverridesEnabled && haveCD)}
            />
            <SettingsResourceCard
              label={<String stringID="common.agents" />}
              id={SettingsResources.CETAgents}
              icon={'connectors-blue'}
              route={routesV2.toCETAgents({ accountId, orgIdentifier, projectIdentifier, module: 'cet' })}
            />
            <SettingsResourceCard
              label={<String stringID="common.purpose.errorTracking.agentTokens" />}
              id={SettingsResources.CETTokens}
              icon={'connectors-blue'}
              route={routesV2.toCETAgentsTokens({ accountId, orgIdentifier, projectIdentifier, module: 'cet' })}
            />
            <SettingsResourceCard
              label={<String stringID="common.purpose.errorTracking.criticalEvents" />}
              id={SettingsResources.CETCriticalEvents}
              icon={'connectors-blue'}
              route={routesV2.toCETCriticalEvents({ accountId, orgIdentifier, projectIdentifier, module: 'cet' })}
            />
          </SettingsPage.group>
          <SettingsPage.group
            id={SettingsResourcesCategory.AccessControl}
            title={getString('accessControl')}
            description={getString('common.settingsPage.description.accessControl')}
          >
            <SettingsResourceCard
              label={<String stringID="users" />}
              id={SettingsResources.AccessControlUsers}
              icon={'user'}
              route={routesV2.toAccessControlUsersSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
            <SettingsResourceCard
              label={<String stringID="common.userGroups" />}
              id={SettingsResources.AccessControlUserGroups}
              icon={'user-groups'}
              route={routesV2.toAccessControlUserGroupsSettings({
                accountId,
                orgIdentifier,
                projectIdentifier,
                module
              })}
            />
            <SettingsResourceCard
              label={<String stringID="common.serviceAccounts" />}
              id={SettingsResources.AccessControlServiceAccounts}
              icon={'setting'}
              route={routesV2.toAccessControlServiceAccountsSettings({
                accountId,
                orgIdentifier,
                projectIdentifier,
                module
              })}
            />
            <SettingsResourceCard
              label={<String stringID="resourceGroups" />}
              id={SettingsResources.AccessControlResourceGroups}
              icon={'resources'}
              route={routesV2.toAccessControlResourceGroupsSettings({
                accountId,
                orgIdentifier,
                projectIdentifier,
                module
              })}
            />
            <SettingsResourceCard
              label={<String stringID="roles" />}
              id={SettingsResources.AccessControlRoles}
              icon={'roles'}
              route={routesV2.toAccessControlRoleSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
          </SettingsPage.group>
          <SettingsPage.group
            id={SettingsResourcesCategory.SecurityGovernance}
            title={getString('common.settingsPage.title.securityGovernance')}
            description={getString('common.settingsPage.description.securityGovernance')}
          >
            <SettingsResourceCard
              label={<String stringID="common.governance" />}
              id={SettingsResources.Governance}
              icon={'governance'}
              route={routesV2.toGovernanceSettings({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!showGovCard}
            />
            <SettingsResourceCard
              label={<String stringID="common.freezeWindows" />}
              id={SettingsResources.FreezeWindow}
              icon={'setting'}
              route={routesV2.toFreezeWindowsSettings({ accountId, orgIdentifier, projectIdentifier, module })}
              hidden={!showDeploymentFreeze}
            />
            <SettingsResourceCard
              label={<String stringID="common.auditTrail" />}
              id={SettingsResources.AuditTrails}
              icon={'list-blue'}
              route={routesV2.toAuditTrailSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
          </SettingsPage.group>
          <SettingsPage.group
            id={SettingsResourcesCategory.ExternalTickets}
            title={getString('common.tickets.externalTickets')}
            hidden={!(STO_JIRA_INTEGRATION && haveSTO)}
          >
            <SettingsResourceCard
              label={<String stringID="common.tickets.externalTickets" />}
              id={SettingsResources.ExternalTickets}
              icon={'service-jira'}
              route={routesV2.toTicketSettings({ accountId, orgIdentifier, projectIdentifier, module })}
            />
          </SettingsPage.group>
        </SettingsPage.container>
      </Page.Body>
    </>
  )
}
