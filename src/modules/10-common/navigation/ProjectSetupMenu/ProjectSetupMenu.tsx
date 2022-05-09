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
import type { GovernancePathProps, Module, PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { SidebarLink } from '../SideNav/SideNav'
import NavExpandable from '../NavExpandable/NavExpandable'

interface ProjectSetupMenuProps {
  module?: Module
}

const ProjectSetupMenu: React.FC<ProjectSetupMenuProps> = ({ module }) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<PipelineType<ProjectPathProps>>()
  const { NG_TEMPLATES, OPA_PIPELINE_GOVERNANCE, NG_VARIABLES } = useFeatureFlags()
  const params = { accountId, orgIdentifier, projectIdentifier, module }
  const isCIorCD = module === 'ci' || module === 'cd'
  const enableNGTemplates = NG_TEMPLATES && (isCIorCD || module === 'sto')
  const enableOpaGovernance = OPA_PIPELINE_GOVERNANCE && (isCIorCD || module === 'sto')
  // const isCV = module === 'cv'
  const getGitSyncEnabled = isCIorCD || module === 'sto' || !module

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
        {enableNGTemplates && <SidebarLink label={getString('common.templates')} to={routes.toTemplates(params)} />}
        {enableOpaGovernance && (
          <SidebarLink label={getString('common.governance')} to={routes.toGovernance(params as GovernancePathProps)} />
        )}
      </Layout.Vertical>
    </NavExpandable>
  )
}

export default ProjectSetupMenu
