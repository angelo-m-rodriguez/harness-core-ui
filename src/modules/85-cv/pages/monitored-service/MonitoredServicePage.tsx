/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Container, Tabs, PageError, Page, FlexExpander, Views } from '@wings-software/uicore'
import { useQueryParams } from '@common/hooks'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetMonitoredService } from 'services/cv'
import routes from '@common/RouteDefinitions'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { getCVMonitoringServicesSearchParam, getErrorMessage } from '@cv/utils/CommonUtils'
import DetailsBreadcrumb from '@cv/pages/monitored-service/views/DetailsBreadcrumb'
import DetailsHeaderTitle from '@cv/pages/monitored-service/views/DetailsHeaderTitle'
import DetailsToolbar from '@cv/pages/monitored-service/views/DetailsToolbar'
import Configurations from './components/Configurations/Configurations'
import { MonitoredServiceEnum } from './MonitoredServicePage.constants'
import ServiceHealth from './components/ServiceHealth/ServiceHealth'
import HealthScoreCard from './components/ServiceHealth/components/HealthScoreCard/HealthScoreCard'
import CVSLOsListingPage from '../slos/CVSLOsListingPage'
import { isProjectChangedOnMonitoredService } from './MonitoredServicePage.utils'
import css from './MonitoredServicePage.module.scss'

const ServiceHealthAndConfiguration: React.FC = () => {
  const history = useHistory()
  const { getString } = useStrings()
  const { tab = MonitoredServiceEnum.SLOs, view } = useQueryParams<{ tab?: MonitoredServiceEnum; view?: Views.GRID }>()
  const { orgIdentifier, projectIdentifier, accountId, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()

  const {
    data: monitoredServiceData,
    refetch,
    loading,
    error
  } = useGetMonitoredService({
    identifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { monitoredService, lastModifiedAt } = monitoredServiceData?.data ?? {}

  if (error) {
    if (isProjectChangedOnMonitoredService(error, identifier)) {
      history.push(
        routes.toCVMonitoringServices({
          projectIdentifier,
          orgIdentifier,
          accountId
        })
      )
    } else {
      return <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
    }
  }

  if (!loading && !monitoredService) {
    return <Page.NoDataCard message={getString('noData')} />
  }

  const onTabChange = (nextTab: MonitoredServiceEnum): void => {
    if (nextTab !== tab) {
      history.push({
        pathname: routes.toCVAddMonitoringServicesEdit({
          accountId,
          orgIdentifier,
          projectIdentifier,
          identifier,
          module: 'cv'
        }),
        search: getCVMonitoringServicesSearchParam({
          view,
          tab: nextTab
        })
      })
    }
  }

  const panelServiceHealth = (
    <Page.Body
      loading={loading}
      noData={{
        when: () => !monitoredService
      }}
      className={css.pageBody}
    >
      <ServiceHealth
        hasChangeSource={!!monitoredService?.sources?.changeSources?.length}
        monitoredServiceIdentifier={monitoredService?.identifier ?? ''}
        serviceIdentifier={monitoredService?.serviceRef as string}
        environmentIdentifier={monitoredService?.environmentRef as string}
      />
    </Page.Body>
  )

  const panelSLO = (
    <Page.Body
      loading={loading}
      noData={{
        when: () => !monitoredService
      }}
      className={css.pageBody}
    >
      <CVSLOsListingPage monitoredService={monitoredService} />
    </Page.Body>
  )

  const panelConfigurations = (
    <Page.Body
      loading={loading}
      noData={{
        when: () => !monitoredService
      }}
      className={css.pageBody}
    >
      <Configurations />
    </Page.Body>
  )

  return (
    <>
      <Page.Header
        size="large"
        breadcrumbs={<DetailsBreadcrumb />}
        title={<DetailsHeaderTitle loading={loading} monitoredService={monitoredService} />}
        toolbar={
          <DetailsToolbar loading={loading} monitoredService={monitoredService} lastModifiedAt={lastModifiedAt} />
        }
        className={css.header}
      />
      <Container className={css.monitoredServiceTabs}>
        <Tabs
          id="monitoredServiceTabs"
          selectedTabId={tab}
          onChange={onTabChange}
          tabList={[
            {
              id: MonitoredServiceEnum.SLOs,
              title: getString('cv.slos.title'),
              panel: panelSLO
            },
            {
              id: MonitoredServiceEnum.ServiceHealth,
              title: getString('cv.monitoredServices.monitoredServiceTabs.serviceHealth'),
              panel: panelServiceHealth
            },
            {
              id: MonitoredServiceEnum.Configurations,
              title: getString('cv.monitoredServices.monitoredServiceTabs.configurations'),
              panel: panelConfigurations
            }
          ]}
        >
          <FlexExpander />
          {tab === MonitoredServiceEnum.ServiceHealth && (
            <HealthScoreCard
              monitoredServiceIdentifier={monitoredService?.identifier}
              monitoredServiceLoading={loading}
            />
          )}
        </Tabs>
      </Container>
    </>
  )
}

const CVMonitoredServiceDetails: React.FC = () => {
  const { getString } = useStrings()

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.monitoredServices.title')])

  const { identifier } = useParams<{ identifier?: string }>()

  if (identifier) {
    return <ServiceHealthAndConfiguration />
  }

  return (
    <>
      <Page.Header
        breadcrumbs={<DetailsBreadcrumb />}
        title={getString('cv.monitoredServices.addNewMonitoredServices')}
      />
      <Configurations />
    </>
  )
}

export default CVMonitoredServiceDetails
