/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { CCMRecommendationFilterProperties, K8sRecommendationFilterPropertiesDTO } from 'services/ce'
import type { RecommendationFilterFormType } from '@ce/components/RecommendationFilters/FilterDrawer/FilterDrawer'

export const getRecommendationFormValuesFromFilterProperties = (
  filterProperties: CCMRecommendationFilterProperties
): RecommendationFilterFormType => {
  const formData: RecommendationFilterFormType = {}

  const { k8sRecommendationFilterPropertiesDTO = {}, minCost, minSaving } = filterProperties
  const { clusterNames, names, namespaces, resourceTypes } = k8sRecommendationFilterPropertiesDTO

  if (clusterNames) {
    formData.clusterNames = clusterNames.map(clusterName => ({ label: clusterName, value: clusterName }))
  }

  if (names) {
    formData.names = names.map(name => ({ label: name, value: name }))
  }

  if (namespaces) {
    formData.namespaces = namespaces.map(namespace => ({ label: namespace, value: namespace }))
  }

  if (resourceTypes) {
    formData.resourceTypes = resourceTypes.map(resourceType => ({ label: resourceType, value: resourceType }))
  }

  if (minCost) {
    formData.minCost = minCost
  }

  if (minSaving) {
    formData.minSaving = minSaving
  }

  return formData
}

export const getRecommendationFilterPropertiesFromForm = (
  formData: RecommendationFilterFormType
): CCMRecommendationFilterProperties => {
  const filterProperties: CCMRecommendationFilterProperties = { filterType: 'CCMRecommendation' }
  const { clusterNames, minCost, minSaving, names, namespaces, resourceTypes } = formData

  const k8sRecommendationFilterPropertiesDTO = {} as K8sRecommendationFilterPropertiesDTO
  if (clusterNames) {
    k8sRecommendationFilterPropertiesDTO.clusterNames = clusterNames.map(item => item.value) as string[]
  }
  if (namespaces) {
    k8sRecommendationFilterPropertiesDTO.namespaces = namespaces.map(item => item.value) as string[]
  }
  if (names) {
    k8sRecommendationFilterPropertiesDTO.names = names.map(item => item.value) as string[]
  }
  if (resourceTypes) {
    k8sRecommendationFilterPropertiesDTO.resourceTypes = resourceTypes.map(
      item => item.value
    ) as K8sRecommendationFilterPropertiesDTO['resourceTypes']
  }
  if (minCost) {
    filterProperties.minCost = +minCost
  }

  if (minSaving) {
    filterProperties.minSaving = +minSaving
  }

  if (k8sRecommendationFilterPropertiesDTO) {
    filterProperties.k8sRecommendationFilterPropertiesDTO = k8sRecommendationFilterPropertiesDTO
  }

  return filterProperties
}
