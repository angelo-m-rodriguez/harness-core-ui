/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import routes from '@common/RouteDefinitions'
import { executionPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import type { TestWrapperProps } from '@common/utils/testUtils'
import { LogTypes } from '@cv/hooks/useLogContentHook/useLogContentHook.types'
import type {
  ApiCallLogDTO,
  ExecutionLogDTO,
  RestResponseDeploymentActivitySummaryDTO,
  RestResponsePageCVNGLogDTO,
  RestResponseSetHealthSourceDTO
} from 'services/cv'

export const errorMessage = 'TEST ERROR MESSAGE'
const TEXT_LEARNING_ENGINE = 'Learning engine task info status: SUCCESS'

export const pathParams = {
  accountId: 'TEST_ACCOUNT_ID',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  pipelineIdentifier: 'TEST_PIPELINE',
  executionIdentifier: 'TEST_EXECUTION',
  module: 'cd',
  stageId: 'selectedStageId'
}

export const testWrapperProps: TestWrapperProps = {
  path: routes.toExecutionPipelineView({ ...executionPathProps, ...pipelineModuleParams }),
  pathParams
}

export const healthSourceResponse: RestResponseSetHealthSourceDTO = {
  metaData: {},
  resource: [
    {
      identifier: 'dynatrace_prod/dynatrace',
      name: 'dynatrace',
      type: 'DYNATRACE',
      verificationType: 'TIME_SERIES'
    },
    {
      identifier: 'dynatrace_prod/dyna',
      name: 'dyna',
      type: 'DYNATRACE',
      verificationType: 'TIME_SERIES'
    }
  ],
  responseMessages: []
}

export const executionLogs: ExecutionLogDTO[] = [
  {
    accountId: 'kmpySmUISimoRrJL6NL73w',
    traceableId: '6r2ndyuHT5qAdZZQVoE3RA',
    createdAt: 1647418990020,
    startTime: 1647418800000,
    endTime: 1647418860000,
    traceableType: 'VERIFICATION_TASK',
    log: TEXT_LEARNING_ENGINE,
    logLevel: 'INFO',
    type: LogTypes.ExecutionLog,
    tags: [{ key: 'dataSourceType', value: 'NEW_RELIC', type: 'STRING' }]
  }
]

export const executionLogState = {
  data: [
    {
      text: {
        logLevel: 'INFO',
        createdAt: '1647418990020',
        log: TEXT_LEARNING_ENGINE
      }
    }
  ],
  searchData: { currentIndex: 0, linesWithResults: [], text: '' }
}

export const executionLogStateWithTAGS = {
  data: [
    {
      text: {
        logLevel: 'INFO',
        createdAt: '1647418990020',
        log: TEXT_LEARNING_ENGINE,
        tags: '{"dataSourceType":"NEW_RELIC"}'
      }
    }
  ],
  searchData: { currentIndex: 0, linesWithResults: [], text: '' }
}

export const executionLogStateWithSearch = {
  data: [
    {
      text: { logLevel: 'INFO', createdAt: '1647418990020', log: TEXT_LEARNING_ENGINE },
      searchIndices: { logLevel: [0], log: [1] }
    }
  ],
  searchData: { currentIndex: 0, text: 'INFO', linesWithResults: [0, 0] }
}

export const executionLogsResponse: RestResponsePageCVNGLogDTO = {
  metaData: {},
  resource: {
    totalPages: 2,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 20,
    content: executionLogs,
    pageIndex: 0,
    empty: false
  },
  responseMessages: []
}

export const deploymentActivitySummaryResponse: RestResponseDeploymentActivitySummaryDTO = {
  metaData: {},
  resource: {
    serviceName: 'dynatrace',
    serviceIdentifier: 'dynatrace',
    envName: 'prod',
    envIdentifier: 'prod'
  },
  responseMessages: []
}

export const externalAPICallLogsResponse: RestResponsePageCVNGLogDTO = {
  metaData: {},
  resource: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 20,
    content: [
      {
        accountId: 'zEaak-FLS425IEO7OLzMUg',
        traceableId: 'UAlk7Un2Rcq0hS6SXWE6uA',
        createdAt: 1647015342721,
        startTime: 1647015120000,
        endTime: 1647015180000,
        traceableType: 'VERIFICATION_TASK',
        requests: [
          {
            name: 'url',
            value: 'https://qva35651.live.dynatrace.com/api/v2/metrics/query?entitySelector=type',
            type: 'URL'
          }
        ],
        responses: [
          {
            name: 'Status Code',
            value: '200',
            type: 'NUMBER'
          },
          {
            name: 'Response Body',
            value:
              '{"totalCount":1.0,"nextPageKey":null,"resolution":"1m", "data":[{"dimensions":["SERVICE_METHOD-F3988BEE84FF7388"]}]}',
            type: 'JSON'
          }
        ],
        tags: [{ key: 'dataSourceType', value: 'NEW_RELIC', type: 'STRING' }],
        requestTime: 1647015341267,
        responseTime: 1647015341484,
        type: 'ApiCallLog'
      } as ApiCallLogDTO
    ],
    pageIndex: 0,
    empty: false
  },
  responseMessages: []
}
