/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'

export const PrometheusMonitoringSourceFieldNames = {
  METRIC_IDENTIFIER: 'identifier',
  METRIC_NAME: 'metricName',
  PROMETHEUS_METRIC: 'prometheusMetric',
  SERVICE_FILTER: 'serviceFilter',
  RISK_CATEGORY: 'riskCategory',
  RECORD_COUNT: 'recordCount',
  QUERY: 'query',
  ENVIRONMENT_FILTER: 'envFilter',
  ADDITIONAL_FILTER: 'additionalFilter',
  HIGHER_BASELINE_DEVIATION: 'higherBaselineDeviation',
  LOWER_BASELINE_DEVIATION: 'lowerBaselineDeviation',
  AGGREGATOR: 'aggregator',
  SERVICE_INSTANCE: 'serviceInstance',
  GROUP_NAME: 'groupName',
  IS_MANUAL_QUERY: 'isManualQuery',
  CONTINUOUS_VERIFICATION: 'continuousVerification',
  HEALTH_SCORE: 'healthScore',
  SLI: 'sli'
}

export interface PrometheusSetupSource {
  isEdit: boolean
  mappedServicesAndEnvs: Map<string, MapSplunkMetricQueryToService> // metricName to MapPrometheusQueryToService
  healthSourceIdentifier: string
  healthSourceName: string
  product: SelectOption
  connectorRef?: string
}

export type MapSplunkMetricQueryToService = {
  identifier: string
  metricName: string
  query: string
  recordCount?: number
  groupName?: SelectOption
  sli?: boolean
}

export type RiskProfileCatgory = 'Performance' | 'Errors' | 'Infrastructure'
export type PrometheusFilter = { labelName: string; labelValue: string }

export type SelectedAndMappedMetrics = {
  selectedMetric: string
  mappedMetrics: Map<string, MapSplunkMetricQueryToService>
}

export type CreatedMetricsWithSelectedIndex = {
  createdMetrics: string[]
  selectedMetricIndex: number
}

export const SPLUNK_METRIC = 'SplunkMetric'

export const PrometheusProductNames = {
  APM: 'apm'
}
