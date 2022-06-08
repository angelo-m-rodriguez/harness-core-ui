/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { AppDynamicsMonitoringSourceFieldNames } from '../../AppDHealthSource.constants'
import type { AppDynamicsFomikFormInterface } from '../../AppDHealthSource.types'
import type { BasePathData } from '../BasePath/BasePath.types'
import type { MetricPathData } from '../MetricPath/MetricPath.types'
import type { SetServiceInstanceInterface } from './AppDCustomMetricForm.types'

export const getBasePathValue = (basePath: BasePathData): string => {
  return basePath ? Object.values(basePath)[Object.values(basePath).length - 1]?.path : ''
}

export const getMetricPathValue = (basePath: MetricPathData): string => {
  return basePath ? Object.values(basePath)[Object.values(basePath).length - 1]?.path : ''
}

export const setServiceIntance = ({
  serviceInsanceData,
  formikValues,
  formikSetField
}: SetServiceInstanceInterface): void => {
  if (
    serviceInsanceData &&
    formikValues?.continuousVerification &&
    formikValues?.serviceInstanceMetricPath !== serviceInsanceData.data
  ) {
    formikSetField(AppDynamicsMonitoringSourceFieldNames.SERVICE_INSTANCE_METRIC_PATH, serviceInsanceData?.data)
  } else if (!formikValues?.continuousVerification && formikValues.serviceInstanceMetricPath?.length) {
    formikSetField(AppDynamicsMonitoringSourceFieldNames.SERVICE_INSTANCE_METRIC_PATH, '')
  }
}

export const checkRuntimeFields = (formikValues: AppDynamicsFomikFormInterface) =>
  getMultiTypeFromValue(formikValues?.continuousVerification) !== MultiTypeInputType.FIXED ||
  getMultiTypeFromValue(formikValues.appdApplication) !== MultiTypeInputType.FIXED ||
  getMultiTypeFromValue(formikValues.fullPath) !== MultiTypeInputType.FIXED
