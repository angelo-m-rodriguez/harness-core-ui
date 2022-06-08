/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { UseGetMockData } from '@common/utils/testUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  JiraFieldSchemaNG,
  ResponseConnectorResponse,
  ResponseJiraIssueCreateMetadataNG,
  ResponseListJiraProjectBasicNG,
  ResponsePageConnectorResponse
} from 'services/cd-ng'
import type { JiraCreateDeploymentModeProps, JiraCreateStepModeProps } from '../types'
import type { JiraFieldsRendererProps } from '../JiraFieldsRenderer'

export const getJiraCreateEditModeProps = (): JiraCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'JiraCreate',
    timeout: '5s',
    spec: {
      connectorRef: '',
      projectKey: '',
      issueType: '',
      fields: []
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getJiraCreateEditModePropsWithConnectorId = (): JiraCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'JiraCreate',
    timeout: '5s',
    spec: {
      connectorRef: 'cid',
      projectKey: '',
      issueType: '',
      fields: []
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getJiraCreateEditModePropsWithValues = (): JiraCreateStepModeProps => ({
  initialValues: {
    name: '',
    identifier: '',
    type: 'JiraCreate',
    timeout: '1d',
    spec: {
      connectorRef: 'c1d1',
      projectKey: 'pid1',
      issueType: 'itd1',
      fields: [
        { name: 'Summary', value: 'summary' },
        { name: 'Description', value: 'descriptionval' },
        { name: 'f21', value: 'value1' },
        { name: 'f2', value: 2233 },
        { name: 'date', value: '23-march' }
      ]
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getJiraCreateDeploymentModeProps = (): JiraCreateDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    name: '',
    identifier: '',
    type: 'JiraCreate',
    spec: {
      connectorRef: '',
      projectKey: '',
      issueType: '',
      fields: [
        {
          name: 'Summary',
          value: ''
        },
        {
          name: 'Description',
          value: ''
        }
      ]
    }
  },
  inputSetData: {
    path: '/ab/',
    template: {
      name: '',
      identifier: '',
      type: 'JiraCreate',
      spec: {
        connectorRef: RUNTIME_INPUT_VALUE,
        projectKey: RUNTIME_INPUT_VALUE,
        issueType: RUNTIME_INPUT_VALUE,
        fields: [
          {
            name: 'Summary',
            value: RUNTIME_INPUT_VALUE
          },
          {
            name: 'Description',
            value: RUNTIME_INPUT_VALUE
          }
        ]
      }
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
})

export const getJiraCreateInputVariableModeProps = () => ({
  initialValues: {
    spec: {}
  },
  customStepProps: {
    stageIdentifier: 'qaStage',
    metadataMap: {
      'step-name': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.name',
          localName: 'step.approval.name'
        }
      },
      'step-timeout': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.timeout',
          localName: 'step.approval.timeout'
        }
      },
      'step-connectorRef': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.connectorRef',
          localName: 'step.approval.spec.connectorRef'
        }
      },
      'step-projectKey': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.projectKey',
          localName: 'step.approval.spec.projectKey'
        }
      },
      'step-issueType': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.issueType',
          localName: 'step.approval.spec.issueType'
        }
      }
    },
    variablesData: {
      type: StepType.JiraCreate,
      identifier: 'jira_create',
      name: 'step-name',
      description: 'Description',
      timeout: 'step-timeout',
      spec: {
        connectorRef: 'step-connectorRef',
        projectKey: 'step-projectKey',
        issueType: 'step-issueType'
      }
    }
  },
  onUpdate: jest.fn()
})

export const mockConnectorResponse: UseGetMockData<ResponseConnectorResponse> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: {
      connector: { name: 'c1', identifier: 'cid1', type: 'Jira', spec: {} }
    }
  }
}

export const mockConnectorsResponse: ResponsePageConnectorResponse = {
  correlationId: 'someid',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,
  data: {
    content: [
      { connector: { name: 'c1', identifier: 'cid1', type: 'Jira', spec: {} } },
      { connector: { name: 'c2', identifier: 'cid2', type: 'Jira', spec: {} } }
    ]
  }
}

export const mockProjectsResponse: UseGetMockData<ResponseListJiraProjectBasicNG> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: [
      {
        id: 'pid1',
        key: 'pid1',
        name: 'p1'
      },
      {
        id: 'pid2',
        key: 'pid2',
        name: 'p2'
      },
      {
        id: 'pid3',
        key: 'pid3',
        name: 'p3'
      }
    ]
  }
}

export const mockProjectsErrorResponse: ResponseListJiraProjectBasicNG = {
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  error: {
    message: 'Failed to fetch: 400 Bad Request',
    data: {
      code: 'INVALID_REQUEST',
      correlationId: '',
      status: 'ERROR',
      metaData: null,
      message: 'mockMessage',
      responseMessages: [
        {
          code: 'INVALID_REQUEST',
          level: 'ERROR',
          message: 'mockMessage',
          exception: null,
          failureTypes: []
        }
      ]
    },
    status: '400'
  }
}

export const mockProjectMetadataResponse: UseGetMockData<ResponseJiraIssueCreateMetadataNG> = {
  loading: false,
  // eslint-disable-next-line
  // @ts-ignore
  refetch: jest.fn(),
  data: {
    correlationId: '',
    status: 'SUCCESS',
    metaData: null as unknown as undefined,
    data: {
      projects: {
        pid1: {
          id: 'pid1',
          key: 'pid1',
          name: 'p1',
          // eslint-disable-next-line
          // @ts-ignore
          issuetypes: [
            {
              id: 'itd1',
              name: 'it1',
              statuses: [
                {
                  name: 'todo',
                  id: 'todo'
                },
                {
                  name: 'Done',
                  id: 'Done'
                }
              ],
              fields: {
                field1: {
                  key: 'f1',
                  name: 'f1',
                  allowedValues: [],
                  schema: {
                    type: 'string' as JiraFieldSchemaNG['type'],
                    typeStr: ''
                  }
                },
                field2: {
                  key: 'f2',
                  name: 'f2',
                  allowedValues: [
                    {
                      id: 'av1',
                      name: 'av1',
                      value: 'av1'
                    },
                    {
                      id: 'av2',
                      name: 'av2'
                    }
                  ],
                  schema: {
                    type: 'string' as JiraFieldSchemaNG['type'],
                    typeStr: ''
                  }
                }
              }
            }
          ]
        }
      }
    }
  }
}
export const getJiraOptionalFieldRendererProps = (): JiraFieldsRendererProps => ({
  selectedFields: [
    {
      name: 'f3',
      value: '',
      key: 'f3',
      allowedValues: [],
      schema: {
        typeStr: 'date',
        type: 'date'
      },
      required: false
    },
    {
      name: 'f4',
      value: '',
      key: 'f4',
      allowedValues: [],
      schema: {
        typeStr: 'datetime',
        type: 'datetime'
      },
      required: false
    },
    {
      name: 'f5',
      value: '',
      key: 'f5',
      allowedValues: [],
      schema: {
        typeStr: 'number',
        type: 'number'
      },
      required: false
    },
    {
      name: 'f6',
      value: '',
      key: 'f6',
      allowedValues: [],
      schema: {
        typeStr: 'option',
        type: 'option',
        array: true
      },
      required: false
    }
  ],
  readonly: false,
  onDelete: jest.fn()
})

export const getJiraRequiredFieldRendererProps = (): JiraFieldsRendererProps => ({
  selectedFields: [
    {
      name: 'f2',
      value: 'val2',
      key: 'f2',
      allowedValues: [],
      schema: {
        typeStr: '',
        type: 'string'
      },
      required: true
    }
  ],
  renderRequiredFields: true
})
