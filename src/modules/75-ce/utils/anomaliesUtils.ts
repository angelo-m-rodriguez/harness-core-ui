/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { CloudProvider } from '@ce/types'
import type { QlceViewFilterInput } from 'services/ce/services'
import { DEFAULT_GROUP_BY } from './perspectiveUtils'

const gcpEntities = ['gcpProduct', 'gcpProjectId', 'gcpSKUDescription']
const awsEntities = ['awsUsageAccountId', 'awsServiceCode', 'awsInstancetype', 'awsUsageType']
const azureEntities = ['azureSubscriptionGuid', 'azureMeterCategory', 'azureResourceGroup']
const clusterEntities = ['clusterName', 'namespace', 'workloadName', 'workloadType']

const cloudProviderToEntityMapping = {
  [CloudProvider.GCP]: gcpEntities,
  [CloudProvider.AWS]: awsEntities,
  [CloudProvider.CLUSTER]: clusterEntities,
  [CloudProvider.AZURE]: azureEntities
}

export const anomalyFilterValueColumns = [
  'clustername',
  'namespace',
  'workloadname',
  'gcpproject',
  'gcpproduct',
  'gcpskudescription',
  'awsaccount',
  'awsservice',
  'awsusagetype'
]

export const filterKeyToKeyMapping: Record<string, string> = {
  gcpProducts: 'gcpproduct',
  gcpProjects: 'gcpproject',
  gcpSKUDescriptions: 'gcpskudescription',
  k8sClusterNames: 'clustername',
  k8sNamespaces: 'namespace',
  k8sWorkloadNames: 'workloadname',
  awsAccounts: 'awsaccount',
  awsServices: 'awsservice',
  awsUsageTypes: 'awsusagetype'
}

export const filterKeyToLabelMapping: Record<string, string> = {
  gcpProducts: 'GCP Product',
  gcpProjects: 'GCP Project',
  gcpSKUDescriptions: 'GCP SKU Description',
  k8sClusterNames: 'Cluster Name',
  k8sNamespaces: 'Namespace',
  k8sWorkloadNames: 'Workload',
  awsAccounts: 'AWS Account',
  awsServices: 'AWS Service',
  awsUsageTypes: 'AWS Usage Type',
  azureSubscriptions: 'AZURE Subscription',
  azureServiceNames: 'AZURE Service Name',
  azureResources: 'AZURE Resource'
}

export const k8sFilterKeys = ['k8sClusterNames', 'k8sNamespaces', 'k8sWorkloadNames']
export const gcpFilterKeys = ['gcpProjects', 'gcpProducts', 'gcpSKUDescriptions']
export const awsFilterKeys = ['awsAccounts', 'awsServices', 'awsUsageTypes']
export const azureFilterKeys = ['azureSubscriptions', 'azureServiceNames', 'azureResources']

const fieldToFieldNameMapping: Record<string, string> = {
  gcpProduct: 'Product',
  gcpProjectId: 'Project',
  gcpSKUDescription: 'SKUs',
  clusterName: 'Cluster Name',
  namespace: 'Namespace',
  workloadName: 'Workload',
  awsUsageAccountId: 'Account',
  awsServiceCode: 'Service',
  awsInstancetype: 'Instance Type',
  awsUsageType: 'Usage Type',
  workloadType: 'Workload Type',
  gcpSkuDescription: 'SKUs',
  azureSubscriptionGuid: 'Subscription ID',
  azureMeterCategory: 'Meter category',
  azureResourceGroup: 'Resource group name'
}

export function generateFilters(
  entityMap: Record<string, string>,
  cloudProvider: CloudProvider
): QlceViewFilterInput[] {
  const filters: any = []
  const relatedEntities = cloudProviderToEntityMapping[cloudProvider]
  relatedEntities?.length &&
    relatedEntities.forEach(entity => {
      if (entityMap[entity]) {
        filters.push({
          field: {
            fieldId: entity,
            fieldName: fieldToFieldNameMapping[entity] || '',
            identifier: cloudProvider,
            identifierName: cloudProvider
          },
          operator: 'IN',
          type: 'VIEW_ID_CONDITION',
          values: [entityMap[entity]]
        })
      }
    })

  return filters
}

export function generateGroupBy(field: string, cloudProvider: CloudProvider): any {
  return field
    ? {
        fieldId: field,
        fieldName: fieldToFieldNameMapping[field] || '',
        identifier: cloudProvider,
        identifierName: cloudProvider
      }
    : DEFAULT_GROUP_BY
}

export function getCloudProviderFromFields(entityMap: Record<string, string | null>): CloudProvider {
  if (entityMap.gcpProjectId) {
    return CloudProvider.GCP
  }
  if (entityMap.awsUsageAccountId) {
    return CloudProvider.AWS
  }
  if (entityMap.azureSubscriptionGuid) {
    return CloudProvider.AZURE
  }
  return CloudProvider.CLUSTER
}

export function getFiltersFromEnityMap(
  entityMap: Array<Record<string, string>>,
  cloudProvider: CloudProvider
): QlceViewFilterInput[] {
  const filters: any = []
  const relatedEntities = cloudProviderToEntityMapping[cloudProvider]

  relatedEntities.length &&
    relatedEntities.forEach(entity => {
      if (entityMap.length && entityMap[0][entity]) {
        const values: string[] = []
        entityMap.forEach(obj => {
          obj[entity] && values.push(obj[entity])
        })

        values.length &&
          filters.push({
            field: {
              fieldId: entity,
              fieldName: fieldToFieldNameMapping[entity] || '',
              identifier: cloudProvider,
              identifierName: cloudProvider
            },
            operator: 'IN',
            type: 'VIEW_ID_CONDITION',
            values: values
          })
      }
    })

  return filters
}
