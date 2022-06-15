/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const mockedVerifyStepWithStatusWaiting = {
  uuid: 'ECQIFZ-dQ8CN9Hi8KTMdBg',
  setupId: 'Iilccu-NSyii5x3m1fCKew',
  name: 'Verify',
  identifier: 'Verify',
  baseFqn: 'pipeline.stages.AppD.spec.execution.steps.canaryDepoyment.steps.Verify',
  outcomes: {
    output: {
      progressPercentage: 0,
      estimatedRemainingTime: '0 minutes',
      activityId: 'yffhAWVhR2OWRKomxiONIg',
      verifyStepExecutionId: 'yffhAWVhR2OWRKomxiONIg'
    }
  },
  stepParameters: {
    serviceIdentifier: 'serviceappd',
    envIdentifier: 'prod',
    deploymentTag: 'tag',
    sensitivity: 'HIGH',
    verificationJobBuilder: {
      sensitivity: {
        isRuntimeParam: false,
        value: 'HIGH'
      },
      trafficSplitPercentage: null,
      uuid: null,
      identifier: null,
      jobName: null,
      createdAt: 0,
      lastUpdatedAt: 0,
      projectIdentifier: null,
      orgIdentifier: null,
      activitySourceIdentifier: null,
      type: null,
      accountId: null,
      dataSources: null,
      monitoringSources: null,
      allMonitoringSourcesEnabled: false,
      duration: {
        isRuntimeParam: false,
        value: '5m'
      },
      isDefaultJob: false
    }
  },
  startTs: 1644213632776,
  endTs: null,
  stepType: 'Verify',
  status: 'InterventionWaiting',
  failureInfo: {
    message: '',
    failureTypeList: [],
    responseMessages: [
      {
        code: 'UNKNOWN_ERROR',
        level: 'ERROR',
        message: 'Verification could not complete due to an unknown error',
        exception: null,
        failureTypes: ['APPLICATION_ERROR']
      }
    ]
  },
  skipInfo: null,
  nodeRunInfo: {
    whenCondition: '<+OnStageSuccess>',
    evaluatedCondition: true,
    expressions: [
      {
        expression: 'OnStageSuccess',
        expressionValue: 'true',
        count: 1
      }
    ]
  },
  executableResponses: [
    {
      async: {
        callbackIds: ['yffhAWVhR2OWRKomxiONIg'],
        logKeys: [],
        units: []
      }
    }
  ],
  unitProgresses: [],
  progressData: {
    progressPercentage: 0,
    estimatedRemainingTime: '10 minutes',
    activityId: 'yffhAWVhR2OWRKomxiONIg',
    verifyStepExecutionId: null
  },
  delegateInfoList: [],
  interruptHistories: [],
  stepDetails: null
}

export const pathParams = {
  accountId: 'TEST_VERIFY_ACCOUNT_ID',
  orgIdentifier: 'TEST_VERIFY_ORG',
  projectIdentifier: 'TEST_VERIFY_PROJECT',
  pipelineIdentifier: 'TEST_VERIFY_PIPELINE',
  executionIdentifier: 'TEST_VERIFY_EXECUTION',
  module: 'cd',
  source: 'executions',
  stageId: 'selectedStageId'
}
