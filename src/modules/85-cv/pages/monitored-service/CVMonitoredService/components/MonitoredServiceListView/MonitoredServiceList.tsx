/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { Page, useToaster } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { useListMonitoredService, useSetHealthMonitoringFlag, useDeleteMonitoredService } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import noServiceAvailableImage from '@cv/assets/noMonitoredServices.svg'
import { getErrorMessage, getCVMonitoringServicesSearchParam } from '@cv/utils/CommonUtils'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import MonitoredServiceListView from './MonitoredServiceListView'
import { FilterTypes, MonitoredServiceListProps } from '../../CVMonitoredService.types'
import css from '../../CVMonitoredService.module.scss'

const MonitoredServiceList: React.FC<MonitoredServiceListProps> = ({
  page,
  setPage,
  createButton,
  environmentIdentifier,
  selectedFilter,
  onFilter,
  serviceCountData,
  serviceCountLoading,
  serviceCountErrorMessage,
  refetchServiceCountData
}) => {
  const history = useHistory()
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const pathParams = {
    accountId,
    orgIdentifier,
    projectIdentifier
  }

  const {
    data: monitoredServiceListData,
    loading: monitoredServiceListLoading,
    refetch: refetchMonitoredServiceList,
    error: monitoredServiceListError
  } = useListMonitoredService({
    queryParams: {
      offset: page,
      pageSize: 10,
      ...pathParams,
      environmentIdentifier,
      servicesAtRiskFilter: selectedFilter === FilterTypes.RISK
    }
  })

  const { mutate: setHealthMonitoringFlag, loading: healthMonitoringFlagLoading } = useSetHealthMonitoringFlag({
    identifier: ''
  })

  const onToggleService = async (identifier: string, checked: boolean): Promise<void> => {
    try {
      const response = await setHealthMonitoringFlag(undefined, {
        pathParams: {
          identifier
        },
        queryParams: {
          enable: checked,
          ...pathParams
        }
      })

      await Promise.all([refetchServiceCountData(), refetchMonitoredServiceList()])

      showSuccess(
        getString('cv.monitoredServices.monitoredServiceToggle', {
          enabled: response.resource?.healthMonitoringEnabled ? 'enabled' : 'disabled'
        })
      )
    } catch (e) {
      showError(getErrorMessage(e))
    }
  }

  const { mutate: deleteMonitoredService, loading: deleteMonitoredServiceLoading } = useDeleteMonitoredService({
    queryParams: pathParams
  })

  const onDeleteService = async (identifier: string): Promise<void> => {
    try {
      await deleteMonitoredService(identifier)

      const { pageIndex = 0, pageItemCount } = defaultTo(monitoredServiceListData?.data, {})

      if (pageIndex && pageItemCount === 1) {
        setPage(page - 1)
        await refetchServiceCountData()
      } else {
        await Promise.all([refetchServiceCountData(), refetchMonitoredServiceList()])
      }

      showSuccess(getString('cv.monitoredServices.monitoredServiceDeleted'))
    } catch (e) {
      showError(getErrorMessage(e))
    }
  }

  const onEditService = (identifier: string): void => {
    history.push({
      pathname: routes.toCVAddMonitoringServicesEdit({
        ...pathParams,
        identifier,
        module: 'cv'
      }),
      search: getCVMonitoringServicesSearchParam({ tab: MonitoredServiceEnum.Configurations })
    })
  }

  return (
    <Page.Body
      loading={
        serviceCountLoading ||
        monitoredServiceListLoading ||
        deleteMonitoredServiceLoading ||
        healthMonitoringFlagLoading
      }
      error={serviceCountErrorMessage || getErrorMessage(monitoredServiceListError)}
      retryOnError={() => {
        if (serviceCountErrorMessage) {
          refetchServiceCountData()
        }
        if (monitoredServiceListError) {
          refetchMonitoredServiceList()
        }
      }}
      noData={{
        when: () => !serviceCountData?.allServicesCount,
        image: noServiceAvailableImage,
        imageClassName: css.noServiceAvailableImage,
        message: getString('cv.monitoredServices.youHaveNoMonitoredServices'),
        button: createButton
      }}
      className={css.pageBody}
    >
      <MonitoredServiceListView
        serviceCountData={serviceCountData}
        refetchServiceCountData={refetchServiceCountData}
        monitoredServiceListData={monitoredServiceListData?.data}
        selectedFilter={selectedFilter}
        onFilter={onFilter}
        onEditService={onEditService}
        onDeleteService={onDeleteService}
        setPage={setPage}
        onToggleService={onToggleService}
        healthMonitoringFlagLoading={healthMonitoringFlagLoading}
      />
    </Page.Body>
  )
}

export default MonitoredServiceList
