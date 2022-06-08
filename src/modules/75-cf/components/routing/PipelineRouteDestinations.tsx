/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { Redirect, Route, useParams } from 'react-router-dom'
import { RouteWithLayout } from '@common/router'
import { MinimalLayout } from '@common/layouts'
import { CFSideNavProps } from '@cf/constants'
import routes from '@common/RouteDefinitions'
import {
  accountPathProps,
  executionPathProps,
  inputSetFormPathProps,
  pipelineModuleParams,
  pipelinePathProps,
  projectPathProps,
  triggerPathProps
} from '@common/utils/routeUtils'
import type { ExecutionPathProps, PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import PipelineDetails from '@pipeline/pages/pipeline-details/PipelineDetails'
import CFPipelineStudioWrapper from '@cf/pages/pipeline-studio/CFPipelineStudioWrapper'
import PipelinesPage from '@pipeline/pages/pipelines/PipelinesPage'
import DeploymentsList from '@pipeline/pages/deployments-list/DeploymentsList'
import InputSetList from '@pipeline/pages/inputSet-list/InputSetList'
import { EnhancedInputSetForm } from '@pipeline/components/InputSetForm/InputSetForm'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import ExecutionPolicyEvaluationsView from '@pipeline/pages/execution/ExecutionPolicyEvaluationsView/ExecutionPolicyEvaluationsView'
import TriggersPage from '@triggers/pages/triggers/TriggersPage'
import TriggersDetailPage from '@triggers/pages/triggers/TriggersDetailPage'
import TriggerDetails from '@triggers/pages/trigger-details/TriggerDetails'
import TriggersWizardPage from '@triggers/pages/triggers/TriggersWizardPage'
import ExecutionLandingPage from '@pipeline/pages/execution/ExecutionLandingPage/ExecutionLandingPage'
import ExecutionPipelineView from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionPipelineView'
import ExecutionInputsView from '@pipeline/pages/execution/ExecutionInputsView/ExecutionInputsView'
import ExecutionArtifactsView from '@pipeline/pages/execution/ExecutionArtifactsView/ExecutionArtifactsView'
import CFPipelineDeploymentList from '@cf/pages/pipeline-deployment-list/CFPipelineDeploymentList'
import { licenseRedirectData } from '@cf/components/routing/License'

const RedirectToExecutionPipeline = (): React.ReactElement => {
  const params = useParams<PipelineType<ExecutionPathProps>>()

  return <Redirect to={routes.toExecutionPipelineView(params)} />
}

const RedirectToPipelineDetailHome = (): React.ReactElement => {
  const params = useParams<PipelineType<PipelinePathProps>>()

  return <Redirect to={routes.toPipelineStudio(params)} />
}

const PipelineRouteDestinations: FC = () => (
  <>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      exact
      path={routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
    >
      <PipelineDetails>
        <CFPipelineStudioWrapper />
      </PipelineDetails>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      exact
      sidebarProps={CFSideNavProps}
      path={routes.toPipelines({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
    >
      <PipelinesPage />
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      exact
      sidebarProps={CFSideNavProps}
      path={routes.toDeployments({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
    >
      <DeploymentsList />
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      exact
      path={routes.toInputSetList({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
    >
      <PipelineDetails>
        <InputSetList />
      </PipelineDetails>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toInputSetForm({ ...accountPathProps, ...inputSetFormPathProps, ...pipelineModuleParams })}
      exact
    >
      <EnhancedInputSetForm />
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toTriggersPage({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      exact
    >
      <PipelineDetails>
        <TriggersPage />
      </PipelineDetails>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toTriggersDetailPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
      exact
    >
      <TriggersDetailPage />
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })}
    >
      <TriggerDetails>
        <TriggersWizardPage />
      </TriggerDetails>
    </RouteWithLayout>

    <Route
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toExecution({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      exact
    >
      <RedirectToExecutionPipeline />
    </Route>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toExecutionPipelineView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      exact
    >
      <ExecutionLandingPage>
        <ExecutionPipelineView />
      </ExecutionLandingPage>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toExecutionInputsView({ ...accountPathProps, ...executionPathProps, ...pipelineModuleParams })}
      exact
    >
      <ExecutionLandingPage>
        <ExecutionInputsView />
      </ExecutionLandingPage>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toExecutionArtifactsView({
        ...accountPathProps,
        ...executionPathProps,
        ...pipelineModuleParams
      })}
      exact
    >
      <ExecutionLandingPage>
        <ExecutionArtifactsView />
      </ExecutionLandingPage>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      exact
    >
      <RedirectToPipelineDetailHome />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
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
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toPipelineDeploymentList({
        ...accountPathProps,
        ...pipelinePathProps,
        ...pipelineModuleParams
      })}
      exact
    >
      <PipelineDetails>
        <CFPipelineDeploymentList />
      </PipelineDetails>
    </RouteWithLayout>

    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CFSideNavProps}
      path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })}
      exact
    >
      <RedirectToPipelineDetailHome />
    </RouteWithLayout>
  </>
)

export default PipelineRouteDestinations
