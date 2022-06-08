/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption } from '@harness/uicore'
import type { AnomalyFilterProperties } from 'services/ce'
import type { AnomaliesFilterFormType } from './FilterDrawer'

const getMultiSelectOptions = (values: string[]): MultiSelectOption[] =>
  values.map(item => ({ label: item, value: item }))

const getValueFromOption = (values: MultiSelectOption[]): string[] => values.map(item => item.value.toString())

export const getAnomalyFormValuesFromFilterProperties = (
  filterProperties: AnomalyFilterProperties
): AnomaliesFilterFormType => {
  const formValues: AnomaliesFilterFormType = {}

  const {
    awsAccounts,
    awsServices,
    awsUsageTypes,
    gcpProducts,
    gcpProjects,
    gcpSKUDescriptions,
    k8sClusterNames,
    k8sNamespaces,
    k8sWorkloadNames,
    minActualAmount,
    minAnomalousSpend
  } = filterProperties

  if (awsAccounts) {
    formValues.awsAccounts = getMultiSelectOptions(awsAccounts)
  }
  if (awsServices) {
    formValues.awsServices = getMultiSelectOptions(awsServices)
  }
  if (awsUsageTypes) {
    formValues.awsUsageTypes = getMultiSelectOptions(awsUsageTypes)
  }
  if (gcpProducts) {
    formValues.gcpProducts = getMultiSelectOptions(gcpProducts)
  }
  if (gcpProjects) {
    formValues.gcpProjects = getMultiSelectOptions(gcpProjects)
  }
  if (gcpSKUDescriptions) {
    formValues.gcpSKUDescriptions = getMultiSelectOptions(gcpSKUDescriptions)
  }
  if (k8sClusterNames) {
    formValues.k8sClusterNames = getMultiSelectOptions(k8sClusterNames)
  }
  if (k8sNamespaces) {
    formValues.k8sNamespaces = getMultiSelectOptions(k8sNamespaces)
  }
  if (k8sWorkloadNames) {
    formValues.k8sWorkloadNames = getMultiSelectOptions(k8sWorkloadNames)
  }

  if (minActualAmount) {
    formValues.minActualAmount = +minActualAmount
  }

  if (minAnomalousSpend) {
    formValues.minAnomalousSpend = +minAnomalousSpend
  }

  return formValues
}

export const getAnomalyFilterPropertiesFromForm = (formData: AnomaliesFilterFormType): AnomalyFilterProperties => {
  const filterProperties: AnomalyFilterProperties = { filterType: 'Anomaly' }

  const {
    awsAccounts,
    awsServices,
    awsUsageTypes,
    gcpProducts,
    gcpProjects,
    gcpSKUDescriptions,
    k8sClusterNames,
    k8sNamespaces,
    k8sWorkloadNames,
    minActualAmount,
    minAnomalousSpend
  } = formData

  if (awsAccounts) {
    filterProperties.awsAccounts = getValueFromOption(awsAccounts)
  }
  if (awsServices) {
    filterProperties.awsServices = getValueFromOption(awsServices)
  }
  if (awsUsageTypes) {
    filterProperties.awsUsageTypes = getValueFromOption(awsUsageTypes)
  }
  if (gcpProducts) {
    filterProperties.gcpProducts = getValueFromOption(gcpProducts)
  }
  if (gcpProjects) {
    filterProperties.gcpProjects = getValueFromOption(gcpProjects)
  }
  if (gcpSKUDescriptions) {
    filterProperties.gcpSKUDescriptions = getValueFromOption(gcpSKUDescriptions)
  }
  if (k8sClusterNames) {
    filterProperties.k8sClusterNames = getValueFromOption(k8sClusterNames)
  }
  if (k8sNamespaces) {
    filterProperties.k8sNamespaces = getValueFromOption(k8sNamespaces)
  }
  if (k8sWorkloadNames) {
    filterProperties.k8sWorkloadNames = getValueFromOption(k8sWorkloadNames)
  }

  if (minActualAmount) {
    filterProperties.minActualAmount = +minActualAmount
  }

  if (minAnomalousSpend) {
    filterProperties.minAnomalousSpend = +minAnomalousSpend
  }

  return filterProperties
}
