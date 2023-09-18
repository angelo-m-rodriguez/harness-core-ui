/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Page, TabNavigation } from '@harness/uicore'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useStrings } from 'framework/strings'
import ScopedTitle from '@common/components/Title/ScopedTitle'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'

const CETSettings: React.FC = ({ children }) => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  interface SettingsLink {
    label: string
    to: string
  }

  const settingsLinks: SettingsLink[] = [
    {
      label: 'Agents',
      to: routes.toCETAgents({ accountId, orgIdentifier, projectIdentifier })
    },
    {
      label: 'Tokens',
      to: routes.toCETAgentsTokens({ accountId, orgIdentifier, projectIdentifier })
    }
  ]

  settingsLinks.push({
    label: 'Critical Events',
    to: routes.toCETCriticalEvents({ accountId, orgIdentifier, projectIdentifier })
  })

  const navigationTabs = !useFeatureFlag(FeatureFlag.CDS_NAV_2_0) ? (
    <TabNavigation size={'small'} links={settingsLinks.map(link => ({ label: link.label, to: link.to }))} />
  ) : undefined

  useDocumentTitle(['ET', getString('common.codeErrorsSettings')])

  return (
    <>
      <Page.Header
        breadcrumbs={<NGBreadcrumbs />}
        title={<ScopedTitle title={getString('common.codeErrorsSettings')} />}
        toolbar={navigationTabs}
      />
      <Page.Body>{children}</Page.Body>
    </>
  )
}

export default CETSettings
