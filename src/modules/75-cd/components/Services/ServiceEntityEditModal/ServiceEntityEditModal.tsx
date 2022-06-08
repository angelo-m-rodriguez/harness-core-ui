/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { PageSpinner } from '@harness/uicore'
import type { ServiceResponseDTO, ServiceYaml } from 'services/cd-ng'
import ServiceConfigurationWrapper from '@cd/components/Services/ServiceStudio/ServiceConfigWrapper/ServiceConfigWrapper'
import { ServiceContextProvider } from '@cd/context/ServiceContext'

interface ServiceEntityEditModalProps {
  onCloseModal: () => void
  onServiceCreate: (val: ServiceYaml) => void
  isServiceCreateModalView: boolean
  serviceResponse?: ServiceResponseDTO
  isLoading?: boolean
}
function ServiceEntityEditModal({
  isServiceCreateModalView,
  onServiceCreate,
  onCloseModal,
  serviceResponse,
  isLoading
}: ServiceEntityEditModalProps): React.ReactElement {
  if (isLoading) {
    return (
      <React.Fragment>
        <PageSpinner fixed />
        <div /> {/* this empty div is required for rendering layout correctly */}
      </React.Fragment>
    )
  }
  return (
    <ServiceContextProvider
      serviceResponse={isServiceCreateModalView ? {} : (serviceResponse as ServiceResponseDTO)}
      isServiceEntityModalView={true}
      onCloseModal={onCloseModal}
      onServiceCreate={onServiceCreate}
      isServiceEntityPage={true}
      isServiceCreateModalView={isServiceCreateModalView}
    >
      <ServiceConfigurationWrapper />
    </ServiceContextProvider>
  )
}

export default ServiceEntityEditModal
