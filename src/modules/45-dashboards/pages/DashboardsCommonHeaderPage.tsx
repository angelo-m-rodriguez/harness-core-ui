/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'

import { Layout, Button } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { NavLink, useParams } from 'react-router-dom'
import { Page } from '@common/exports'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import routes from '@common/RouteDefinitions'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useStrings } from 'framework/strings'
import { GetStarted } from './home/GetStarted'
import { useDashboardsContext } from './DashboardsContext'
import css from './home/HomePage.module.scss'

const DashboardsHeader: React.FC = () => {
  const { getString } = useStrings()
  const { breadcrumbs } = useDashboardsContext()
  const { updateTitle } = useDocumentTitle(getString('common.dashboards'), true)
  const { accountId, folderId } = useParams<{ accountId: string; folderId: string }>()
  const [isOpen, setDrawerOpen] = useState(false)

  const title = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1].label : getString('common.dashboards')

  React.useEffect(() => {
    const titleArray: string[] = [getString('common.dashboards')]

    if (breadcrumbs) breadcrumbs.map(breadcrumb => titleArray.push(breadcrumb.label))

    updateTitle(titleArray)
  }, [breadcrumbs])

  return (
    <Page.Header
      title={title}
      breadcrumbs={<NGBreadcrumbs links={breadcrumbs} />}
      content={
        <Layout.Horizontal spacing="medium">
          <NavLink
            className={css.tags}
            activeClassName={css.activeTag}
            to={routes.toCustomDashboardHome({ accountId, folderId })}
          >
            {getString('common.dashboards')}
          </NavLink>
          <NavLink className={css.tags} activeClassName={css.activeTag} to={routes.toCustomFolderHome({ accountId })}>
            {getString('dashboards.homePage.folders')}
          </NavLink>
        </Layout.Horizontal>
      }
      toolbar={
        <>
          <Button
            minimal
            color={Color.PRIMARY_6}
            icon="question"
            onClick={() => setDrawerOpen(true)}
            text={getString('getStarted')}
          />
          <GetStarted isOpen={isOpen} setDrawerOpen={(val: boolean) => setDrawerOpen(val)} />
        </>
      }
    />
  )
}

export default DashboardsHeader
