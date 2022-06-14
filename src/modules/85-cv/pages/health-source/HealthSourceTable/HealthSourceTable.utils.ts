/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import { isEmpty } from 'lodash-es'
import type { ChangeSourceDTO, Sources } from 'services/cv'
import { Connectors } from '@connectors/constants'
import type { UseStringsReturn } from 'framework/strings'
import { HealthSourceTypes } from '../types'
import type { UpdatedHealthSource, RowData } from '../HealthSourceDrawer/HealthSourceDrawerContent.types'

export const getTypeByFeature = (feature: string, getString: UseStringsReturn['getString']): string => {
  switch (feature) {
    case Connectors.APP_DYNAMICS:
    case Connectors.GCP:
    case Connectors.NEW_RELIC:
    case Connectors.PROMETHEUS:
    case Connectors.DYNATRACE:
    case HealthSourceTypes.StackdriverMetrics:
    case HealthSourceTypes.DatadogMetrics:
      return getString('pipeline.verification.analysisTab.metrics')
    case HealthSourceTypes.StackdriverLog:
    case HealthSourceTypes.DatadogLog:
    case HealthSourceTypes.Splunk:
      return getString('pipeline.verification.analysisTab.logs')
    default:
      return getString('common.repo_provider.customLabel')
  }
}

export const getIconBySourceType = (type: string): IconName => {
  switch (type) {
    case 'KUBERNETES':
      return 'service-kubernetes'
    case 'APP_DYNAMICS':
    case 'AppDynamics':
      return 'service-appdynamics'
    case 'HARNESS_CD10':
      return 'harness'
    case 'STACKDRIVER':
      return 'service-stackdriver'
    case 'DATADOG':
      return 'service-datadog'
    case 'NEW_RELIC':
    case 'NewRelic':
      return 'service-newrelic'
    case 'HEALTH':
      return 'health'
    case 'CANARY':
      return 'canary-outline'
    case 'BLUE_GREEN':
      return 'bluegreen'
    case 'TEST':
      return 'lab-test'
    case 'PROMETHEUS':
    case 'Prometheus':
      return 'service-prometheus'
    //TODO one type will be removed once it is full deprecated from backend.
    case 'STACKDRIVER_LOG':
    case 'StackdriverLog':
    case 'Stackdriver':
      return 'service-stackdriver'
    case 'DatadogMetrics':
    case 'DatadogLog':
    case 'DATADOG_METRICS':
    case 'DATADOG_LOG':
      return 'service-datadog'
    case 'SPLUNK':
    case 'Splunk':
    case 'SplunkMetric':
      return 'service-splunk'
    case 'PagerDuty':
      return 'service-pagerduty'
    case 'CUSTOM_HEALTH_METRIC':
    case 'CUSTOM_HEALTH_LOG':
    case 'CustomHealthLog':
    case 'CustomHealthMetric':
      return 'service-custom-connector'
    case 'DYNATRACE':
    case 'Dynatrace':
      return 'service-dynatrace'
    case 'ErrorTracking':
      return 'error-tracking'
    default:
      return 'placeholder'
  }
}

export const createHealthsourceList = (
  healthSources: RowData[],
  healthSourcesPayload: UpdatedHealthSource
): UpdatedHealthSource[] => {
  let updatedHealthSources = []
  if (
    healthSources &&
    !isEmpty(healthSources) &&
    healthSources.some(
      (el: any) => el?.identifier === healthSourcesPayload?.identifier && el?.type === healthSourcesPayload?.type
    )
  ) {
    updatedHealthSources = healthSources?.map((el: any) =>
      el?.identifier === healthSourcesPayload?.identifier ? healthSourcesPayload : el
    )
  } else if (healthSources && !isEmpty(healthSources)) {
    updatedHealthSources = [...healthSources, healthSourcesPayload]
  } else {
    updatedHealthSources = [healthSourcesPayload]
  }
  return updatedHealthSources
}

export const deleteHealthSource = (
  selectedRow: RowData,
  changeSourcesData: ChangeSourceDTO[],
  tableData: RowData[]
): { monitoredService: { sources: Sources } } => {
  return {
    monitoredService: {
      sources: {
        healthSources: tableData?.filter(healthSource => healthSource.identifier !== selectedRow.identifier),
        changeSources: changeSourcesData
      }
    }
  }
}
