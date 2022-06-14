/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const initialValues = {
  identifier: 'Test',
  type: 'Verify',
  spec: {
    type: 'Rolling',
    spec: {},
    monitoredService: {
      type: 'Default',
      spec: {}
    },
    healthSources: [
      {
        identifier: 'appd'
      }
    ],
    monitoredServiceRef: 'newservicetesting_newenvtesting'
  },
  timeout: '',
  name: 'Test',
  failureStrategies: []
}

export const mockedMonitoredServiceAndHealthSources = {
  status: 'SUCCESS',
  data: {
    createdAt: 1625553163244,
    lastModifiedAt: 1625553455572,
    monitoredService: {
      orgIdentifier: 'default',
      projectIdentifier: 'Harshiltest',
      identifier: 'newservicetesting_newenvtesting',
      name: 'newservicetesting_newenvtesting',
      type: 'Application',
      description: 'Default Monitored Service',
      serviceRef: 'newservicetesting',
      environmentRef: 'newenvtesting',
      sources: {
        healthSources: [
          {
            name: 'appd-healthsource',
            identifier: 'appd',
            type: 'AppDynamics',
            spec: {
              connectorRef: 'Testappd',
              feature: 'Application Monitoring',
              appdApplicationName: 'prod',
              appdTierName: 'cv-nextgen',
              metricPacks: [
                {
                  identifier: 'Errors'
                }
              ]
            }
          }
        ]
      }
    }
  },
  metaData: null,
  correlationId: '8fc5fa6f-f973-4f63-8478-3864a1ad3d7c'
}

export const pathParams = {
  accountId: 'TEST_ACCOUNT_ID',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  pipelineIdentifier: 'TEST_PIPELINE',
  executionIdentifier: 'TEST_EXECUTION',
  module: 'cd',
  stageId: 'selectedStageId'
}
