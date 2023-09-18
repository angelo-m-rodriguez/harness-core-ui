/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { matchPath } from 'react-router-dom'
import qs from 'qs'
import { isUndefined, omitBy } from 'lodash-es'
import {
  AccountPathProps,
  DashboardFolderPathProps,
  DashboardEmbedPathProps,
  ConnectorPathProps,
  EnvironmentPathProps,
  EnvironmentQueryParams,
  ModulePathParams,
  PipelinePathProps,
  ProjectPathProps,
  ServicePathProps,
  TemplateStudioPathProps,
  TemplateStudioQueryParams,
  TemplateType,
  SubscriptionQueryParams,
  DelegatePathProps,
  DelegateConfigProps,
  ServiceAccountPathProps,
  UserPathProps,
  UserGroupPathProps,
  RolePathProps,
  ResourceGroupPathProps,
  SecretsPathProps,
  GitOpsPathProps,
  EnvironmentGroupQueryParams,
  EnvironmentGroupPathProps,
  PipelineStudioQueryParams,
  PipelineType,
  PipelineLogsPathProps,
  InputSetPathProps,
  InputSetGitQueryParams,
  ExecutionPathProps,
  GitQueryParams,
  ExecutionQueryParams,
  TriggerPathProps,
  AccountRoutePlacement,
  ServiceOverridesQueryParams,
  ModuleHomeParams,
  DiscoveryPathProps,
  GovernancePathProps,
  FeatureFlagPathProps,
  SegmentPathProps,
  TargetPathProps,
  IACMPathProps
} from './interfaces/RouteInterfaces'

import {
  MODE_PATH,
  ModePathProps,
  NAV_MODE,
  withAccountId,
  withMode,
  withModule,
  withOrgIdentifier,
  withProjectIdentifier
} from './utils/routeUtils'

export type PathProps = Partial<AccountPathProps> &
  Partial<ProjectPathProps> &
  Partial<ModePathProps> &
  Partial<ModulePathParams>

const CV_HOME = `/cv/home`

export function withModeModuleAndScopePrefix<T>(fn: (args?: T) => string, includeCurrentModuleAndScope?: boolean) {
  return (params?: T & PathProps): string => {
    const match = matchPath<ModePathProps & AccountPathProps & ModulePathParams & ProjectPathProps>(location.pathname, {
      path: MODE_PATH
    })
    const modeFromUrl = match?.params.mode
    const accountFromUrl = match?.params.accountId
    const moduleFromUrl = includeCurrentModuleAndScope ? match?.params.module : undefined
    const projectFromUrl = includeCurrentModuleAndScope ? match?.params.projectIdentifier : undefined
    const orgFromUrl = includeCurrentModuleAndScope ? match?.params.orgIdentifier : undefined
    const {
      accountId = accountFromUrl,
      projectIdentifier = projectFromUrl,
      orgIdentifier = orgFromUrl,
      mode = modeFromUrl,
      module = moduleFromUrl
    } = params || {}

    const defaultPathProps = { ...params }
    // delete defaultPathProps.accountId
    // delete defaultPathProps.projectIdentifier
    // delete defaultPathProps.orgIdentifier
    // delete defaultPathProps.module
    // delete defaultPathProps.mode
    const path = fn(defaultPathProps as T)

    let url = ''

    if (projectIdentifier) {
      url = withProjectIdentifier(() => url)({ projectIdentifier })
    }

    if (orgIdentifier) {
      url = withOrgIdentifier(() => url)({ orgIdentifier })
    }

    if (module) {
      url = withModule(() => url)({ module })
    }

    if (mode) {
      url = withMode(() => url)({ mode })
    }

    if (accountId) {
      url = withAccountId(() => url)({ accountId })
    }

    return `${url}${path.replace(/^\//, '')}`
  }
}

const removeDefaultPathProps = <T>(params?: PathProps): T => {
  const clonedParams = { ...params }
  delete clonedParams.orgIdentifier
  delete clonedParams.projectIdentifier
  delete clonedParams.accountId
  delete clonedParams.mode
  delete clonedParams.module

  return clonedParams as T
}

const routes = {
  // common routes
  replace: withModeModuleAndScopePrefix<{ path?: string }>(params => `/${params?.path || ''}`, true),
  toMode: withModeModuleAndScopePrefix<{ noscope?: boolean }>(params =>
    params?.noscope ? `?noscope=${params?.noscope}` : ''
  ),
  toModeBase: withModeModuleAndScopePrefix(() => ''),
  toOverview: withModeModuleAndScopePrefix(() => '/overview'),
  toOrgs: withModeModuleAndScopePrefix(() => '/organizations'),
  toProjects: withModeModuleAndScopePrefix(() => '/projects'),
  toProjectDetails: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/details'),
  toUserProfile: withModeModuleAndScopePrefix(() => '/user/profile'),

  toAdminSettings: ({ accountId }: AccountPathProps) => {
    return withAccountId(() => `/${NAV_MODE.ADMIN}/settings`)({ accountId })
  },
  toSettings: withModeModuleAndScopePrefix(() => '/settings'),

  // to route to module trial pages
  toModuleTrial: withModeModuleAndScopePrefix<ModuleHomeParams>(params => {
    if (params?.source) {
      return `/${params.module}/home/trial?source=${params.source}`
    }
    return `/${params?.module}/home/trial`
  }),

  //pipeline routes
  toDeployments: withModeModuleAndScopePrefix(() => '/deployments'),
  toPipelines: withModeModuleAndScopePrefix(() => '/pipelines'),
  toPipelineStudio: withModeModuleAndScopePrefix<PipelinePathProps & PipelineStudioQueryParams>(p => {
    const params = removeDefaultPathProps<PipelinePathProps & PipelineStudioQueryParams>(p)
    const { pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/pipeline-studio/?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/pipeline-studio`
  }),
  toPipelineStudioV1: withModeModuleAndScopePrefix<PipelinePathProps & PipelineStudioQueryParams>(p => {
    const params = removeDefaultPathProps<PipelinePathProps & PipelineStudioQueryParams>(p)
    const { pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${params?.pipelineIdentifier}/pipeline-studio-v1/?${queryString}`
    }

    return `/pipelines/${params?.pipelineIdentifier}/pipeline-studio-v1`
  }),
  toPipelineDeploymentList: withModeModuleAndScopePrefix<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>(
    p => {
      const params = removeDefaultPathProps<PipelinePathProps & PipelineStudioQueryParams>(p)
      const { pipelineIdentifier, ...rest } = params
      const queryString = qs.stringify(rest, { skipNulls: true })
      if (queryString.length > 0) {
        return `/pipelines/${params?.pipelineIdentifier}/executions/?${queryString}`
      }

      return `/pipelines/${params?.pipelineIdentifier}/executions`
    }
  ),
  toInputSetList: withModeModuleAndScopePrefix<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>(p => {
    const params = removeDefaultPathProps<PipelinePathProps & PipelineStudioQueryParams>(p)
    const { pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${params?.pipelineIdentifier}/input-sets/?${queryString}`
    }

    return `/pipelines/${params?.pipelineIdentifier}/input-sets`
  }),

  toPipelineLogs: withModeModuleAndScopePrefix<PipelineType<PipelineLogsPathProps>>(params => {
    const { pipelineIdentifier, executionIdentifier, stageIdentifier, stepIndentifier } = params || {}
    return `/pipelines/${pipelineIdentifier}/execution/${executionIdentifier}/logs/${stageIdentifier}/${stepIndentifier}`
  }),
  toInputSetForm: withModeModuleAndScopePrefix<PipelineType<InputSetPathProps> & InputSetGitQueryParams>(p => {
    const params = removeDefaultPathProps<PipelineType<InputSetPathProps> & InputSetGitQueryParams>(p)
    const { pipelineIdentifier, inputSetIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/input-sets/${inputSetIdentifier}?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/input-sets/${inputSetIdentifier}`
  }),
  toInputSetFormV1: withModeModuleAndScopePrefix<PipelineType<InputSetPathProps> & InputSetGitQueryParams>(p => {
    const params = removeDefaultPathProps<PipelineType<InputSetPathProps> & InputSetGitQueryParams>(p)
    const { pipelineIdentifier, inputSetIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/input-sets-v1/${inputSetIdentifier}?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/input-sets-v1/${inputSetIdentifier}`
  }),
  toExecution: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    const { pipelineIdentifier, executionIdentifier, source } = params || {}
    return `/pipelines/${pipelineIdentifier}/${source}/${executionIdentifier}`
  }),
  toExecutionPipelineView: withModeModuleAndScopePrefix<
    PipelineType<ExecutionPathProps> & GitQueryParams & ExecutionQueryParams
  >(p => {
    const params = removeDefaultPathProps<PipelineType<ExecutionPathProps> & GitQueryParams & ExecutionQueryParams>(p)
    const { pipelineIdentifier, source, executionIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/${source}/${executionIdentifier}/pipeline?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/${source}/${executionIdentifier}/pipeline`
  }),
  toExecutionPolicyEvaluationsView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/policy-evaluations`
  }),
  toExecutionSecurityView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/security`
  }),
  toExecutionErrorTrackingView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/cet`
  }),
  toExecutionInputsView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/inputs`
  }),
  toExecutionArtifactsView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/artifacts`
  }),
  toExecutionTestsView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/tests`
  }),
  toExecutionCommitsView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/commits`
  }),
  toResilienceView: withModeModuleAndScopePrefix<PipelineType<ExecutionPathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/resilience`
  }),
  toPipelineDetail: withModeModuleAndScopePrefix<PipelineType<PipelinePathProps>>(params => {
    return `/pipelines/${params?.pipelineIdentifier}`
  }),

  // triggers routes

  toTriggersPage: withModeModuleAndScopePrefix<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>(p => {
    const params = removeDefaultPathProps<PipelinePathProps & PipelineStudioQueryParams>(p)
    const { pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/triggers/?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/triggers`
  }),
  toTriggersDetailPage: withModeModuleAndScopePrefix<PipelineType<TriggerPathProps> & GitQueryParams>(p => {
    const params = removeDefaultPathProps<PipelineType<TriggerPathProps> & GitQueryParams>(p)
    const { triggerIdentifier, pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}/detail?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}/detail`
  }),
  toTriggersActivityHistoryPage: withModeModuleAndScopePrefix<PipelineType<TriggerPathProps> & GitQueryParams>(p => {
    const params = removeDefaultPathProps<PipelineType<TriggerPathProps> & GitQueryParams>(p)
    const { triggerIdentifier, pipelineIdentifier, ...rest } = params
    const queryString = qs.stringify(rest, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}/activity-history?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}/activity-history`
  }),
  toTriggersWizardPage: withModeModuleAndScopePrefix<PipelineType<TriggerPathProps> & GitQueryParams>(p => {
    const params = removeDefaultPathProps<PipelineType<TriggerPathProps> & GitQueryParams>(p)
    const {
      pipelineIdentifier,
      triggerIdentifier,
      triggerType,
      sourceRepo,
      manifestType,
      artifactType,
      scheduleType,
      accountId: _accountId,
      module,
      ...rest
    } = params
    const isNewTrigger = triggerIdentifier === 'new'
    const queryParams = {
      ...rest,
      ...(isNewTrigger && triggerType && { triggerType }),
      ...(isNewTrigger && sourceRepo && { sourceRepo }),
      ...(isNewTrigger && manifestType && { manifestType }),
      ...(isNewTrigger && artifactType && { artifactType }),
      ...(isNewTrigger && scheduleType && { scheduleType })
    }
    const queryString = qs.stringify(queryParams, { skipNulls: true })
    if (queryString.length > 0) {
      return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}?${queryString}`
    }

    return `/pipelines/${pipelineIdentifier}/triggers/${triggerIdentifier}`
  }),

  // cd routes
  toModule: ({
    accountId,
    mode = NAV_MODE.MODULE,
    module
  }: AccountPathProps & ModulePathParams & Partial<ModePathProps>) => {
    return withAccountId(() => `${mode}/${module}`)({
      accountId
    })
  },
  toEnvironment: withModeModuleAndScopePrefix<ModulePathParams>(() => '/environments'),
  toModuleTrialHome: ({
    accountId,
    mode = NAV_MODE.MODULE,
    module
  }: AccountPathProps & ModulePathParams & Partial<ModePathProps>) => {
    return withAccountId(() => `${mode}/${module}/home/trial`)({
      accountId
    })
  },
  toEnvironments: withModeModuleAndScopePrefix<ModulePathParams>(() => '/environments'),
  toEnvironmentDetails: withModeModuleAndScopePrefix<EnvironmentPathProps>(
    (params?: EnvironmentPathProps) => `/environments/${params?.environmentIdentifier}/details`
  ),
  toEnvironmentGroups: withModeModuleAndScopePrefix<ModulePathParams>(() => '/environments/groups'),
  toEnvironmentGroupDetails: withModeModuleAndScopePrefix<EnvironmentGroupQueryParams & EnvironmentGroupPathProps>(
    params => `/environments/groups/${params?.environmentGroupIdentifier}/details`
  ),
  toServices: withModeModuleAndScopePrefix<ModulePathParams>(() => '/services'),
  toServiceStudio: withModeModuleAndScopePrefix<ServicePathProps>(params => `/services/${params?.serviceId}`),

  // ci routes
  toCI: ({
    accountId,
    mode = NAV_MODE.MODULE,
    module
  }: AccountPathProps & ModulePathParams & Partial<ModePathProps>) => {
    return withAccountId(() => `${mode}/${module}`)({
      accountId
    })
  },
  toGetStartedWithCI: withModeModuleAndScopePrefix<ModulePathParams>(() => '/get-started'),

  // ce routes
  toCE: withModeModuleAndScopePrefix<ModulePathParams>(() => `/`),
  toCEHome: withModeModuleAndScopePrefix<ModulePathParams>(() => '/home'),
  toCEProjectOverview: withModeModuleAndScopePrefix<ModulePathParams>(() => `/dashboard`),
  toCECODashboard: withModeModuleAndScopePrefix<ModulePathParams>(() => `/dashboard`),
  toCECOCreateGateway: withModeModuleAndScopePrefix<ModulePathParams>(() => `/autostopping-rules/create`),
  toCECOEditGateway: withModeModuleAndScopePrefix<ModulePathParams & { gatewayIdentifier: string }>(
    params => `/autostopping-rules/edit/${params?.gatewayIdentifier}`
  ),
  toOldCECOAccessPoints: withModeModuleAndScopePrefix<ModulePathParams>(() => `/access-points`),
  toCECOAccessPoints: withModeModuleAndScopePrefix<ModulePathParams>(() => `/autostopping-rules/access-points`),
  toCECORules: withModeModuleAndScopePrefix<ModulePathParams & { filterParams: string }>(
    params => `/autostopping-rules` + (params?.filterParams ? `?${params?.filterParams}` : '')
  ),
  toCECORuleDetails: withModeModuleAndScopePrefix<ModulePathParams & { id: string }>(
    params => `/autostopping-rules/rule/${params?.id}`
  ),
  toCERecommendations: withModeModuleAndScopePrefix<ModulePathParams>(() => `/recommendations`),
  toCERecommendationDetails: withModeModuleAndScopePrefix<
    ModulePathParams & { recommendation: string; recommendationName: string }
  >(params => `/recommendations/${params?.recommendation}/name/${params?.recommendationName}/details`),
  toOldCENodeRecommendationDetails: withModeModuleAndScopePrefix<
    ModulePathParams & { recommendation: string; recommendationName: string }
  >(params => `/node-recommendations/${params?.recommendation}/name/${params?.recommendationName}/details`),
  toCENodeRecommendationDetails: withModeModuleAndScopePrefix<
    ModulePathParams & { recommendation: string; recommendationName: string }
  >(params => `/recommendations/node/${params?.recommendation}/name/${params?.recommendationName}/details`),
  toCERecommendationWorkloadDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      recommendation: string
      workloadName: string
      clusterName: string
      namespace: string
      recommendationName: string
    }
  >(
    params =>
      `/recommendations/${params?.recommendation}/name/${params?.recommendationName}/cluster/${params?.clusterName}/namespace/${params?.namespace}/workload/${params?.workloadName}/details`
  ),
  toCERecommendationServiceDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      recommendation: string
      serviceName: string
      clusterName: string
      recommendationName: string
    }
  >(
    params =>
      `/recommendations/${params?.recommendation}/name/${params?.recommendationName}/cluster/${params?.clusterName}/service/${params?.serviceName}/details`
  ),
  toPerspectiveDetails: withModeModuleAndScopePrefix<
    ModulePathParams & { perspectiveId: string; perspectiveName: string }
  >(params => `/perspectives/${params?.perspectiveId}/name/${params?.perspectiveName}`),
  toCECreatePerspective: withModeModuleAndScopePrefix<ModulePathParams & { perspectiveId: string }>(
    params => `/perspectives/${params?.perspectiveId}/create`
  ),
  toCEPerspectives: withModeModuleAndScopePrefix<ModulePathParams>(() => `/perspectives`),
  toCEBudgets: withModeModuleAndScopePrefix<ModulePathParams>(() => '/budgets'),
  toCEBudgetDetailsOld: withModeModuleAndScopePrefix<
    ModulePathParams & {
      budgetId: string
      budgetName: string
    }
  >(params => `/budget/${params?.budgetId}/${params?.budgetName}`),
  toCEBudgetDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      budgetId: string
      budgetName: string
    }
  >(params => `/budgets/${params?.budgetId}/${params?.budgetName}`),
  toCEPerspectiveWorkloadDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      perspectiveId: string
      perspectiveName: string
      clusterName: string
      namespace: string
      workloadName: string
    }
  >(
    params =>
      `/perspectives/${params?.perspectiveId}/name/${params?.perspectiveName}/cluster/${params?.clusterName}/namespace/${params?.namespace}/workload/${params?.workloadName}/details`
  ),
  toCEPerspectiveNodeDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      perspectiveId: string
      perspectiveName: string
      clusterName: string
      nodeId: string
    }
  >(
    params =>
      `/perspectives/${params?.perspectiveId}/name/${params?.perspectiveName}/cluster/${params?.clusterName}/node/${params?.nodeId}/details`
  ),
  toCEPerspectiveServiceDetails: withModeModuleAndScopePrefix<
    ModulePathParams & {
      perspectiveId: string
      perspectiveName: string
      clusterName: string
      serviceName: string
    }
  >(
    params =>
      `/perspectives/${params?.perspectiveId}/name/${params?.perspectiveName}/cluster/${params?.clusterName}/service/${params?.serviceName}/details`
  ),
  toCEOverview: withModeModuleAndScopePrefix<ModulePathParams>(() => '/overview'),
  toCEPerspectiveDashboard: withModeModuleAndScopePrefix<ModulePathParams>(() => `/perspective`),
  toCEAnomalyDetection: withModeModuleAndScopePrefix<ModulePathParams>(() => `/anomaly-detection`),
  toBusinessMapping: withModeModuleAndScopePrefix<ModulePathParams>(() => `/cost-categories/`),
  toCEECSRecommendationDetails: withModeModuleAndScopePrefix<
    ModulePathParams & { recommendation: string; recommendationName: string }
  >(params => `/recommendations/ecs/${params?.recommendation}/name/${params?.recommendationName}/details`),
  toCEDashboards: withModeModuleAndScopePrefix<ModulePathParams>(() => '/bi-dashboards'),
  toCommitmentOrchestration: withModeModuleAndScopePrefix<ModulePathParams>(() => `/commitment-orchestration`),
  toCommitmentOrchestrationSetup: withModeModuleAndScopePrefix<ModulePathParams>(
    () => `/commitment-orchestration/setup`
  ),
  toOldCECloudIntegration: withModeModuleAndScopePrefix<ModulePathParams>(() => `/cloud-integrations/`),
  toCECloudIntegration: withModeModuleAndScopePrefix<ModulePathParams>(() => `/settings/cloud-integrations/`),
  toCEGovernance: withModeModuleAndScopePrefix<ModulePathParams>(() => `/governance/`),
  toCEGovernanceRules: withModeModuleAndScopePrefix<ModulePathParams>(() => `/governance/rules/`),
  toCEGovernanceEnforcements: withModeModuleAndScopePrefix<ModulePathParams>(() => `/governance/enforcements/`),
  toCEGovernanceEvaluations: withModeModuleAndScopePrefix<ModulePathParams>(() => `/governance/evaluations/`),
  toCEGovernanceRuleEditor: withModeModuleAndScopePrefix<ModulePathParams & { ruleId: string }>(
    params => `/governance/rules/${params?.ruleId}/rule-editor/`
  ),
  toClusterOrchestrator: withModeModuleAndScopePrefix<ModulePathParams>(() => '/compute-groups'),
  toClusterDetailsPage: withModeModuleAndScopePrefix<ModulePathParams & { id: string }>(
    params => `/compute-groups/${params?.id}/overview`
  ),
  toClusterWorkloadsDetailsPage: withModeModuleAndScopePrefix<ModulePathParams & { id: string }>(
    params => `/compute-groups/${params?.id}/workloads`
  ),
  toClusterNodepoolDetailsPage: withModeModuleAndScopePrefix<ModulePathParams & { id: string }>(
    params => `/compute-groups/${params?.id}/nodepool`
  ),
  toComputeGroupsSetup: withModeModuleAndScopePrefix<ModulePathParams & { id: string }>(
    params => `/compute-groups/setup/steps/${params?.id}`
  ),
  toOldCECurrencyPreferences: withModeModuleAndScopePrefix<ModulePathParams>(() => `/currency-preferences`),
  toCECurrencyPreferences: withModeModuleAndScopePrefix<ModulePathParams>(() => `/settings/currency-preferences`),
  toCEManagedServiceProvider: withModeModuleAndScopePrefix<ModulePathParams>(() => `/managed-service-provider`),
  toCCMMFE: withModeModuleAndScopePrefix<ModulePathParams>(() => `/new`),

  // cf routes
  toFeatureFlags: withModeModuleAndScopePrefix<ModulePathParams>(() => '/feature-flags'),

  // cv routes
  toMonitoredServices: withModeModuleAndScopePrefix(() => '/monitoredservices'),
  toAddMonitoredServices: withModeModuleAndScopePrefix(() => '/monitoringservices/setup'),
  toCVHome: withModeModuleAndScopePrefix(() => `/home`),
  toCVProject: withModeModuleAndScopePrefix(() => `/`),
  toCVProjectOverview: withModeModuleAndScopePrefix(() => `/dashboard`),
  toCVDeploymentPage: withModeModuleAndScopePrefix<{
    deploymentTag: string
    serviceIdentifier: string
    activityId: string
  }>(params =>
    params?.activityId
      ? `dashboard/deployment/${params?.deploymentTag}/service/${params?.serviceIdentifier}?activityId=${params?.activityId}`
      : `dashboard/deployment/${params?.deploymentTag}/service/${params?.serviceIdentifier}`
  ),
  toCVActivityChangesPage: withModeModuleAndScopePrefix<{ activityId: string }>(params =>
    !params?.activityId ? CV_HOME : `dashboard/activity-changes/${params?.activityId}`
  ),
  toCVDataSources: withModeModuleAndScopePrefix(() => `datasources`),
  toCVServices: withModeModuleAndScopePrefix(() => `services`),

  toCVChanges: withModeModuleAndScopePrefix(() => `changes`),

  toCVMonitoringServices: withModeModuleAndScopePrefix(() => {
    return `monitoringservices`
  }),

  toCVCodeErrors: withModeModuleAndScopePrefix(() => `eventsummary`),

  toCVCodeErrorsAgents: withModeModuleAndScopePrefix(() => `setup/agents`),

  toCVCodeErrorsAgentsTokens: withModeModuleAndScopePrefix(() => `setup/tokens`),

  toCVCodeErrorsCriticalEvents: withModeModuleAndScopePrefix(() => `setup/criticalevents`),

  toCVCodeErrorsSettings: withModeModuleAndScopePrefix(() => `setup`),

  toCVMonitoringServicesInputSets: withModeModuleAndScopePrefix(() => {
    return `monitoringservicesinputset`
  }),
  toAccountCVSLODetailsPage: withModeModuleAndScopePrefix<{ identifier: string }>(
    params => `/slos/${params?.identifier}`
  ),
  toCVSLOs: withModeModuleAndScopePrefix(() => `slos`),
  toAccountCVSLOs: withModeModuleAndScopePrefix(() => '/slos'),
  toCVSLODetailsPage: withModeModuleAndScopePrefix<{ identifier?: string }>(params => `slos/${params?.identifier}`),

  toErrorTracking: withModeModuleAndScopePrefix(() => {
    return `cet`
  }),
  toCVCreateSLOs: withModeModuleAndScopePrefix(() => {
    return `slo/create`
  }),
  toCVCreateCompositeSLOs: withModeModuleAndScopePrefix(() => {
    return `slo/create/composite`
  }),
  toAccountCVCreateCompositeSLOs: withModeModuleAndScopePrefix(() => {
    return `slo/create/composite`
  }),
  toCVSLODowntime: withModeModuleAndScopePrefix(() => '/settings/slo-downtime'),
  toCVCreateSLODowntime: withModeModuleAndScopePrefix(() => '/settings/slo-downtime/create'),
  toCVEditSLODowntime: withModeModuleAndScopePrefix<{ identifier?: string }>(
    params => `/settings/slo-downtime/edit/${params?.identifier}`
  ),
  toCVAddMonitoringServicesSetup: withModeModuleAndScopePrefix(() => `monitoringservices/setup`),
  toCVAddMonitoredServiceForServiceAndEnv: withModeModuleAndScopePrefix<{
    serviceIdentifier: string
    environmentIdentifier: string
  }>(params => {
    return `monitoringservices/setup/serviceIdentifier/${params?.serviceIdentifier}/environmentIdentifier/${params?.environmentIdentifier}`
  }),
  toCVAddMonitoringServicesEdit: withModeModuleAndScopePrefix<{ identifier: string }>(
    params => `monitoringservices/edit/${params?.identifier}`
  ),
  toCVOnBoardingSetup: withModeModuleAndScopePrefix<{ dataSourceType: string }>(
    params => `onboarding/${params?.dataSourceType}/setup`
  ),
  toCVActivitySourceSetup: withModeModuleAndScopePrefix<{ activitySource: string }>(
    params => `admin/setup/activity-source-setup/${params?.activitySource}`
  ),
  toCVActivitySourceEditSetup: withModeModuleAndScopePrefix<{ activitySource: string; activitySourceId: string }>(
    params =>
      `admin/setup/activity-source-setup/${params?.activitySource}/activity-sourceId/${params?.activitySourceId}`
  ),
  toCVActivityDashboard: withModeModuleAndScopePrefix(() => `activities/dashboard`),
  toCVAdminActivitySources: withModeModuleAndScopePrefix(() => `admin/activity-sources`),
  toCVAdminMonitoringSources: withModeModuleAndScopePrefix(() => `admin/monitoring-sources`),
  toCVAdminVerificationJobs: withModeModuleAndScopePrefix(() => `admin/verification-jobs`),
  toCVActivityDetails: withModeModuleAndScopePrefix<{ activityType: string }>(
    params => `activities/admin/${params?.activityType}`
  ),
  toCVAdminGeneralSettings: withModeModuleAndScopePrefix(() => `admin/general-settings`),
  toCVAdminGovernance: withModeModuleAndScopePrefix(() => `setup/governance`),
  toCVAdminSetup: withModeModuleAndScopePrefix(() => `admin/setup`),
  toCVAdminSetupMonitoringSource: withModeModuleAndScopePrefix<{ monitoringSource: string }>(
    params => `admin/setup/monitoring-source/${params?.monitoringSource}`
  ),
  toCVAdmin: withModeModuleAndScopePrefix(() => `admin`),
  toCVAdminSetupMonitoringSourceEdit: withModeModuleAndScopePrefix<{ monitoringSource: string; identifier: string }>(
    params => `admin/setup/monitoring-source/${params?.monitoringSource}/${params?.identifier}`
  ),
  toCVAdminSetupVerificationJob: withModeModuleAndScopePrefix(() => `admin/setup/verification-job`),
  toCVAdminSetupVerificationJobEdit: withModeModuleAndScopePrefix<{ verificationId: string }>(
    params => `admin/setup/verification-job/verificationId/${params?.verificationId}`
  ),
  toCVAdminAccessControl: withModeModuleAndScopePrefix(() => `setup/access-control`),
  toCVAdminNotifications: withModeModuleAndScopePrefix(() => `admin/notifications`),
  toMonitoredServicesConfigurations: withModeModuleAndScopePrefix<{ identifier: string }>(params => {
    return `monitoredservices/configurations/${params?.identifier}`
  }),

  // STO routes
  toSTOIssues: withModeModuleAndScopePrefix(() => '/issues'),
  toSTOTargets: withModeModuleAndScopePrefix(() => '/targets'),
  toSTOSecurityReview: withModeModuleAndScopePrefix(() => '/security-review'),
  toSTOGettingStarted: withModeModuleAndScopePrefix(() => '/getting-started'),
  toSTOTicketSummary: withModeModuleAndScopePrefix<{ issueId: string }>(() => '/issues'),

  // dashboards routes
  toDashboardsFoldersPage: withModeModuleAndScopePrefix<AccountPathProps>(() => `/folders`),
  toDashboardsFolder: withModeModuleAndScopePrefix<DashboardFolderPathProps>(
    params => `/folder/${params?.folderId ?? 'shared'}`
  ),
  toDashboardsEmbedPage: withModeModuleAndScopePrefix<DashboardEmbedPathProps>(
    params => `/folder/${params?.folderId ?? 'shared'}/view/${params?.viewId}`
  ),
  //settings routes
  toConnectors: withModeModuleAndScopePrefix(() => `settings/connectors`),
  toConnectorDetails: withModeModuleAndScopePrefix<ConnectorPathProps>(
    params => `settings/connectors/${params?.connectorId}`
  ),
  toCreateConnectorFromYamlSettings: withModeModuleAndScopePrefix(() => `settings/connectors/yaml/create-connector`),

  toAccountSettingsOverview: withModeModuleAndScopePrefix(() => '/settings/overview'),
  toDefaultSettings: withModeModuleAndScopePrefix(() => `settings/default-settings`),
  toAccountSMTP: withModeModuleAndScopePrefix(() => 'settings/smtp'),

  toSettingsServices: withModeModuleAndScopePrefix(() => 'settings/services'),
  toSettingsServiceDetails: withModeModuleAndScopePrefix<ServicePathProps>(
    params => `settings/services/${params?.serviceId}`
  ),

  toSettingsEnvironments: withModeModuleAndScopePrefix(() => 'settings/environments'),
  toSettingsEnvironmentDetails: withModeModuleAndScopePrefix<EnvironmentPathProps & EnvironmentQueryParams>(
    params => `settings/environments/${params?.environmentIdentifier}/details`
  ),
  toSettingsEnvironmentGroups: withModeModuleAndScopePrefix(() => 'settings/environments/groups'),
  toSettingsEnvironmentGroupDetails: withModeModuleAndScopePrefix<
    EnvironmentGroupQueryParams & EnvironmentGroupPathProps
  >(params => `settings/environments/groups/${params?.environmentGroupIdentifier}/details`),

  toSettingsServiceOverrides: withModeModuleAndScopePrefix(() => 'settings/serviceOverrides'),

  toSettingsTemplates: withModeModuleAndScopePrefix<{ templateType?: TemplateType }>(params => {
    const path = params?.templateType ? `settings/templates?templateType=${params?.templateType}` : 'settings/templates'
    return path
  }),

  toSettingsTemplateStudio: withModeModuleAndScopePrefix<Partial<TemplateStudioPathProps> & TemplateStudioQueryParams>(
    params => {
      const queryParams: TemplateStudioQueryParams = {
        branch: params?.branch,
        connectorRef: params?.connectorRef,
        repoIdentifier: params?.repoIdentifier,
        repoName: params?.repoName,
        storeType: params?.storeType,
        versionLabel: params?.versionLabel
      }

      const queryString = qs.stringify(omitBy(queryParams, isUndefined), { skipNulls: true })
      const templateType = params?.templateType
      const templateIdentifier = params?.templateIdentifier

      let path
      if (queryString.length > 0) {
        path = `settings/template-studio/${templateType}/template/${templateIdentifier}/?${queryString}`
      } else {
        path = `settings/template-studio/${templateType}/template/${templateIdentifier}/`
      }
      return path
    }
  ),

  toSettingsTemplateStudioNew: withModeModuleAndScopePrefix<
    Partial<TemplateStudioPathProps> & TemplateStudioQueryParams
  >(params => {
    const queryParams: TemplateStudioQueryParams = {
      branch: params?.branch,
      connectorRef: params?.connectorRef,
      repoIdentifier: params?.repoIdentifier,
      repoName: params?.repoName,
      storeType: params?.storeType,
      versionLabel: params?.versionLabel
    }
    const queryString = qs.stringify(omitBy(queryParams, isUndefined), { skipNulls: true })
    const templateType = params?.templateType
    const templateIdentifier = params?.templateIdentifier

    let path
    if (queryString.length > 0) {
      path = `settings/templates/${templateIdentifier}/template-studio/${templateType}/?${queryString}`
    } else {
      path = `settings/templates/${templateIdentifier}/template-studio/${templateType}/`
    }
    return path
  }),
  toAuthenticationSettings: withModeModuleAndScopePrefix(() => '/settings/authentication'),
  toBillingSettings: withModeModuleAndScopePrefix(() => '/settings/billing'),
  toSubscriptions: withModeModuleAndScopePrefix<SubscriptionQueryParams>(params => {
    const url = '/settings/subscriptions'
    const moduleCard = params?.moduleCard
    const tab = params?.tab
    if (moduleCard && tab) {
      return url.concat(`?moduleCard=${moduleCard}&&tab=${tab}`)
    }
    if (moduleCard) {
      return url.concat(`?moduleCard=${moduleCard}`)
    }
    if (tab) {
      return url.concat(`?tab=${tab}`)
    }
    return url
  }),
  toTicketSettings: withModeModuleAndScopePrefix(() => `/settings/tickets`),

  toFreezeWindowsSettings: withModeModuleAndScopePrefix(() => `/settings/freeze-windows`),
  toFreezeWindowStudioSettings: withModeModuleAndScopePrefix<
    Partial<{ windowIdentifier: string; sectionId?: string } & ProjectPathProps & ModulePathParams>
  >(params => {
    const queryParams = {
      sectionId: params?.sectionId,
      stageId: params?.stageId,
      stepId: params?.stepId
    }
    const queryString = qs.stringify(queryParams, { skipNulls: true })
    if (queryString.length > 0) {
      return `settings/freeze-windows/studio/window/${params?.windowIdentifier}/?${queryString}`
    } else {
      return `settings/freeze-windows/studio/window/${params?.windowIdentifier}/`
    }
  }),

  // governance routes
  toGovernanceSettings: withModeModuleAndScopePrefix(() => `/settings/governance`),
  toGovernancePolicyDashboardSettings: withModeModuleAndScopePrefix(() => `/settings/governance/dashboard`),
  toGovernancePolicyListingSettings: withModeModuleAndScopePrefix(() => `/settings/governance/policies`),
  toGovernanceNewPolicySettings: withModeModuleAndScopePrefix(() => `/settings/governance/policies/new`),
  toGovernanceEditPolicySettings: withModeModuleAndScopePrefix<GovernancePathProps>(
    params => `/settings/governance/policies/edit/${params?.policyIdentifier}`
  ),
  toGovernanceViewPolicySettings: withModeModuleAndScopePrefix<GovernancePathProps>(
    params => `/settings/governance/policies/view/${params?.policyIdentifier}`
  ),
  toGovernancePolicySetsListingSettings: withModeModuleAndScopePrefix(() => `/settings/governance/policy-sets`),
  toGovernancePolicySetDetail: withModeModuleAndScopePrefix<GovernancePathProps>(
    params => `/settings/governance/policy-sets/${params?.policySetIdentifier}`
  ),
  toGovernanceEvaluationsListing: withModeModuleAndScopePrefix(() => `/settings/governance/policy-evaluations`),
  toGovernanceEvaluationDetail: withModeModuleAndScopePrefix<GovernancePathProps>(
    params => `/settings/governance/policy-evaluations/${params?.evaluationId}`
  ),

  toAuditTrailSettings: withModeModuleAndScopePrefix(() => `/settings/audit-trail`),

  toDelegatesSettings: withModeModuleAndScopePrefix(() => `/settings/delegates`),
  toDelegateListSettings: withModeModuleAndScopePrefix(() => `/settings/delegates/list`),
  toDelegatesDetailsSettings: withModeModuleAndScopePrefix<DelegatePathProps>(
    params => `/settings/delegate/${params?.delegateIdentifier}`
  ),
  toDelegateConfigsSettings: withModeModuleAndScopePrefix(() => `/settings/delegates/configs`),
  toDelegateConfigsDetailsSettings: withModeModuleAndScopePrefix<DelegateConfigProps>(
    params => `/settings/delegates/configs/${params?.delegateConfigIdentifier}`
  ),
  toDelegateTokensSettings: withModeModuleAndScopePrefix(() => `/settings/delegates/tokens`),
  toEditDelegateConfigsDetailsSettings: withModeModuleAndScopePrefix<DelegateConfigProps>(
    params => `/settings/delegates/configs/${params?.delegateConfigIdentifier}/edit`
  ),

  toAccessControlSettings: withModeModuleAndScopePrefix(() => `/settings/access-control`),
  toAccessControlServiceAccountsSettings: withModeModuleAndScopePrefix(
    () => `/settings/access-control/service-accounts`
  ),
  toAccessControlServiceAccountsDetailsSettings: withModeModuleAndScopePrefix<ServiceAccountPathProps>(
    params => `/settings/access-control/service-accounts/${params?.serviceAccountIdentifier}`
  ),
  toAccessControlUsersSettings: withModeModuleAndScopePrefix(() => `/settings/access-control/users`),
  toAccessControlUsersDetailsSettings: withModeModuleAndScopePrefix<UserPathProps>(
    params => `/settings/access-control/users/${params?.userIdentifier}`
  ),
  toAccessControlUserGroupsSettings: withModeModuleAndScopePrefix(() => `/settings/access-control/user-groups`),
  toAccessControlUserGroupsDetailsSettings: withModeModuleAndScopePrefix<UserGroupPathProps>(
    params => `/settings/access-control/user-groups/${params?.userGroupIdentifier}`
  ),
  toAccessControlResourceGroupsSettings: withModeModuleAndScopePrefix(() => `/settings/access-control/resource-groups`),
  toAccessControlResourceGroupDetailsSettings: withModeModuleAndScopePrefix<ResourceGroupPathProps>(
    params => `/settings/access-control/resource-groups/${params?.resourceGroupIdentifier}`
  ),
  toAccessControlRoleSettings: withModeModuleAndScopePrefix(() => `/settings/access-control/roles`),
  toAccessControlRoleDetailsSettings: withModeModuleAndScopePrefix<RolePathProps>(
    params => `/settings/access-control/roles/${params?.roleIdentifier}`
  ),

  toSecretsSettings: withModeModuleAndScopePrefix(() => `/settings/secrets`),
  toSecretDetailsSettings: withModeModuleAndScopePrefix<SecretsPathProps>(
    params => `/settings/secrets/${params?.secretId}`
  ),
  toCreateSecretFromYamlSettings: withModeModuleAndScopePrefix(() => `/settings/secrets/yaml/create-secret`),

  toSecretDetailsOverviewSettings: withModeModuleAndScopePrefix<SecretsPathProps>(
    params => `/settings/secrets/${params?.secretId}/overview`
  ),
  toSecretDetailsReferencesSettings: withModeModuleAndScopePrefix<SecretsPathProps>(
    params => `/settings/secrets/${params?.secretId}/references`
  ),

  toFileStoreSettings: withModeModuleAndScopePrefix(() => `/settings/file-store`),
  toVariablesSettings: withModeModuleAndScopePrefix(() => `/settings/variables`),

  toGitOpsResources: withModeModuleAndScopePrefix<GitOpsPathProps>(params => `/settings/gitops/${params?.entity}`),
  toWebhooksSettings: withModeModuleAndScopePrefix(() => `/settings/webhooks`),
  toWebhooksEventsSettings: withModeModuleAndScopePrefix(() => `/settings/webhooks/events`),

  // chaos module routes
  toChaosMicroFrontend: withModeModuleAndScopePrefix<ModulePathParams>(() => '/'),
  toChaosOverview: withModeModuleAndScopePrefix<ModulePathParams>(() => `/dashboard`),
  toChaosExperiments: withModeModuleAndScopePrefix<ModulePathParams>(() => `/experiments`),
  toNewChaosExperiment: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/experiments/new/${params?.identifier}/chaos-studio`
  ),
  toChaosExperiment: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/experiments/${params?.identifier}/chaos-studio`
  ),
  toChaosExperimentRun: withModeModuleAndScopePrefix<
    ModulePathParams & { experimentIdentifier: string; experimentRunIdentifier: string }
  >(params => `/experiments/${params?.experimentIdentifier}/runs/${params?.experimentRunIdentifier}`),
  toChaosHubs: withModeModuleAndScopePrefix<ModulePathParams>(() => '/chaos-hubs'),
  toChaosHub: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/chaos-hubs/${params?.identifier}`
  ),
  toChaosGameDays: withModeModuleAndScopePrefix<ModulePathParams>(() => '/gamedays'),
  toChaosGameDay: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/gamedays/${params?.identifier}`
  ),
  toChaosProbes: withModeModuleAndScopePrefix<ModulePathParams>(() => '/probes'),
  toChaosDashboards: withModeModuleAndScopePrefix<ModulePathParams>(() => '/chaos-dashboards'),
  toChaosEnvironments: withModeModuleAndScopePrefix<ModulePathParams>(() => '/environments'),
  toChaosEnvironmentDetails: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/environments/${params?.identifier}`
  ),
  toChaosSecurityGovernance: withModeModuleAndScopePrefix<ModulePathParams>(() => '/chaos-guard'),
  toChaosSecurityGovernanceRuleDetails: withModeModuleAndScopePrefix<ModulePathParams & { identifier: string }>(
    params => `/chaos-guard/rules/${params?.identifier}`
  ),
  toChaosImageRegistry: withModeModuleAndScopePrefix<ModulePathParams>(() => '/image-registry'),
  toGitOps: withModeModuleAndScopePrefix<ModulePathParams>(() => '/gitops'),
  toGetStartedWithCD: withModeModuleAndScopePrefix<ModulePathParams>(() => '/get-started'),
  toServiceOverrides: withModeModuleAndScopePrefix<
    Partial<{ accountRoutePlacement?: AccountRoutePlacement }> & ServiceOverridesQueryParams
  >(params => {
    const queryParams: ServiceOverridesQueryParams = {
      serviceOverrideType: params?.serviceOverrideType
    }
    const queryString = qs.stringify(queryParams, { skipNulls: true })
    return queryString.length > 0 ? `/serviceOverrides?${queryString}` : '/serviceOverrides'
  }),
  toCDOnboardingWizard: withModeModuleAndScopePrefix<ModulePathParams>(() => '/cd-onboarding'),
  toCDOnboardingWizardWithCLI: withModeModuleAndScopePrefix<ModulePathParams>(() => '/cd-onboarding-wizard'),

  toGitSyncAdminSettings: withModeModuleAndScopePrefix(() => `/settings/git-sync`),
  toGitSyncReposAdminSettings: withModeModuleAndScopePrefix(() => `/settings/git-sync/repos`),
  toGitSyncEntitiesAdminSettings: withModeModuleAndScopePrefix(() => `/settings/git-sync/entities`),
  toGitSyncErrorsAdminSettings: withModeModuleAndScopePrefix(() => `/settings/git-sync/errors`),
  toGitSyncConfigAdminSettings: withModeModuleAndScopePrefix(() => `/settings/git-sync/config`),

  toDiscoverySettings: withModeModuleAndScopePrefix(() => `/settings/discovery`),
  toDiscoveryDetailsSettings: withModeModuleAndScopePrefix<DiscoveryPathProps>(
    params => `/settings/discovery/${params?.dAgentId}`
  ),
  toCreateNetworkMapSettings: withModeModuleAndScopePrefix<DiscoveryPathProps>(
    params => `/settings/discovery/${params?.dAgentId}/create-network-map`
  ),

  toMonitoredServicesSettings: withModeModuleAndScopePrefix(() => '/settings/monitoredservices'),
  toMonitoredServicesSetupSettings: withModeModuleAndScopePrefix(() => `/settings/monitoringservices/setup`),

  // ssca module routes
  toSSCAArtifacts: withModeModuleAndScopePrefix(() => '/artifacts'),
  toSSCAComponents: withModeModuleAndScopePrefix(() => '/components'),

  //cet routes
  toCET: withModeModuleAndScopePrefix<ModulePathParams>(() => ''),
  toCETHome: withModeModuleAndScopePrefix<ModulePathParams>(() => '/home'),
  toCETSettings: withModeModuleAndScopePrefix<ModulePathParams>(() => '/settings'),
  toCETTrial: withModeModuleAndScopePrefix(() => '/home/trial'),
  toCETEventsSummary: withModeModuleAndScopePrefix<ModulePathParams>(() => '/eventsummary'),
  toCETMonitoredServices: withModeModuleAndScopePrefix<ModulePathParams>(() => '/etmonitoredservices'),
  toCETAgents: withModeModuleAndScopePrefix<ModulePathParams>(() => '/settings/agents'),
  toCETAgentsTokens: withModeModuleAndScopePrefix<ModulePathParams>(() => '/settings/tokens'),
  toCETCriticalEvents: withModeModuleAndScopePrefix<ModulePathParams>(() => '/settings/criticalevents'),

  // cf routes
  toCF: (params: Partial<ProjectPathProps>) =>
    params.orgIdentifier && params.projectIdentifier
      ? routes.toCFProject(params as ProjectPathProps)
      : routes.toCFDashboard(params as AccountPathProps),
  toCFDashboard: withModeModuleAndScopePrefix(() => `/cf`),
  toCFHome: withModeModuleAndScopePrefix(() => `/cf/home`),
  toCFFeatureFlags: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/feature-flags'),
  toCFOnboarding: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/onboarding'),
  toCFEnvironments: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/environments'),
  toCFTargetManagement: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/target-management'),
  toCFProject: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/'),
  toCFProjectOverview: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/dashboard'),
  toCFFeatureFlagsDetail: withModeModuleAndScopePrefix<ProjectPathProps & FeatureFlagPathProps>(
    params => `feature-flags/${params?.featureFlagIdentifier}`
  ),
  toCFSegments: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/target-management/target-groups'),
  toCFTargets: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/target-management/targets'),
  toCFSegmentDetailsWithEnv: withModeModuleAndScopePrefix<ProjectPathProps & EnvironmentPathProps & SegmentPathProps>(
    params =>
      `target-management/target-groups/${params?.segmentIdentifier}?activeEnvironment=${params?.environmentIdentifier}`
  ),
  toCFSegmentDetails: withModeModuleAndScopePrefix<ProjectPathProps & SegmentPathProps>(params => {
    return `target-management/target-groups/${params?.segmentIdentifier}`
  }),
  toCFTargetDetails: withModeModuleAndScopePrefix<ProjectPathProps & TargetPathProps>(
    params => `/target-management/targets/${params?.targetIdentifier}`
  ),
  toCFEnvironmentDetails: withModeModuleAndScopePrefix<ProjectPathProps & EnvironmentPathProps>(
    params => `/environments/${params?.environmentIdentifier}`
  ),
  toCFWorkflows: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/workflows'),
  toCFAdmin: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/setup'),
  toCFAdminGovernance: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/setup/governance'),
  toCFOnboardingDetail: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/onboarding/detail'),
  toCFConfigurePath: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/configurePath'),

  // iacm routes
  toIACMOverview: withModeModuleAndScopePrefix<ProjectPathProps>(() => '/overview'),
  toIACMWorkspaces: withModeModuleAndScopePrefix<ProjectPathProps>(() => `/workspaces`),
  toIACMWorkspace: withModeModuleAndScopePrefix<ProjectPathProps & IACMPathProps>(
    params => `/workspaces/${params?.workspaceIdentifier}/resources`
  ),
  toIACMSetup: withModeModuleAndScopePrefix<ProjectPathProps>(() => `/setup/`),
  toIACMPipelines: withModeModuleAndScopePrefix<ProjectPathProps>(() => `/pipelines`),
  toIACMPipelineResources: withModeModuleAndScopePrefix<ProjectPathProps & ExecutionPathProps>(
    params => `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/resources`
  ),
  toIACMPipelineCostEstimation: withModeModuleAndScopePrefix<ProjectPathProps & ExecutionPathProps>(
    params => `/pipelines/${params?.pipelineIdentifier}/${params?.source}/${params?.executionIdentifier}/costs`
  )
}

export default routes
