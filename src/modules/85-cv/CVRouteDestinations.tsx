/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'

import { AccountPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import PipelineRouteDestinations from '@pipeline/PipelineRouteDestinations'
import { RouteWithContext } from '@common/router/RouteWithContext/RouteWithContext'
import { accountPathProps, NAV_MODE, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { ModuleName } from 'framework/types/ModuleName'

import routes from '@common/RouteDefinitionsV2'
import { Scope } from 'framework/types/types'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { useFeatureFlag, useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { DateTimePicker } from '@common/components/DateTimePicker/DateTimePicker'
import { NameIdDescriptionTags, TimeSeriesAreaChart } from '@common/components'
import { Stepper } from '@common/components/Stepper/Stepper'
import { Ticker } from '@common/components/Ticker/Ticker'
import { useMutateAsGet, useQueryParams, useDeepCompareEffect } from '@common/hooks'
import { useHarnessServicetModal } from '@common/modals/HarnessServiceModal/HarnessServiceModal'
import { formatDatetoLocale, getReadableDateTime, ALL_TIME_ZONES } from '@common/utils/dateUtils'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import { useGetSelectedScope } from '@common/navigation/SideNavV2/SideNavV2.utils'
import MonitoredServiceListWidget from './components/MonitoredServiceListWidget/MonitoredServiceListWidget'
import {
  CD_MONITORED_SERVICE_CONFIG,
  PROJECT_MONITORED_SERVICE_CONFIG
} from './components/MonitoredServiceListWidget/MonitoredServiceListWidget.constants'
import CommonMonitoredServiceDetails from './components/MonitoredServiceListWidget/components/CommonMonitoredServiceDetails/CommonMonitoredServiceDetails'
import { editParams } from './utils/routeUtils'
import { cdModuleParams, serviceAndEnvParams } from './RouteDestinations'
import CVMonitoredService from './pages/monitored-service/CVMonitoredService/CVMonitoredService'
import MonitoredServiceInputSetsTemplate from './pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate'
import { CVChanges } from './pages/changes/CVChanges'
import CVSLODetailsPage from './pages/slos/CVSLODetailsPage/CVSLODetailsPage'
import MonitoredServicePage from './pages/monitored-service/MonitoredServicePage'
import { MonitoredServiceProvider } from './pages/monitored-service/MonitoredServiceContext'
import CVCreateSLOV2 from './pages/slos/components/CVCreateSLOV2/CVCreateSLOV2'
import CVHomePage from './pages/home/CVHomePage'
import CVSLOsListingPage from './pages/slos/CVSLOsListingPage'
import { cvModuleParams } from './constants'
import ChangeTimeline from './components/ChangeTimeline/ChangeTimeline'
import TimelineSlider from './components/ChangeTimeline/components/TimelineSlider/TimelineSlider'
import {
  useGetHarnessServices,
  useGetHarnessEnvironments,
  HarnessServiceAsFormField,
  HarnessEnvironmentAsFormField
} from './components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { useLogContentHook } from './hooks/useLogContentHook/useLogContentHook'
import { SRMCustomMicroFrontendProps } from './interface/SRMCustomMicroFrontendProps.types'
import HealthSourceDrawerHeader from './pages/health-source/HealthSourceDrawer/component/HealthSourceDrawerHeader/HealthSourceDrawerHeader'
import HealthSourceDrawerContent from './pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent'
import { WrapperOrgAccountLevelServiceEnvField } from './pages/monitored-service/components/Configurations/components/Service/components/MonitoredServiceOverview/component/OrgAccountLevelServiceEnvField/OrgAccountLevelServiceEnvField'
import {
  updatedMonitoredServiceNameForEnv,
  updateMonitoredServiceNameForService
} from './pages/monitored-service/components/Configurations/components/Service/components/MonitoredServiceOverview/MonitoredServiceOverview.utils'
import AnomaliesCard from './pages/monitored-service/components/ServiceHealth/components/AnomaliesCard/AnomaliesCard'
import ChangesTable from './pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/ChangesTable'
import SLOTargetNotifications from './pages/slos/common/SLOTargetAndBudgetPolicy/components/SLOTargetNotificationsContainer/SLOTargetNotifications'

const CVRedirect: React.FC = () => {
  const { scope, params } = useGetSelectedScope()
  const { accountId } = useParams<AccountPathProps>()

  if (scope === Scope.PROJECT) {
    return (
      <Redirect
        to={routes.toCVSLOs({
          projectIdentifier: params?.projectIdentifier,
          orgIdentifier: params?.orgIdentifier,
          accountId,
          module: 'cv'
        })}
      />
    )
  }

  if (scope === Scope.ORGANIZATION) {
    // redirect to settings page
    return <Redirect to={routes.toSettings({ orgIdentifier: params?.orgIdentifier, module: 'cv' })} />
  }

  if (scope === Scope.ACCOUNT) {
    return (
      <Redirect
        to={routes.toCVSLOs({
          accountId,
          module: 'cv'
        })}
      />
    )
  }

  // Open scope selector
  return <CVHomePage />
}

const RedirectToCVProject = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject?.modules?.includes(ModuleName.CV)) {
    return (
      <Redirect
        to={routes.toCVSLOs({
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

// eslint-disable-next-line import/no-unresolved
const SrmMicroFrontendPath = React.lazy(() => import('srmui/MicroFrontendApp'))

const CVRouteDestinations = (mode = NAV_MODE.MODULE): React.ReactElement => {
  const { SRM_MICRO_FRONTEND: enableMicroFrontend } = useFeatureFlags()
  const mfePaths = enableMicroFrontend
    ? [
        routes.toCVSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams }),
        routes.toAccountCVSLOs({ ...accountPathProps, mode }),
        routes.toCVCreateSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams }),
        routes.toCVCreateCompositeSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams }),
        routes.toCVSLODetailsPage({
          ...accountPathProps,
          mode,
          ...projectPathProps,
          ...editParams,
          ...cvModuleParams
        })
      ]
    : []

  return (
    <>
      <RouteWithContext
        exact
        path={[
          routes.toMode({ ...projectPathProps, module: 'cv', mode }),
          routes.toMode({ ...orgPathProps, module: 'cv', mode }),
          routes.toMode({ ...accountPathProps, module: 'cv', mode })
        ]}
      >
        <CVRedirect />
      </RouteWithContext>
      {/* Todo- check whether its required or not */}
      {/* <RouteWithContext
        exact
        path={routes.toCVHome({ ...accountPathProps, ...cvModuleParams, ...projectPathProps, mode })}
      >
        <CVHomePage />
      </RouteWithContext> */}
      <RouteWithContext
        path={routes.toMonitoredServices({ ...accountPathProps, ...orgPathProps, ...projectPathProps, mode })}
        exact
      >
        <MonitoredServiceListWidget config={PROJECT_MONITORED_SERVICE_CONFIG} />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toAddMonitoredServices({ ...accountPathProps, ...orgPathProps, ...projectPathProps, mode })}
      >
        <MonitoredServiceProvider isTemplate={false}>
          <CommonMonitoredServiceDetails config={PROJECT_MONITORED_SERVICE_CONFIG} />
        </MonitoredServiceProvider>
      </RouteWithContext>
      <RouteWithContext
        path={routes.toMonitoredServicesConfigurations({
          ...accountPathProps,
          ...orgPathProps,
          ...projectPathProps,
          ...editParams,
          mode
        })}
        exact
      >
        <CommonMonitoredServiceDetails config={PROJECT_MONITORED_SERVICE_CONFIG} />
      </RouteWithContext>
      <RouteWithContext
        path={routes.toMonitoredServices({
          ...accountPathProps,
          ...orgPathProps,
          ...projectPathProps,
          ...cdModuleParams,
          mode
        })}
        exact
      >
        <MonitoredServiceListWidget config={CD_MONITORED_SERVICE_CONFIG} />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toAddMonitoredServices({
          ...accountPathProps,
          ...orgPathProps,
          ...projectPathProps,
          ...cdModuleParams,
          mode
        })}
      >
        <MonitoredServiceProvider isTemplate={false}>
          <CommonMonitoredServiceDetails config={CD_MONITORED_SERVICE_CONFIG} />
        </MonitoredServiceProvider>
      </RouteWithContext>
      <RouteWithContext
        path={routes.toMonitoredServicesConfigurations({
          ...accountPathProps,
          ...orgPathProps,
          ...projectPathProps,
          ...cdModuleParams,
          ...editParams,
          mode
        })}
        exact
      >
        <CommonMonitoredServiceDetails config={CD_MONITORED_SERVICE_CONFIG} />
      </RouteWithContext>
      <RouteWithContext
        path={[
          /* Todo- check if its needed */
          // routes.toCV({ ...accountPathProps }),
          routes.toCVProject({ ...accountPathProps, ...projectPathProps, mode })
        ]}
        exact
      >
        <RedirectToCVProject />
      </RouteWithContext>
      <RouteWithContext exact path={routes.toCVHome({ ...accountPathProps, mode })}>
        <CVHomePage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCVMonitoringServices({ ...accountPathProps, ...projectPathProps, ...cvModuleParams, mode })}
      >
        <MonitoredServiceProvider isTemplate={false}>
          <CVMonitoredService />
        </MonitoredServiceProvider>
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCVMonitoringServicesInputSets({
          ...accountPathProps,
          ...projectPathProps,
          ...cvModuleParams,
          mode
        })}
      >
        <MonitoredServiceInputSetsTemplate />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toCVChanges({ ...accountPathProps, ...projectPathProps, ...cvModuleParams, mode })}
      >
        <CVChanges />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={routes.toAccountCVCreateCompositeSLOs({ ...accountPathProps, ...cvModuleParams, mode })}
      >
        <CVCreateSLOV2 isComposite />
      </RouteWithContext>

      {/* //Todo- look into this */}
      {/* <RouteWithContext path={routes.toErrorTracking({ ...accountPathProps, ...projectPathProps, ...cvModuleParams })}>
        <ChildAppMounter<ETCustomMicroFrontendProps>
          ChildApp={ErrorTracking}
          customComponents={{
            NotificationWizardOverviewStep: Overview,
            NotificationWizardMethodStep: NotificationMethods,
            MultiTypeConnectorField: MultiTypeConnectorField
          }}
        />
      </RouteWithContext> */}
      <RouteWithContext
        exact
        path={routes.toAccountCVSLODetailsPage({
          ...accountPathProps,
          ...editParams,
          ...cvModuleParams,
          mode
        })}
      >
        <CVSLODetailsPage />
      </RouteWithContext>
      <RouteWithContext
        exact
        path={[
          routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
          routes.toCVAddMonitoringServicesEdit({
            ...accountPathProps,
            ...projectPathProps,
            ...editParams,
            ...cvModuleParams,
            mode
          })
        ]}
      >
        <MonitoredServiceProvider isTemplate={false}>
          <MonitoredServicePage />
        </MonitoredServiceProvider>
      </RouteWithContext>

      <RouteWithContext
        exact
        path={[
          routes.toCVAddMonitoredServiceForServiceAndEnv({
            ...accountPathProps,
            ...projectPathProps,
            ...serviceAndEnvParams,
            mode
          })
        ]}
      >
        <MonitoredServiceProvider isTemplate={false}>
          <MonitoredServicePage />
        </MonitoredServiceProvider>
      </RouteWithContext>
      {enableMicroFrontend ? (
        <RouteWithContext exact path={[...mfePaths]}>
          <ChildAppMounter<SRMCustomMicroFrontendProps>
            ChildApp={SrmMicroFrontendPath}
            customHooks={{
              useMutateAsGet,
              useQueryParams,
              useFeatureFlag,
              useFeatureFlags,
              useLogContentHook,
              useDeepCompareEffect,
              useGetHarnessServices,
              useGetHarnessEnvironments,
              useHarnessServicetModal
            }}
            customFunctions={{
              formatDatetoLocale,
              getReadableDateTime,
              updatedMonitoredServiceNameForEnv,
              updateMonitoredServiceNameForService
            }}
            customConstants={{ ALL_TIME_ZONES }}
            customComponents={{
              Stepper,
              Ticker,
              ChangeTimeline,
              TimelineSlider,
              AnomaliesCard,
              ChangesTable,
              DateTimePicker,
              NameIdDescriptionTags,
              SLOTargetNotifications,
              HarnessServiceAsFormField,
              HarnessEnvironmentAsFormField,
              HealthSourceDrawerHeader,
              HealthSourceDrawerContent,
              TimeSeriesAreaChart,
              OrgAccountLevelServiceEnvField: WrapperOrgAccountLevelServiceEnvField
            }}
          />
        </RouteWithContext>
      ) : (
        <>
          <RouteWithContext
            exact
            path={routes.toCVSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams })}
          >
            <CVSLOsListingPage />
          </RouteWithContext>
          <RouteWithContext exact path={routes.toAccountCVSLOs({ ...accountPathProps, mode })}>
            <CVSLOsListingPage />
          </RouteWithContext>
          <RouteWithContext
            exact
            path={routes.toCVCreateSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams })}
          >
            <CVCreateSLOV2 />
          </RouteWithContext>
          <RouteWithContext
            exact
            path={routes.toCVCreateCompositeSLOs({ ...accountPathProps, mode, ...projectPathProps, ...cvModuleParams })}
          >
            <CVCreateSLOV2 isComposite />
          </RouteWithContext>
          <RouteWithContext
            exact
            path={routes.toCVSLODetailsPage({
              ...accountPathProps,
              mode,
              ...projectPathProps,
              ...editParams,
              ...cvModuleParams
            })}
          >
            <CVSLODetailsPage />
          </RouteWithContext>
        </>
      )}
      {PipelineRouteDestinations({ mode, pipelineStudioPageName: PAGE_NAME.CDPipelineStudio }).props.children}
    </>
  )
}
export default CVRouteDestinations
