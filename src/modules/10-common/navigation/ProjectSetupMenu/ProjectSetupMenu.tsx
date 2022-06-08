/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import routes from '@common/RouteDefinitions'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useHostedBuilds } from '@common/hooks/useHostedBuild'
import type { GovernancePathProps, Module, PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useAnyEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { useSideNavContext } from 'framework/SideNavStore/SideNavContext'
import { SidebarLink } from '../SideNav/SideNav'
import NavExpandable from '../NavExpandable/NavExpandable'

interface ProjectSetupMenuProps {
  module?: Module
}

const ProjectSetupMenu: React.FC<ProjectSetupMenuProps> = ({ module }) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<PipelineType<ProjectPathProps>>()
  const { NG_TEMPLATES, OPA_PIPELINE_GOVERNANCE, NG_VARIABLES, NG_GIT_EXPERIENCE } = useFeatureFlags()
  const { showGetStartedTabInMainMenu } = useSideNavContext()
  const { enabledHostedBuildsForFreeUsers } = useHostedBuilds()
  const params = { accountId, orgIdentifier, projectIdentifier, module }
  const isCIorCD = module === 'ci' || module === 'cd'
  // const isCV = module === 'cv'
  const canUsePolicyEngine = useAnyEnterpriseLicense()
  const getGitSyncEnabled = (isCIorCD || !module) && !NG_GIT_EXPERIENCE

  return (
    <NavExpandable title={getString('common.projectSetup')} route={routes.toSetup(params)}>
      <Layout.Vertical spacing="small">
        <SidebarLink label={getString('connectorsLabel')} to={routes.toConnectors(params)} />
        <SidebarLink label={getString('common.secrets')} to={routes.toSecrets(params)} />
        {NG_VARIABLES && <SidebarLink label={getString('common.variables')} to={routes.toVariables(params)} />}
        <SidebarLink to={routes.toAccessControl(params)} label={getString('accessControl')} />
        <SidebarLink label={getString('delegate.delegates')} to={routes.toDelegates(params)} />
        {getGitSyncEnabled ? (
          <SidebarLink
            label={getString('gitManagement')}
            to={routes.toGitSyncAdmin({ accountId, orgIdentifier, projectIdentifier, module })}
          />
        ) : null}
        {/* 
         To enable templates for CV
         Replace isCIorCD with (isCIorCD || isCV) 
         */}
        {NG_TEMPLATES && isCIorCD && (
          <SidebarLink label={getString('common.templates')} to={routes.toTemplates(params)} />
        )}
        {OPA_PIPELINE_GOVERNANCE && isCIorCD && canUsePolicyEngine && (
          <SidebarLink label={getString('common.governance')} to={routes.toGovernance(params as GovernancePathProps)} />
        )}
        {enabledHostedBuildsForFreeUsers && !showGetStartedTabInMainMenu && module === 'ci' && (
          <SidebarLink label={getString('getStarted')} to={routes.toGetStartedWithCI({ ...params, module })} />
        )}
      </Layout.Vertical>
    </NavExpandable>
  )
}

export default ProjectSetupMenu
