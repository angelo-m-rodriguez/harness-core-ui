/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RouteWithLayout } from '@common/router'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import routes from '@common/RouteDefinitions'
import CDSideNav from '@cd/components/CDSideNav/CDSideNav'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { AccountSideNavProps } from '@common/RouteDestinations'
import { accountPathProps, orgPathProps, projectPathProps } from '@common/utils/routeUtils'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import {
  DeployEnvironmentWidget,
  NewEditEnvironmentModal
} from '@cd/components/PipelineSteps/DeployEnvStep/DeployEnvStep'
import GitOpsServersPage from '@cd/pages/gitops/GitOpsServersHomePage'
import GitOpsModalContainer from '@cd/pages/gitops/NativeArgo/GitOpsProvidersList'
import type { GitOpsCustomMicroFrontendProps } from '@cd/interfaces/GitOps.types'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import DeployServiceWidget from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceWidget'

// eslint-disable-next-line import/no-unresolved
const GitOpsServersList = React.lazy(() => import('gitopsui/MicroFrontendApp'))

const CDSideNavProps: SidebarContext = {
  navComponent: CDSideNav,
  subtitle: 'Continuous',
  title: 'Delivery',
  icon: 'cd-main'
}

const pipelineModuleParams: ModulePathParams = {
  module: ':module(cd)'
}

const GitOpsPage = (): React.ReactElement | null => {
  const { ARGO_PHASE1, ARGO_PHASE2_MANAGED } = useFeatureFlags()

  if (ARGO_PHASE2_MANAGED) {
    return (
      <ChildAppMounter<GitOpsCustomMicroFrontendProps>
        ChildApp={GitOpsServersList}
        customComponents={{
          DeployEnvironmentWidget,
          DeployServiceWidget,
          NewEditEnvironmentModal,
          NewEditServiceModal
        }}
      />
    )
  }

  if (ARGO_PHASE1) {
    return (
      <GitOpsServersPage>
        <GitOpsModalContainer />
      </GitOpsServersPage>
    )
  }

  return null
}

export default (
  <>
    <RouteWithLayout
      sidebarProps={CDSideNavProps}
      path={[routes.toGitOps({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={AccountSideNavProps}
      path={[routes.toAccountResourcesGitOps({ ...accountPathProps, ...orgPathProps, ...projectPathProps })]}
      pageName={PAGE_NAME.GitOpsPage}
    >
      <GitOpsPage />
    </RouteWithLayout>
  </>
)
