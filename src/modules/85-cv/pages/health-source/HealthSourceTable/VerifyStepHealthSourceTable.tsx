/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useConfirmationDialog } from '@harness/uicore'
import {
  ChangeSourceDTO,
  HealthSource,
  MonitoredServiceDTO,
  MonitoredServiceResponse,
  useUpdateMonitoredService
} from 'services/cv'
import { useStrings } from 'framework/strings'
import { useDrawer } from '@cv/hooks/useDrawerHook/useDrawerHook'
import { useToaster } from '@common/exports'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import HealthSourceTable from './HealthSourceTable'
import HealthSourceDrawerHeader from '../HealthSourceDrawer/component/HealthSourceDrawerHeader/HealthSourceDrawerHeader'
import HealthSourceDrawerContent from '../HealthSourceDrawer/HealthSourceDrawerContent'
import type { RowData } from '../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { createHealthsourceList } from './HealthSourceTable.utils'
import { deleteHealthSourceVerifyStep } from './VerifyStepHealthSourceTable.utils'

interface VerifyStepHealthSourceTableInterface {
  serviceIdentifier: string
  envIdentifier: string
  healthSourcesList: RowData[]
  monitoredServiceRef: { identifier: string; name: string }
  monitoredServiceData?: MonitoredServiceDTO
  onSuccess: (data: any) => void
  isRunTimeInput: boolean
  changeSourcesList: ChangeSourceDTO[]
}

export default function VerifyStepHealthSourceTable(tableProps: VerifyStepHealthSourceTableInterface): JSX.Element {
  const { getString } = useStrings()
  const { accountId } = useParams<ProjectPathProps & { identifier: string }>()
  const { showError, showSuccess } = useToaster()
  const [rowToDelete, setRowToDelete] = useState<HealthSource>()
  const {
    serviceIdentifier,
    envIdentifier,
    healthSourcesList,
    changeSourcesList,
    monitoredServiceRef,
    monitoredServiceData,
    isRunTimeInput,
    onSuccess
  } = tableProps

  const { openDialog } = useConfirmationDialog({
    titleText: getString('cv.healthSource.deleteHealthSource'),
    contentText: getString('cv.healthSource.deleteHealthSourceWarning') + `: ${rowToDelete?.identifier}`,
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    onCloseDialog: function (shouldDelete: boolean) {
      if (shouldDelete) {
        handleOnDeleteHealthSource()
      }
    }
  })

  const { mutate: updateMonitoredService, loading } = useUpdateMonitoredService({
    identifier: monitoredServiceRef?.identifier,
    queryParams: { accountId: accountId }
  })

  const {
    showDrawer: showHealthSourceDrawer,
    hideDrawer: hideHealthSourceDrawer,
    setDrawerHeaderProps
  } = useDrawer({
    createHeader: props => <HealthSourceDrawerHeader {...props} />,
    createDrawerContent: props => <HealthSourceDrawerContent {...props} />
  })

  const healthSourceDrawerHeaderProps = useCallback(
    (isEdit = false) => {
      return {
        isEdit,
        shouldRenderAtVerifyStep: true,
        onClick: () => hideHealthSourceDrawer(),
        breadCrumbRoute: { routeTitle: getString('connectors.cdng.runTimeMonitoredService.backToRunPipeline') }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceIdentifier, envIdentifier, healthSourcesList, monitoredServiceRef, isRunTimeInput]
  )

  const getHealthSourceDrawerProps = useCallback(
    (values?: any) => {
      return {
        isRunTimeInput,
        shouldRenderAtVerifyStep: true,
        serviceRef: serviceIdentifier,
        environmentRef: envIdentifier,
        monitoredServiceRef: monitoredServiceRef,
        rowData: values,
        tableData: values ? createHealthsourceList(healthSourcesList, values) : healthSourcesList,
        changeSources: changeSourcesList,
        onSuccess: (data: MonitoredServiceResponse) => {
          onSuccess(data)
          hideHealthSourceDrawer()
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      serviceIdentifier,
      envIdentifier,
      healthSourcesList,
      monitoredServiceRef.name,
      monitoredServiceRef.identifier,
      isRunTimeInput
    ]
  )

  const onEdit = useCallback(
    values => {
      const drawerProps = getHealthSourceDrawerProps(values)
      showHealthSourceDrawer(drawerProps)
      setDrawerHeaderProps?.(healthSourceDrawerHeaderProps(true))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      serviceIdentifier,
      envIdentifier,
      healthSourcesList,
      monitoredServiceRef.identifier,
      monitoredServiceRef.name,
      isRunTimeInput
    ]
  )

  const handleOnDeleteHealthSource = useCallback(async () => {
    const updatedMonitoredServicePayload = deleteHealthSourceVerifyStep(
      healthSourcesList,
      monitoredServiceData as MonitoredServiceDTO,
      rowToDelete
    )
    try {
      const updatedMonitoredService = await updateMonitoredService(updatedMonitoredServicePayload)
      onSuccess(updatedMonitoredService?.resource)
      showSuccess(getString('cv.monitoredServices.monitoredServiceUpdated'))
    } catch (error) {
      showError(getErrorMessage(error))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthSourcesList, monitoredServiceData, rowToDelete])

  const onAddNewHealthSource = useCallback(() => {
    const drawerProps = getHealthSourceDrawerProps()
    showHealthSourceDrawer(drawerProps)
    setDrawerHeaderProps?.(healthSourceDrawerHeaderProps())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serviceIdentifier,
    envIdentifier,
    healthSourcesList,
    monitoredServiceRef.identifier,
    monitoredServiceRef.name,
    isRunTimeInput
  ])

  if (loading) {
    return <ContainerSpinner />
  }
  return (
    <>
      <HealthSourceTable
        onEdit={onEdit}
        onDeleteHealthSourceVerifyStep={selectedRow => {
          setRowToDelete(selectedRow)
          openDialog()
        }}
        isRunTimeInput={isRunTimeInput}
        onAddNewHealthSource={onAddNewHealthSource}
        value={healthSourcesList as HealthSource[]}
        shouldRenderAtVerifyStep
        onSuccess={(data: any) => {
          onSuccess(data)
          hideHealthSourceDrawer()
        }}
      />
    </>
  )
}
