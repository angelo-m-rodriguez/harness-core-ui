/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption, MultiSelectOption } from '@wings-software/uicore'
import { clone, isNumber } from 'lodash-es'
import type { FormikProps } from 'formik'
import type { PrometheusFilter, PrometheusHealthSourceSpec } from 'services/cv'
import type { StringsMap } from 'stringTypes'
import type { UseStringsReturn } from 'framework/strings'
import {
  CreatedMetricsWithSelectedIndex,
  PrometheusMonitoringSourceFieldNames,
  SelectedAndMappedMetrics,
  PrometheusSetupSource,
  MapSplunkMetricQueryToService
} from './SplunkMetricsHealthSource.constants'
import { HealthSourceTypes } from '../../types'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import type { CustomMappedMetric } from '../../common/CustomMetric/CustomMetric.types'

type UpdateSelectedMetricsMap = {
  updatedMetric: string
  oldMetric: string
  mappedMetrics: Map<string, MapSplunkMetricQueryToService>
  formikProps: FormikProps<MapSplunkMetricQueryToService | undefined>
}

export function updateSelectedMetricsMap({
  updatedMetric,
  oldMetric,
  mappedMetrics,
  formikProps
}: UpdateSelectedMetricsMap): SelectedAndMappedMetrics {
  const updatedMap = new Map(mappedMetrics)

  // in the case where user updates metric name, update the key for current value
  if (oldMetric !== formikProps.values?.metricName) {
    updatedMap.delete(oldMetric)
  }

  // if newly created metric create form object
  if (!updatedMap.has(updatedMetric)) {
    updatedMap.set(updatedMetric, {
      identifier: updatedMetric.split(' ').join('_'),
      metricName: updatedMetric,
      query: ''
    })
  }

  // update map with current form data
  if (formikProps.values?.metricName) {
    updatedMap.set(formikProps.values.metricName, formikProps.values as MapSplunkMetricQueryToService)
  }
  return { selectedMetric: updatedMetric, mappedMetrics: updatedMap }
}

export function initializeSelectedMetricsMap(
  defaultSelectedMetricName: string,
  mappedServicesAndEnvs?: Map<string, MapSplunkMetricQueryToService>
): SelectedAndMappedMetrics {
  return {
    selectedMetric: (Array.from(mappedServicesAndEnvs?.keys() || [])?.[0] as string) || defaultSelectedMetricName,
    mappedMetrics:
      mappedServicesAndEnvs ||
      new Map([
        [
          defaultSelectedMetricName,
          { metricName: defaultSelectedMetricName, isManualQuery: false, query: '', identifier: '' }
        ]
      ])
  }
}

export function initializeCreatedMetrics(
  defaultSelectedMetricName: string,
  selectedMetric: string,
  mappedMetrics: SelectedAndMappedMetrics['mappedMetrics']
): CreatedMetricsWithSelectedIndex {
  return {
    createdMetrics: Array.from(mappedMetrics.keys()) || [defaultSelectedMetricName],
    selectedMetricIndex: Array.from(mappedMetrics.keys()).findIndex(metric => metric === selectedMetric)
  }
}

export function validateMappings(
  getString: UseStringsReturn['getString'],
  createdMetrics: string[],
  selectedMetricIndex: number,
  values?: MapSplunkMetricQueryToService,
  mappedMetrics?: Map<string, CustomMappedMetric>
): { [fieldName: string]: string } {
  let requiredFieldErrors = {
    [PrometheusMonitoringSourceFieldNames.METRIC_NAME]: getString('cv.monitoringSources.metricNameValidation'),
    [PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER]: getString('validation.identifierRequired'),
    [PrometheusMonitoringSourceFieldNames.GROUP_NAME]: getString(
      'cv.monitoringSources.prometheus.validation.groupName'
    ),
    [PrometheusMonitoringSourceFieldNames.QUERY]: getString(
      'cv.monitoringSources.gco.manualInputQueryModal.validation.query'
    )
  }

  if (!values) {
    return requiredFieldErrors
  }

  for (const fieldName of Object.keys(requiredFieldErrors)) {
    if ((values as any)[fieldName]) {
      delete requiredFieldErrors[fieldName]
    }
  }

  requiredFieldErrors = validateGroupName(requiredFieldErrors, getString, values.groupName)
  const duplicateNames = createdMetrics?.filter((metricName, index) => {
    if (index === selectedMetricIndex) {
      return false
    }
    return metricName === values.metricName
  })

  const identifiers = createdMetrics.map(metricName => {
    const metricData = mappedMetrics?.get(metricName) as MapSplunkMetricQueryToService
    return metricData?.identifier
  })

  const duplicateIdentifier = identifiers?.filter((identifier, index) => {
    if (index === selectedMetricIndex) {
      return false
    }
    return identifier === values.identifier
  })

  if (values.identifier && duplicateIdentifier.length) {
    requiredFieldErrors[PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER] = getString(
      'cv.monitoringSources.prometheus.validation.metricIdentifierUnique'
    )
  }

  if (values.metricName && duplicateNames.length) {
    requiredFieldErrors[PrometheusMonitoringSourceFieldNames.METRIC_NAME] = getString(
      'cv.monitoringSources.prometheus.validation.metricNameUnique'
    )
  }

  if (
    !requiredFieldErrors[PrometheusMonitoringSourceFieldNames.QUERY] &&
    isNumber(values.recordCount) &&
    values.recordCount > 1
  ) {
    requiredFieldErrors[PrometheusMonitoringSourceFieldNames.QUERY] = getString(
      'cv.monitoringSources.prometheus.validation.recordCount'
    )
  }

  return { ...requiredFieldErrors }
}

const validateGroupName = (
  requiredFieldErrors: { [x: string]: string },
  getString: UseStringsReturn['getString'],
  groupName?: SelectOption
): { [x: string]: string } => {
  const _requiredFieldErrors = clone(requiredFieldErrors)
  if (!groupName || (!groupName?.label && !groupName?.value)) {
    _requiredFieldErrors[PrometheusMonitoringSourceFieldNames.GROUP_NAME] = getString(
      'cv.monitoringSources.prometheus.validation.groupName'
    )
  }
  return _requiredFieldErrors
}

export function initializePrometheusGroupNames(
  mappedMetrics: Map<string, MapSplunkMetricQueryToService>,
  getString: UseStringsReturn['getString']
): SelectOption[] {
  const groupNames = Array.from(mappedMetrics?.entries())
    .map(metric => {
      const { groupName } = metric?.[1] || {}
      return groupName || null
    })
    .filter(groupItem => groupItem !== null) as SelectOption[]
  return [{ label: getString('cv.addNew'), value: '' }, ...groupNames]
}

export function transformLabelToPrometheusFilter(options?: MultiSelectOption[]): PrometheusFilter[] {
  const filters: PrometheusFilter[] = []
  if (!options?.length) {
    return filters
  }

  options.forEach(option => {
    const labelValue = option.label.split(':')
    filters.push({ labelName: labelValue[0], labelValue: labelValue[1] || labelValue[0] })
  })

  return filters
}

export function transformPrometheusHealthSourceToSetupSource(
  sourceData: any,
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string
): PrometheusSetupSource {
  const healthSource: UpdatedHealthSource = sourceData?.healthSourceList?.find(
    (source: UpdatedHealthSource) => source.name === sourceData.healthSourceName
  )

  if (!healthSource) {
    return {
      isEdit: false,
      healthSourceIdentifier: sourceData.healthSourceIdentifier,
      mappedServicesAndEnvs: new Map([
        [
          getString('cv.monitoringSources.splunk.defaultSplunkMetricName'),
          {
            metricName: getString('cv.monitoringSources.splunk.defaultSplunkMetricName'),
            isManualQuery: false,
            query: '',
            identifier: 'splunk_metric'
          }
        ]
      ]),
      healthSourceName: sourceData.healthSourceName,
      connectorRef: sourceData.connectorRef,
      product: sourceData.product
    }
  }

  const setupSource: PrometheusSetupSource = {
    isEdit: sourceData.isEdit,
    mappedServicesAndEnvs: new Map(),
    healthSourceIdentifier: sourceData.healthSourceIdentifier,
    healthSourceName: sourceData.healthSourceName,
    product: sourceData.product,
    connectorRef: sourceData.connectorRef
  }

  for (const metricDefinition of (healthSource?.spec as PrometheusHealthSourceSpec)?.metricDefinitions || []) {
    if (metricDefinition?.metricName) {
      setupSource.mappedServicesAndEnvs.set(metricDefinition.metricName, {
        identifier: metricDefinition.identifier,
        metricName: metricDefinition.metricName,
        query: metricDefinition.query || '',
        groupName: { label: metricDefinition.groupName || '', value: metricDefinition.groupName || '' },
        sli: metricDefinition.sli?.enabled
      })
    }
  }

  return setupSource
}

export function transformPrometheusSetupSourceToHealthSource(setupSource: PrometheusSetupSource): UpdatedHealthSource {
  const dsConfig: UpdatedHealthSource = {
    type: HealthSourceTypes.SplunkMetric,
    identifier: setupSource.healthSourceIdentifier,
    name: setupSource.healthSourceName,
    spec: {
      connectorRef: setupSource?.connectorRef,
      feature: setupSource.product.value as string,
      metricDefinitions: []
    }
  }

  for (const entry of setupSource.mappedServicesAndEnvs.entries()) {
    const { metricName, identifier, groupName, query, sli }: MapSplunkMetricQueryToService = entry[1]

    ;(dsConfig.spec as any).metricDefinitions.push({
      identifier,
      groupName: groupName?.value as string,
      metricName,
      query,
      sli: { enabled: Boolean(sli) }
    })
  }

  return dsConfig
}
