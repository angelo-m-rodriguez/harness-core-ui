/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Container, FlexExpander, Page, Tabs } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useDeleteSLOData, useGetSLODetails, useResetErrorBudget } from 'services/cv'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { getErrorMessage, getSearchString } from '@cv/utils/CommonUtils'
import CVCreateSLO from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO'
import HeaderTitle from './views/HeaderTitle'
import HeaderToolbar from './views/HeaderToolbar'
import DetailsPanel from './DetailsPanel/DetailsPanel'
import TabToolbar from './DetailsPanel/views/TabToolbar'
import { SLODetailsPageTabIds } from './CVSLODetailsPage.types'
import css from './CVSLODetailsPage.module.scss'

const CVSLODetailsPage: React.FC = () => {
  const history = useHistory()
  const { getString } = useStrings()

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.slos.title')])

  const { accountId, orgIdentifier, projectIdentifier, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()
  const { tab = SLODetailsPageTabIds.Details, monitoredServiceIdentifier } =
    useQueryParams<{ tab?: SLODetailsPageTabIds; monitoredServiceIdentifier?: string }>()

  const projectIdentifierRef = useRef<string>()
  useEffect(() => {
    if (projectIdentifierRef.current && projectIdentifierRef.current !== projectIdentifier) {
      history.push(routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier }))
      return
    }

    projectIdentifierRef.current = projectIdentifier
  }, [accountId, orgIdentifier, projectIdentifier, history])

  const {
    data,
    loading: sloDetailsLoading,
    error,
    refetch
  } = useGetSLODetails({
    identifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { mutate: resetErrorBudget, loading: resetErrorBudgetLoading } = useResetErrorBudget({
    identifier: '',
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { mutate: deleteSLO, loading: deleteSLOLoading } = useDeleteSLOData({
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const onTabChange = (nextTab: SLODetailsPageTabIds): void => {
    /* istanbul ignore else */ if (nextTab !== tab) {
      history.push({
        pathname: routes.toCVSLODetailsPage({
          identifier,
          accountId,
          orgIdentifier,
          projectIdentifier
        }),
        search: getSearchString({ tab: nextTab, monitoredServiceIdentifier })
      })
    }
  }

  const { description, createdAt, lastModifiedAt, sloDashboardWidget, timeRangeFilters } = data?.data ?? {}
  const loading = sloDetailsLoading || resetErrorBudgetLoading || deleteSLOLoading

  const breadcrumbLinks = [
    {
      url: routes.toCVSLOs({ accountId, orgIdentifier, projectIdentifier }),
      label: getString('cv.SLO')
    }
  ]

  return (
    <>
      <Page.Header
        size="large"
        title={<HeaderTitle loading={sloDetailsLoading} title={sloDashboardWidget?.title} description={description} />}
        toolbar={<HeaderToolbar loading={sloDetailsLoading} createdAt={createdAt} lastModifiedAt={lastModifiedAt} />}
        breadcrumbs={<NGBreadcrumbs links={breadcrumbLinks} />}
      />
      <Container className={css.tabContainer}>
        <Tabs
          id="slo-details-page-tabs"
          selectedTabId={tab}
          onChange={onTabChange}
          tabList={[
            {
              id: SLODetailsPageTabIds.Details,
              title: getString('details'),
              panel: (
                <DetailsPanel
                  loading={loading}
                  errorMessage={getErrorMessage(error)}
                  retryOnError={() => refetch()}
                  sloDashboardWidget={sloDashboardWidget}
                  timeRangeFilters={timeRangeFilters}
                />
              )
            },
            {
              id: SLODetailsPageTabIds.Configurations,
              title: getString('cv.monitoredServices.monitoredServiceTabs.configurations'),
              panel: (
                <Page.Body
                  loading={loading}
                  error={getErrorMessage(error)}
                  retryOnError={() => refetch()}
                  noData={{
                    when: () => !sloDashboardWidget
                  }}
                  className={css.pageBody}
                >
                  <CVCreateSLO />
                </Page.Body>
              )
            }
          ]}
        >
          <FlexExpander />
          {tab === SLODetailsPageTabIds.Details && sloDashboardWidget && (
            <TabToolbar
              sloDashboardWidget={sloDashboardWidget}
              resetErrorBudget={resetErrorBudget}
              deleteSLO={deleteSLO}
              refetchSLODetails={refetch}
              onTabChange={onTabChange}
            />
          )}
        </Tabs>
      </Container>
    </>
  )
}

export default CVSLODetailsPage
