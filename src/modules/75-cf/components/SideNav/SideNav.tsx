/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { ProjectSelector, ProjectSelectorProps } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { ModuleName } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useQueryParams } from '@common/hooks'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import NavExpandable from '@common/navigation/NavExpandable/NavExpandable'
import { useFeatureFlagTelemetry } from '@cf/hooks/useFeatureFlagTelemetry'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { ModuleLicenseType } from '@common/constants/SubscriptionTypes'

export default function CFSideNav(): React.ReactElement {
  const { getString } = useStrings()
  const params = useParams<PipelinePathProps>()
  const { accountId, projectIdentifier, orgIdentifier } = params
  const history = useHistory()
  const { updateAppStore } = useAppStore()
  const { withActiveEnvironment } = useActiveEnvironment()
  const { experience } = useQueryParams<{ experience?: ModuleLicenseType }>()
  const events = useFeatureFlagTelemetry()

  const { FF_GITSYNC, FF_PIPELINE, OPA_FF_GOVERNANCE, NG_TEMPLATES } = useFeatureFlags()

  /* istanbul ignore next */
  const projectSelectHandler: ProjectSelectorProps['onSelect'] = data => {
    updateAppStore({ selectedProject: data })

    if (experience) {
      // if select from trial page, forward user to get started page
      history.push({
        pathname: routes.toCFOnboarding({
          orgIdentifier: data?.orgIdentifier || '',
          projectIdentifier: data?.identifier || '',
          accountId
        })
      })
    } else {
      history.push(
        routes.toCFFeatureFlags({
          projectIdentifier: data.identifier,
          orgIdentifier: data.orgIdentifier || '',
          accountId
        })
      )
    }
  }

  return (
    <Layout.Vertical spacing="small">
      <ProjectSelector moduleFilter={ModuleName.CF} onSelect={projectSelectHandler} />
      {projectIdentifier && orgIdentifier && (
        <>
          <SidebarLink
            onClick={() => events.visitedPage()}
            label={getString('featureFlagsText')}
            to={withActiveEnvironment(routes.toCFFeatureFlags(params))}
          />
          <SidebarLink
            label={getString('cf.shared.targetManagement')}
            to={withActiveEnvironment(routes.toCFTargetManagement(params))}
          />
          <SidebarLink label={getString('environments')} to={withActiveEnvironment(routes.toCFEnvironments(params))} />

          {FF_PIPELINE && (
            <SidebarLink
              label={getString('pipelines')}
              to={withActiveEnvironment(routes.toPipelines({ ...params, module: 'cf' }))}
            />
          )}
          <SidebarLink
            label={getString('cf.shared.getStarted')}
            to={withActiveEnvironment(routes.toCFOnboarding(params))}
          />
          <NavExpandable title={getString('common.projectSetup')} route={routes.toSetup({ ...params, module: 'cf' })}>
            <Layout.Vertical spacing="small">
              <SidebarLink
                to={routes.toAccessControl({ ...params, module: 'cf' })}
                label={getString('accessControl')}
              />
              {FF_GITSYNC && (
                <>
                  <SidebarLink
                    label={getString('connectorsLabel')}
                    to={routes.toConnectors({ ...params, module: 'cf' })}
                  />
                  <SidebarLink label={getString('common.secrets')} to={routes.toSecrets({ ...params, module: 'cf' })} />
                  <SidebarLink
                    label={getString('gitManagement')}
                    to={routes.toGitSyncAdmin({ accountId, orgIdentifier, projectIdentifier, module: 'cf' })}
                  />
                </>
              )}
              {NG_TEMPLATES && (
                <SidebarLink
                  label={getString('common.templates')}
                  to={routes.toTemplates({ ...params, module: 'cf' })}
                />
              )}

              {OPA_FF_GOVERNANCE && (
                <SidebarLink
                  label={getString('common.governance')}
                  to={routes.toGovernance({ accountId, orgIdentifier, projectIdentifier, module: 'cf' })}
                />
              )}
            </Layout.Vertical>
          </NavExpandable>
        </>
      )}
    </Layout.Vertical>
  )
}
