/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import type { FormikContextType, FormikProps } from 'formik'
import type { HealthSource } from 'services/cv'
import { useDrawer } from '@cv/hooks/useDrawerHook/useDrawerHook'
import HealthSourceTable from '@cv/pages/health-source/HealthSourceTable/HealthSourceTable'
import { createHealthsourceList } from '@cv/pages/health-source/HealthSourceTable/HealthSourceTable.utils'
import HealthSourceDrawerHeader from '@cv/pages/health-source/HealthSourceDrawer/component/HealthSourceDrawerHeader/HealthSourceDrawerHeader'
import HealthSourceDrawerContent from '@cv/pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent'
import type {
  RowData,
  UpdatedHealthSource
} from '@cv/pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent.types'

import type { MonitoredServiceForm } from '../../Service.types'
import { createOpenHealthSourceTableProps } from './HealthSourceTableContainer.utils'

export default function HealthSourceTableContainer({
  serviceFormFormik,
  healthSourceListFromAPI,
  isTemplate,
  expressions
}: {
  serviceFormFormik: FormikContextType<MonitoredServiceForm>
  healthSourceListFromAPI: HealthSource[] | undefined
  isTemplate?: boolean
  expressions?: string[]
}): JSX.Element {
  const {
    showDrawer: showHealthSourceDrawer,
    hideDrawer: hideHealthSourceDrawer,
    setDrawerHeaderProps
  } = useDrawer({
    createHeader: props => <HealthSourceDrawerHeader {...props} />,
    createDrawerContent: props => (
      <HealthSourceDrawerContent {...props} isTemplate={isTemplate} expressions={expressions} />
    )
  })

  const updateHealthSource = useCallback(
    (data: any, formik: FormikContextType<MonitoredServiceForm>): void => {
      formik.setFieldValue('sources', {
        ...formik.values?.sources,
        healthSources: data
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceFormFormik]
  )

  const onSuccessHealthSourceTableWrapper = (
    data: UpdatedHealthSource,
    formik: FormikContextType<MonitoredServiceForm>
  ): void => {
    const healthsourceList = createHealthsourceList(formik?.values?.sources?.healthSources as RowData[], data)
    updateHealthSource(healthsourceList, formik)
    hideHealthSourceDrawer()
  }

  const openHealthSourceDrawer = useCallback(
    async ({
      formik,
      isEditMode,
      rowData,
      tableData
    }: {
      formik: FormikProps<MonitoredServiceForm>
      isEditMode: boolean
      rowData: RowData | null
      tableData: HealthSource[]
    }) => {
      if (formik?.values.environmentRef && formik?.values.serviceRef && formik?.values.name) {
        const showHealthSourceDrawerProps = createOpenHealthSourceTableProps({
          formik,
          tableData,
          isEdit: isEditMode,
          rowData
        })
        let metricDetails: HealthSource | null = null
        if (isEditMode && healthSourceListFromAPI) {
          metricDetails = healthSourceListFromAPI.find(
            healthSource => healthSource.identifier === rowData?.identifier
          ) as HealthSource
        }
        setDrawerHeaderProps?.({ isEdit: isEditMode, onClick: () => hideHealthSourceDrawer() })
        showHealthSourceDrawer({
          hideDrawer: hideHealthSourceDrawer,
          ...showHealthSourceDrawerProps,
          onSuccess: (updatedHealthSource: UpdatedHealthSource) =>
            onSuccessHealthSourceTableWrapper(updatedHealthSource, formik),
          metricDetails
        })
      } else {
        formik.submitForm()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceFormFormik]
  )

  return (
    <HealthSourceTable
      onEdit={values => {
        openHealthSourceDrawer({
          formik: serviceFormFormik,
          isEditMode: true,
          rowData: values,
          tableData:
            createHealthsourceList(serviceFormFormik?.values?.sources?.healthSources as RowData[], values) || []
        })
      }}
      onAddNewHealthSource={() =>
        openHealthSourceDrawer({
          formik: serviceFormFormik,
          isEditMode: false,
          rowData: null,
          tableData: serviceFormFormik?.values?.sources?.healthSources || []
        })
      }
      value={serviceFormFormik?.values?.sources?.healthSources || []}
      onSuccess={value => updateHealthSource(value, serviceFormFormik)}
    />
  )
}
