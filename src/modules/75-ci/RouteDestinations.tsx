/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route, useParams, Redirect } from 'react-router-dom'
import { RouteWithLayout } from '@common/router'
import {
  accountPathProps,
  projectPathProps,
  pipelinePathProps,
  connectorPathProps,
  secretPathProps,
  inputSetFormPathProps,
  triggerPathProps,
  executionPathProps,
  orgPathProps,
  rolePathProps,
  resourceGroupPathProps,
  delegatePathProps,
  delegateConfigProps,
  userGroupPathProps,
  userPathProps,
  serviceAccountProps,
  templatePathProps
} from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitions'
import type {
  ExecutionPathProps,
  PipelinePathProps,
  PipelineType,
  ProjectPathProps,
  ModulePathParams,
  Module
} from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import DeploymentsList from '@pipeline/pages/deployments-list/DeploymentsList'
import { EmptyLayout, MinimalLayout } from '@common/layouts'
import { BannerType } from '@common/layouts/Constants'
import {
  isFeatureLimitBreachedIncludesExceeding,
  isFeatureOveruseActive,
  isFeatureCountActive,
  isFeatureWarningActive,
  isFeatureWarningActiveIncludesLimit,
  isFeatureLimitMet,
  getActiveUsageNumber,
  getPercentageNumber
} from '@common/layouts/FeatureBanner'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import featureFactory from 'framework/featureStore/FeaturesFactory'
import PipelinesPage from '@pipeline/pages/pipelines/PipelinesPage'
import type { SidebarContext } from '@common/navigation/SidebarProvider'

import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import CIPipelineDeploymentList from '@ci/pages/pipeline-deployment-list/CIPipelineDeploymentList'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { ModuleName } from 'framework/types/ModuleName'

import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'

import PipelineDetails from '@pipeline/pages/pipeline-details/PipelineDetails'
import InputSetList from '@pipeline/pages/inputSet-list/InputSetList'
import TriggersPage from '@triggers/pages/triggers/TriggersPage'
import { EnhancedInputSetForm } from '@pipeline/components/InputSetForm/InputSetForm'
import TriggerDetails from '@triggers/pages/trigger-details/TriggerDetails'
import ExecutionArtifactsView from '@pipeline/pages/execution/ExecutionArtifactsView/ExecutionArtifactsView'
import ExecutionInputsView from '@pipeline/pages/execution/ExecutionInputsView/ExecutionInputsView'
import ExecutionLandingPage from '@pipeline/pages/execution/ExecutionLandingPage/ExecutionLandingPage'
import ExecutionPipelineView from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionPipelineView'
import TriggersWizardPage from '@triggers/pages/triggers/TriggersWizardPage'
import TriggersDetailPage from '@triggers/pages/triggers/TriggersDetailPage'
import CreateSecretFromYamlPage from '@secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'

import './components/PipelineSteps'
import './components/PipelineStudio/BuildStage'
import GitSyncPage from '@gitsync/pages/GitSyncPage'
import GitSyncRepoTab from '@gitsync/pages/repos/GitSyncRepoTab'
import GitSyncEntityTab from '@gitsync/pages/entities/GitSyncEntityTab'
import GitSyncErrors from '@gitsync/pages/errors/GitSyncErrors'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import UsersPage from '@rbac/pages/Users/UsersPage'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import Roles from '@rbac/pages/Roles/Roles'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import BuildTests from '@pipeline/pages/execution/ExecutionTestView/BuildTests'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import { LicenseRedirectProps, LICENSE_STATE_NAMES } from 'framework/LicenseStore/LicenseStoreContext'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import executionFactory from '@pipeline/factories/ExecutionFactory'
import { StageType } from '@pipeline/utils/stageHelpers'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import TemplatesPage from '@templates-library/pages/TemplatesPage/TemplatesPage'
import { TemplateStudioWrapper } from '@templates-library/components/TemplateStudio/TemplateStudioWrapper'
import ExecutionPolicyEvaluationsView from '@pipeline/pages/execution/ExecutionPolicyEvaluationsView/ExecutionPolicyEvaluationsView'
import GitSyncConfigTab from '@gitsync/pages/config/GitSyncConfigTab'
import ExecutionSecurityView from '@pipeline/pages/execution/ExecutionSecurityView/ExecutionSecurityView'
import FullPageLogView from '@pipeline/pages/full-page-log-view/FullPageLogView'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import CIPipelineStudioWrapper from '@ci/pages/pipeline-studio/CIPipelineStudioWrapper'
import CIHomePage from './pages/home/CIHomePage'
import CIDashboardPage from './pages/dashboard/CIDashboardPage'
import CISideNav from './components/CISideNav/CISideNav'
import BuildCommits from './pages/build/sections/commits/BuildCommits'
import CITrialHomePage from './pages/home/CITrialHomePage'
import GetStartedWithCI from './pages/get-started-with-ci/GetStartedWithCI'
import { CIExecutionCardSummary } from './components/CIExecutionCardSummary/CIExecutionCardSummary'
import { CIExecutionSummary } from './components/CIExecutionSummary/CIExecutionSummary'
import { CIStageDetails } from './components/CIStageDetails/CIStageDetails'

executionFactory.registerCardInfo(StageType.BUILD, {
  icon: 'ci-main',
  component: CIExecutionCardSummary
})

executionFactory.registerSummary(StageType.BUILD, {
  component: CIExecutionSummary
})

executionFactory.registerStageDetails(StageType.BUILD, {
  component: CIStageDetails
})

featureFactory.registerFeaturesByModule('ci', {
  features: [
    FeatureIdentifier.MAX_TOTAL_BUILDS,
    FeatureIdentifier.MAX_BUILDS_PER_MONTH,
    FeatureIdentifier.ACTIVE_COMMITTERS
  ],
  renderMessage: (props, getString, additionalLicenseProps = {}) => {
    const {
      isFreeEdition: isCIFree,
      isTeamEdition: isCITeam,
      isEnterpriseEdition: isCIEnterprise
    } = additionalLicenseProps
    const isTeamOrEnterprise = isCIEnterprise || isCITeam
    const featuresMap = props.features
    const maxTotalBuildsFeatureDetail = featuresMap.get(FeatureIdentifier.MAX_TOTAL_BUILDS) // tested both
    const maxBuildsPerMonthFeatureDetail = featuresMap.get(FeatureIdentifier.MAX_BUILDS_PER_MONTH)
    const activeCommittersFeatureDetail = featuresMap.get(FeatureIdentifier.ACTIVE_COMMITTERS)

    // Check for limit breach
    const isMaxBuildsPerMonthBreached = isFeatureLimitBreachedIncludesExceeding(maxBuildsPerMonthFeatureDetail)
    let limitBreachMessageString = ''
    if (isMaxBuildsPerMonthBreached) {
      limitBreachMessageString = getString('pipeline.featureRestriction.maxBuildsPerMonth100PercentLimit')
    }

    if (limitBreachMessageString) {
      return {
        message: () => limitBreachMessageString,
        bannerType: BannerType.LEVEL_UP
      }
    }

    // Checking for limit overuse warning
    let overuseMessageString = ''
    const isActiveCommittersOveruseActive = isFeatureOveruseActive(activeCommittersFeatureDetail)

    if (isActiveCommittersOveruseActive && isTeamOrEnterprise) {
      overuseMessageString = getString('pipeline.featureRestriction.subscriptionExceededLimit')
    }
    if (overuseMessageString) {
      return {
        message: () => overuseMessageString,
        bannerType: BannerType.OVERUSE
      }
    }

    // Checking for limit usage warning
    let warningMessageString = ''
    const isMaxBuildsPerMonthCountActive = isFeatureCountActive(maxBuildsPerMonthFeatureDetail)
    const isMaxTotalBuildsWarningActive = isFeatureWarningActive(maxTotalBuildsFeatureDetail)
    const isMaxTotalBuildsLimitMet = isFeatureLimitMet(maxTotalBuildsFeatureDetail)
    const isActiveCommittersWarningActive = isFeatureWarningActiveIncludesLimit(activeCommittersFeatureDetail)

    if (
      isCIFree &&
      isMaxTotalBuildsLimitMet &&
      isMaxBuildsPerMonthCountActive &&
      typeof maxBuildsPerMonthFeatureDetail?.featureDetail?.count !== 'undefined'
    ) {
      warningMessageString = getString('pipeline.featureRestriction.numMonthlyBuilds', {
        count: maxBuildsPerMonthFeatureDetail.featureDetail.count,
        limit: maxBuildsPerMonthFeatureDetail.featureDetail.limit
      })
    } else if (
      isCIFree &&
      isMaxTotalBuildsWarningActive &&
      maxTotalBuildsFeatureDetail?.featureDetail?.count &&
      maxTotalBuildsFeatureDetail.featureDetail.limit
    ) {
      const usagePercent = getActiveUsageNumber(maxTotalBuildsFeatureDetail)

      warningMessageString = getString('pipeline.featureRestriction.maxTotalBuilds90PercentLimit', {
        usagePercent
      })
    } else if (
      isActiveCommittersWarningActive &&
      activeCommittersFeatureDetail?.featureDetail?.count &&
      activeCommittersFeatureDetail.featureDetail.limit &&
      isTeamOrEnterprise
    ) {
      const usagePercent = getPercentageNumber(maxTotalBuildsFeatureDetail)

      warningMessageString = getString('pipeline.featureRestriction.subscription90PercentLimit', { usagePercent })
    }

    if (warningMessageString) {
      return {
        message: () => warningMessageString,
        bannerType: BannerType.INFO
      }
    }

    // If neither of limit breach/ warning/ overuse needs to be shown, return with an empty string.
    // This will ensure no banner is shown
    return {
      message: () => '',
      bannerType: BannerType.LEVEL_UP
    }
  }
})

const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier, module })} />
}

const RedirectToDelegatesHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()

  return <Redirect to={routes.toDelegateList({ accountId, projectIdentifier, orgIdentifier, module })} />
}

const RedirectToCIProject = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject?.modules?.includes(ModuleName.CI)) {
    return (
      <Redirect
        to={routes.toProjectOverview({
          accountId,
          module: 'ci',
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier
        })}
      />
    )
  } else {
    return <Redirect to={routes.toCIHome({ accountId })} />
  }
}
const RedirectToExecutionPipeline = (): React.ReactElement => {
  const params = useParams<PipelineType<ExecutionPathProps>>()

  return <Redirect to={routes.toExecutionPipelineView(params)} />
}

const CIDashboardPageOrRedirect = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  const { CI_OVERVIEW_PAGE } = useFeatureFlags()

  if (CI_OVERVIEW_PAGE) {
    return <CIDashboardPage />
  } else if (selectedProject?.modules?.includes(ModuleName.CI)) {
    return <Redirect to={routes.toDeployments({ ...params, module: 'ci' })} />
  } else {
    return <Redirect to={routes.toCIHome(params)} />
  }
}

const RedirectToPipelineDetailHome = (): React.ReactElement => {
  const params = useParams<PipelineType<PipelinePathProps>>()

  return <Redirect to={routes.toPipelineStudio(params)} />
}

const RedirectToGitSyncHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()

  return <Redirect to={routes.toGitSyncReposAdmin({ projectIdentifier, accountId, orgIdentifier, module })} />
}

const RedirectToModuleTrialHome = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toModuleTrialHome({
        accountId,
        module: 'ci'
      })}
    />
  )
}

const RedirectToSubscriptions = (): React.ReactElement => {
  const { accountId } = useParams<{
    accountId: string
  }>()

  return (
    <Redirect
      to={routes.toSubscriptions({
        accountId,
        moduleCard: ModuleName.CI.toLowerCase() as Module
      })}
    />
  )
}

const CISideNavProps: SidebarContext = {
  navComponent: CISideNav,
  subtitle: 'CONTINUOUS',
  title: 'Integration',
  icon: 'ci-main'
}

const pipelineModuleParams: ModulePathParams = {
  module: ':module(ci)'
}

const templateModuleParams: ModulePathParams = {
  module: ':module(ci)'
}

const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CI_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHome,
  expiredTrialRedirect: RedirectToSubscriptions
}

export default (
  <>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      path={[
        routes.toCI({ ...accountPathProps, ...projectPathProps }),
        routes.toCIProject({ ...accountPathProps, ...projectPathProps })
      ]}
      exact
    >
      <RedirectToCIProject />
    </RouteWithLayout>
    <RouteWithLayout
      layout={MinimalLayout}
      path={routes.toModuleTrialHome({ ...accountPathProps, module: 'ci' })}
      pageName={PAGE_NAME.CITrialHomePage}
      exact
    >
      <CITrialHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toCIHome({ ...accountPathProps })]}
      pageName={PAGE_NAME.CIHomePage}
      exact
    >
      <CIHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toProjectOverview({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      exact
    >
      <CIDashboardPageOrRedirect />
    </RouteWithLayout>
    {/* <RouteWithLayout path={routes.toCIBuilds({ ...accountPathProps, ...projectPathProps })} exact>
        <CIBuildList />
      </RouteWithLayout>

      <Route path={routes.toCIBuild({ ...accountPathProps, ...projectPathProps, ...buildPathProps })} exact>
        <RedirectToBuildPipelineGraph />
      </Route>

      <BuildSubroute
        path={routes.toCIBuildPipelineGraph({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<PipelineGraph />}
      />
      <BuildSubroute
        path={routes.toCIBuildPipelineLog({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<PipelineLog />}
      />
      <BuildSubroute
        path={routes.toCIBuildArtifacts({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildArtifacts />}
      />
      <BuildSubroute
        path={routes.toCIBuildTests({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildTests />}
      />
      <BuildSubroute
        path={routes.toCIBuildInputs({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildInputs />}
      />
      <BuildSubroute
        path={routes.toCIBuildCommits({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildCommits />}
      /> */}
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ConnectorsPage}
    >
      <ConnectorsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.CreateConnectorFromYamlPage}
    >
      <CreateConnectorFromYamlPage />
    </RouteWithLayout>
    <Route
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toGitSyncAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
    >
      <RedirectToGitSyncHome />
    </Route>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toGitSyncReposAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncRepoTab}
    >
      <GitSyncPage>
        <GitSyncRepoTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toGitSyncEntitiesAdmin({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncEntityTab}
    >
      <GitSyncPage>
        <GitSyncEntityTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toGitSyncErrors({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncErrors}
    >
      <GitSyncPage>
        <GitSyncErrors />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toGitSyncConfig({ ...accountPathProps, ...pipelineModuleParams, ...projectPathProps })}
      pageName={PAGE_NAME.GitSyncConfigTab}
    >
      <GitSyncPage>
        <GitSyncConfigTab />
      </GitSyncPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toSecrets({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.SecretsPage}
    >
      <SecretsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toVariables({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.VariablesPage}
    >
      <VariablesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toCreateSecretFromYaml({
        ...accountPathProps,
        ...projectPathProps,
        ...orgPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.CreateSecretFromYamlPage}
    >
      <CreateSecretFromYamlPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toConnectorDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...connectorPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ConnectorDetailsPage}
    >
      <ConnectorDetailsPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toSecretDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
    >
      <RedirectToSecretDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toSecretDetailsOverview({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.SecretDetails}
    >
      <SecretDetailsHomePage>
        <SecretDetails />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toSecretDetailsReferences({
        ...accountPathProps,
        ...projectPathProps,
        ...secretPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.SecretReferences}
    >
      <SecretDetailsHomePage>
        <SecretReferences />
      </SecretDetailsHomePage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toDelegates({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
    >
      <RedirectToDelegatesHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toDelegateList({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateListing}
    >
      <DelegatesPage>
        <DelegateListing />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toDelegateConfigs({
        ...accountPathProps,
        ...projectPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateConfigurations}
    >
      <DelegatesPage>
        <DelegateConfigurations />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toDelegatesDetails({
        ...accountPathProps,
        ...projectPathProps,
        ...delegatePathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.DelegateDetails}
    >
      <DelegateDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[
        routes.toDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...pipelineModuleParams
        }),
        routes.toEditDelegateConfigsDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegateConfigProps,
          ...pipelineModuleParams
        })
      ]}
      pageName={PAGE_NAME.DelegateProfileDetails}
    >
      <DelegateProfileDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[
        routes.toDelegateTokens({
          ...accountPathProps,
          ...projectPathProps,
          ...pipelineModuleParams
        })
      ]}
      pageName={PAGE_NAME.DelegateTokens}
    >
      <DelegatesPage>
        <DelegateTokens />
      </DelegatesPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.CIPipelineStudio}
    >
      <PipelineDetails>
        <CIPipelineStudioWrapper />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      layout={EmptyLayout}
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toPipelineLogs({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams,
        stageIdentifier: ':stageIdentifier',
        stepIndentifier: ':stepIndentifier'
      })}
      pageName={PAGE_NAME.FullPageLogView}
    >
      <FullPageLogView />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toPipelines({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.PipelinesPage}
    >
      <PipelinesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toInputSetList({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.InputSetList}
    >
      <PipelineDetails>
        <InputSetList />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toDeployments({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.DeploymentsList}
    >
      <DeploymentsList />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      pageName={PAGE_NAME.GetStartedWithCI}
      path={routes.toGetStartedWithCI({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
    >
      <GetStartedWithCI />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toInputSetForm({ ...accountPathProps, ...inputSetFormPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.EnhancedInputSetForm}
    >
      <EnhancedInputSetForm />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toTriggersPage({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersPage}
    >
      <PipelineDetails>
        <TriggersPage />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toTriggersDetailPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersDetailPage}
    >
      <TriggersDetailPage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TriggersWizardPage}
    >
      <TriggerDetails wizard={true}>
        <TriggersWizardPage />
      </TriggerDetails>
    </RouteWithLayout>
    <Route
      exact
      licenseStateName={LICENSE_STATE_NAMES.CI_LICENSE_STATE}
      sidebarProps={CISideNavProps}
      path={routes.toExecution({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
    >
      <RedirectToExecutionPipeline />
    </Route>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionPipelineView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ExecutionPipelineView}
    >
      <ExecutionLandingPage>
        <ExecutionPipelineView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionPolicyEvaluationsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionPolicyEvaluationsView}
    >
      <ExecutionLandingPage>
        <ExecutionPolicyEvaluationsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      layout={MinimalLayout}
      path={routes.toExecutionSecurityView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionSecurityView}
    >
      <ExecutionLandingPage>
        <ExecutionSecurityView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionInputsView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.ExecutionInputsView}
    >
      <ExecutionLandingPage>
        <ExecutionInputsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionArtifactsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.ExecutionArtifactsView}
    >
      <ExecutionLandingPage>
        <ExecutionArtifactsView />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionTestsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.BuildTests}
    >
      <ExecutionLandingPage>
        <BuildTests />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionCommitsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.BuildCommits}
    >
      <ExecutionLandingPage>
        <BuildCommits />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      exact
      sidebarProps={CISideNavProps}
      path={routes.toPipelineDeploymentList({
        ...accountPathProps,
        ...pipelinePathProps,
        ...pipelineModuleParams
      })}
      pageName={PAGE_NAME.CIPipelineDeploymentList}
    >
      <PipelineDetails>
        <CIPipelineDeploymentList />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
    >
      <RedirectToPipelineDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toCIPipelineDeploymentList({
        ...accountPathProps,
        ...pipelinePathProps
      })}
      pageName={PAGE_NAME.CIPipelineDeploymentList}
    >
      <CIPipelineDeploymentList />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
    >
      <RedirectToPipelineDetailHome />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toCIPipelineDeploymentList({
        ...accountPathProps,
        ...pipelinePathProps
      })}
      pageName={PAGE_NAME.CIPipelineDeploymentList}
    >
      <CIPipelineDeploymentList />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toAccessControl({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
    >
      <RedirectToAccessControlHome />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toUsers({ ...projectPathProps, ...pipelineModuleParams })]}
      exact
      pageName={PAGE_NAME.UsersPage}
    >
      <AccessControlPage>
        <UsersPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toUserDetails({ ...projectPathProps, ...pipelineModuleParams, ...userPathProps })}
      pageName={PAGE_NAME.UserDetails}
    >
      <UserDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toUserGroups({ ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.UserGroups}
    >
      <AccessControlPage>
        <UserGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toUserGroupDetails({ ...projectPathProps, ...pipelineModuleParams, ...userGroupPathProps })}
      pageName={PAGE_NAME.UserGroupDetails}
    >
      <UserGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CISideNavProps}
      path={routes.toServiceAccounts({ ...projectPathProps, ...pipelineModuleParams })}
      exact
      pageName={PAGE_NAME.ServiceAccountsPage}
    >
      <AccessControlPage>
        <ServiceAccountsPage />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      sidebarProps={CISideNavProps}
      path={routes.toServiceAccountDetails({ ...projectPathProps, ...pipelineModuleParams, ...serviceAccountProps })}
      exact
      pageName={PAGE_NAME.ServiceAccountDetails}
    >
      <ServiceAccountDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toResourceGroups({ ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.ResourceGroups}
    >
      <AccessControlPage>
        <ResourceGroups />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toRoles({ ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.Roles}
    >
      <AccessControlPage>
        <Roles />
      </AccessControlPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toRoleDetails({ ...projectPathProps, ...pipelineModuleParams, ...rolePathProps })]}
      pageName={PAGE_NAME.RoleDetails}
    >
      <RoleDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[
        routes.toResourceGroupDetails({ ...projectPathProps, ...pipelineModuleParams, ...resourceGroupPathProps })
      ]}
      pageName={PAGE_NAME.ResourceGroupDetails}
    >
      <ResourceGroupDetails />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toTemplates({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.TemplatesPage}
    >
      <TemplatesPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toTemplateStudio({ ...accountPathProps, ...templatePathProps, ...templateModuleParams })}
      pageName={PAGE_NAME.TemplateStudioWrapper}
    >
      <TemplateStudioWrapper />
    </RouteWithLayout>

    {GovernanceRouteDestinations({
      sidebarProps: CISideNavProps,
      pathProps: { ...accountPathProps, ...projectPathProps, ...pipelineModuleParams }
    })}
  </>
)
