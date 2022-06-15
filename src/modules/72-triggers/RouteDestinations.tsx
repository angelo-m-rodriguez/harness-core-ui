/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import { accountPathProps, pipelinePathProps, triggerPathProps } from '@common/utils/routeUtils'
import PipelineDetails from '@pipeline/pages/pipeline-details/PipelineDetails'
import TriggerDetails from '@triggers/pages/trigger-details/TriggerDetails'
import TriggersDetailPage from '@triggers/pages/triggers/TriggersDetailPage'
import TriggersPage from '@triggers/pages/triggers/TriggersPage'
import TriggersWizardPage from '@triggers/pages/triggers/TriggersWizardPage'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'

export const TriggersRouteDestinations: React.FC<{
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}> = ({ moduleParams, licenseRedirectData, sidebarProps }) => (
  <>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toTriggersPage({ ...accountPathProps, ...pipelinePathProps, ...moduleParams })}
      pageName={PAGE_NAME.TriggersPage}
    >
      <PipelineDetails>
        <TriggersPage />
      </PipelineDetails>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toTriggersDetailPage({ ...accountPathProps, ...triggerPathProps, ...moduleParams })}
      pageName={PAGE_NAME.TriggersDetailPage}
    >
      <TriggersDetailPage />
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={sidebarProps}
      path={routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...moduleParams })}
      pageName={PAGE_NAME.TriggersWizardPage}
    >
      <TriggerDetails wizard={true}>
        <TriggersWizardPage />
      </TriggerDetails>
    </RouteWithLayout>
  </>
)
