/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { GroupedMetric } from '@cv/components/MultiItemsSideNav/components/SelectedAppsSideNav/components/GroupedSideNav/GroupedSideNav.types'
import type {
  InitAppDCustomFormInterface,
  MapAppDynamicsMetric
} from '../../connectors/AppDynamics/AppDHealthSource.types'
import type {
  InitCustomHealthSourceInterface,
  MapCustomHealthToService
} from '../../connectors/CustomHealthSource/CustomHealthSource.types'
import type {
  DynatraceFormDataInterface,
  InitDynatraceCustomMetricInterface
} from '../../connectors/Dynatrace/DynatraceHealthSource.types'
import type {
  InitNewRelicCustomFormInterface,
  MapNewRelicMetric
} from '../../connectors/NewRelic/NewRelicHealthSource.types'
import type { MapPrometheusQueryToService } from '../../connectors/PrometheusHealthSource/PrometheusHealthSource.constants'
import type { MapSplunkMetricQueryToService } from '../../connectors/SplunkMetricsHealthSourceV2/SplunkMetricsHealthSource.constants'

export type CustomMappedMetric =
  | MapAppDynamicsMetric
  | MapNewRelicMetric
  | MapCustomHealthToService
  | MapPrometheusQueryToService
  | DynatraceFormDataInterface
  | MapSplunkMetricQueryToService

export type InitCustomFormData =
  | InitAppDCustomFormInterface
  | InitNewRelicCustomFormInterface
  | InitCustomHealthSourceInterface
  | InitDynatraceCustomMetricInterface
export interface GroupedCreatedMetrics {
  [Key: string]: GroupedMetric[]
}

export type CreatedMetricsWithSelectedIndex = {
  createdMetrics: string[]
  selectedMetricIndex: number
}

export type CustomSelectedAndMappedMetrics = {
  selectedMetric: string
  mappedMetrics: Map<string, CustomMappedMetric>
}

export interface CustomMetricInterface {
  children: any
  selectedMetric: string
  defaultMetricName: string
  tooptipMessage: string
  addFieldLabel: string
  createdMetrics: string[]
  isValidInput: boolean
  formikValues: CustomMappedMetric
  mappedMetrics: Map<string, CustomMappedMetric>
  initCustomForm: InitCustomFormData
  groupedCreatedMetrics?: GroupedCreatedMetrics
  shouldBeAbleToDeleteLastMetric?: boolean
  isPrimaryMetric?: boolean
  setMappedMetrics: React.Dispatch<React.SetStateAction<CustomSelectedAndMappedMetrics>>
  setCreatedMetrics: React.Dispatch<React.SetStateAction<CreatedMetricsWithSelectedIndex>>
  setGroupedCreatedMetrics: React.Dispatch<React.SetStateAction<GroupedCreatedMetrics>>
}

export interface UpdateSelectedMetricsMapInterface {
  updatedMetric: string
  oldMetric: string
  mappedMetrics: Map<string, CustomMappedMetric>
  formikValues: any
  initCustomForm: InitCustomFormData
  isPrimaryMetric?: boolean
}

export interface RemoveMetricInterface {
  removedMetric: string
  updatedMetric: string
  updatedList: string[]
  smIndex: number
  setCreatedMetrics: (value: React.SetStateAction<CreatedMetricsWithSelectedIndex>) => void
  setMappedMetrics: React.Dispatch<React.SetStateAction<CustomSelectedAndMappedMetrics>>
  formikValues: CustomMappedMetric
}

export interface SelectMetricInerface {
  newMetric: string
  updatedList: string[]
  smIndex: number
  setCreatedMetrics: (value: React.SetStateAction<CreatedMetricsWithSelectedIndex>) => void
  setMappedMetrics: React.Dispatch<React.SetStateAction<CustomSelectedAndMappedMetrics>>
  formikValues: any
  initCustomForm: InitCustomFormData
  isPrimaryMetric?: boolean
}
