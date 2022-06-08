/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, PageSpinner } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import { ServiceDetailsHeader } from '@cd/components/ServiceDetails/ServiceDetailsHeader/ServiceDetailsHeader'
import { ServiceResponseDTO, useGetServiceV2 } from 'services/cd-ng'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { ServiceContextProvider } from '@cd/context/ServiceContext'
import ServiceDetailsSummary from '@cd/components/ServiceDetails/ServiceDetailsContent/ServiceDetailsSummary'
import EntitySetupUsage from '@common/pages/entityUsage/EntityUsage'
import ServiceConfigurationWrapper from './ServiceConfigWrapper/ServiceConfigWrapper'

function ServiceStudio(): React.ReactElement | null {
  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()

  const { data: serviceResponse, loading: serviceDataLoading } = useGetServiceV2({
    serviceIdentifier: serviceId,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  if (serviceDataLoading) {
    return <PageSpinner />
  }
  return (
    <Layout.Vertical>
      <ServiceDetailsHeader />
      <ServiceContextProvider
        serviceResponse={serviceResponse?.data?.service as ServiceResponseDTO}
        isServiceEntityModalView={false}
        onCloseModal={noop}
        onServiceCreate={noop}
        isServiceEntityPage={true}
        isServiceCreateModalView={false}
      >
        <ServiceConfigurationWrapper
          summaryPanel={<ServiceDetailsSummary />}
          refercedByPanel={<EntitySetupUsage entityType="Service" entityIdentifier={serviceId} />}
        />
      </ServiceContextProvider>
    </Layout.Vertical>
  )
}

export default ServiceStudio
