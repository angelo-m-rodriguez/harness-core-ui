/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import type { Module } from '@common/interfaces/RouteInterfaces'
import type { GetYamlSnippetMetadataQueryParams, GetYamlSchemaQueryParams, ConnectorInfoDTO } from 'services/cd-ng'

export const getIconNameForTag = (tag: string): IconName => {
  switch (tag) {
    case 'k8s':
      return 'app-kubernetes'
    case 'docker':
      return 'service-dockerhub'
    case 'git':
      return 'service-github'
    case 'secretmanager':
      return 'lock'
    default:
      return 'main-code-yaml'
  }
}

const entitySubTypeToTagMap:
  | {
      [key in ConnectorInfoDTO['type']]: GetYamlSnippetMetadataQueryParams['tags'][number]
    }
  | any = {
  K8sCluster: 'k8s',
  Git: 'git',
  Splunk: 'splunk',
  AppDynamics: 'appdynamics',
  Vault: 'vault',
  AzureKeyVault: 'azurekeyvault',
  DockerRegistry: 'docker',
  Local: 'local',
  GcpKms: 'gcpkms',
  Gcp: 'gcp',
  Aws: 'aws',
  AwsKms: 'awskms',
  Artifactory: 'artifactory',
  Jira: 'jira',
  // eslint-disable-next-line
  // @ts-ignore
  ServiceNow: 'servicenow',
  Nexus: 'nexus',
  Github: 'github',
  Gitlab: 'gitlab',
  Bitbucket: 'bitbucket',
  CEAws: 'ceaws',
  CEAzure: 'ceazure',
  CEK8sCluster: 'cek8s',
  Codecommit: 'codecommit',
  HttpHelmRepo: 'httphelmrepo',
  NewRelic: 'newrelic',
  GcpCloudCost: 'gcpcloudcost',
  Prometheus: 'prometheus',
  Datadog: 'datadog',
  SumoLogic: 'sumologic',
  Dynatrace: 'dynatrace',
  AwsSecretManager: 'awssecretmanager',
  PagerDuty: 'pagerduty',
  CustomHealth: 'customhealth',
  ErrorTracking: 'errortracking',
  Pdc: 'pdc',
  Azure: 'azure',
  AzureRepo: 'azurerepo'
}

export const getSnippetTags = (
  entityType: GetYamlSchemaQueryParams['entityType'],
  entitySubType?: ConnectorInfoDTO['type'] | Module
): GetYamlSnippetMetadataQueryParams['tags'] => {
  const tags: GetYamlSnippetMetadataQueryParams['tags'] = []
  switch (entityType) {
    case 'Connectors': {
      tags.push('connector')
      break
    }
    case 'Secrets':
      tags.push('secret')
      break
    case 'Pipelines':
      tags.push('pipeline')
      if (entitySubType === 'ci') {
        tags.splice(0, 1)
      }
      break
    default:
  }
  return tags
}
