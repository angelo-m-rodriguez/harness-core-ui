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
  ResponseConnectorResponse,
  ResponseListServiceNowFieldNG,
  ResponsePageConnectorResponse,
  ServiceNowFieldSchemaNG,
  ResponseListServiceNowTicketTypeDTO
} from 'services/cd-ng'
import { FieldType } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'
import type { ServiceNowUpdateDeploymentModeProps, ServiceNowUpdateStepModeProps } from '../types'

export const getServiceNowUpdateEditModeProps = (): ServiceNowUpdateStepModeProps => ({
  initialValues: {
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    timeout: '5s',
    spec: {
      connectorRef: '',
      ticketType: '',
      ticketNumber: '',
      fieldType: FieldType.ConfigureFields,
      fields: [
        {
          name: 'description',
          value: 'desc'
        },
        {
          name: 'short_description',
          value: 'short desc'
        },
        { name: 'random', value: 'test' }
      ],
      useServiceNowTemplate: false
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})
export const getServiceNowUpdateTemplateTypeEditModeProps = (): ServiceNowUpdateStepModeProps => ({
  initialValues: {
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    timeout: '5s',
    spec: {
      connectorRef: 'cid1',
      ticketType: 'INCIDENT',
      ticketNumber: '',
      fieldType: FieldType.CreateFromTemplate,
      fields: [
        {
          name: 'description',
          value: 'desc'
        },
        {
          name: 'short_description',
          value: 'short desc'
        }
      ],
      useServiceNowTemplate: true,
      templateName: 'test'
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowUpdateEditModePropsWithConnectorId = (): ServiceNowUpdateStepModeProps => ({
  initialValues: {
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    timeout: '5s',
    spec: {
      connectorRef: 'cid',
      ticketType: '',
      ticketNumber: '',
      fieldType: FieldType.ConfigureFields,
      fields: [],
      useServiceNowTemplate: false
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowUpdateEditModePropsWithValues = (): ServiceNowUpdateStepModeProps => ({
  initialValues: {
    timeout: '1d',
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    spec: {
      connectorRef: 'c1d1',
      ticketType: 'INCIDENT',
      ticketNumber: '<+ticketNumber>',
      fieldType: FieldType.ConfigureFields,
      fields: [
        { name: 'f21', value: 'value1' },
        { name: 'f2', value: 2233 },
        { name: 'date', value: '23-march' },
        { name: 'description', value: 'desc' },
        { name: 'short_description', value: 'short desc' }
      ],
      useServiceNowTemplate: false
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepViewType: StepViewType.Edit
})

export const getServiceNowUpdateDeploymentModeProps = (): ServiceNowUpdateDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    spec: {
      connectorRef: '',
      ticketType: '',
      ticketNumber: '',
      fieldType: FieldType.ConfigureFields,
      fields: [],
      useServiceNowTemplate: false
    }
  },
  inputSetData: {
    path: '/ab/',
    template: {
      name: '',
      type: 'ServiceNowUpdate',
      identifier: '',
      spec: {
        connectorRef: RUNTIME_INPUT_VALUE,
        ticketType: RUNTIME_INPUT_VALUE,
        ticketNumber: RUNTIME_INPUT_VALUE,
        fieldType: FieldType.ConfigureFields,
        fields: [{ name: 'Description', value: RUNTIME_INPUT_VALUE }],
        useServiceNowTemplate: false
      }
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
})
export const getServiceNowUpdateDeploymentModeWithCustomFieldsProps = (): ServiceNowUpdateDeploymentModeProps => ({
  stepViewType: StepViewType.InputSet,
  initialValues: {
    name: '',
    type: 'ServiceNowUpdate',
    identifier: '',
    spec: {
      connectorRef: 'cid1',
      ticketType: 'INCIDENT',
      ticketNumber: '',
      fieldType: FieldType.ConfigureFields,
      fields: [],
      useServiceNowTemplate: false
    }
  },
  inputSetData: {
    path: '/ab/',
    template: {
      name: '',
      type: 'ServiceNowUpdate',
      identifier: '',
      spec: {
        connectorRef: 'cid1',
        ticketType: 'INCIDENT',
        ticketNumber: RUNTIME_INPUT_VALUE,
        fieldType: FieldType.ConfigureFields,
        fields: [
          {
            name: 'Test',
            value: RUNTIME_INPUT_VALUE
          }
        ],
        useServiceNowTemplate: false
      }
    }
  },
  onUpdate: jest.fn(),
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
})

export const mockTicketTypeReponse: ResponseListServiceNowTicketTypeDTO = {
  // eslint-disable-next-line
  // @ts-ignore
  correlationId: '',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,

  data: [
    {
      name: 'INCIDENT',
      key: 'incident'
    },
    {
      name: 'CHANGE',
      key: 'change'
    }
  ]
}

export const getServiceNowUpdateInputVariableModeProps = () => ({
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
      'step-ticketType': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.ticketType',
          localName: 'step.approval.spec.ticketType'
        }
      },
      'step-ticketNumber': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.approval.spec.ticketNumber',
          localName: 'step.approval.spec.ticketNumber'
        }
      }
    },
    variablesData: {
      type: StepType.ServiceNowUpdate,
      identifier: 'serviceNow_update',
      name: 'step-name',
      timeout: 'step-timeout',
      spec: {
        connectorRef: 'step-connectorRef',
        ticketType: 'step-ticketType'
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
      connector: { name: 'c1', identifier: 'cid1', type: 'ServiceNow', spec: {} }
    }
  }
}

export const mockConnectorsResponse: ResponsePageConnectorResponse = {
  correlationId: 'someid',
  status: 'SUCCESS',
  metaData: null as unknown as undefined,
  data: {
    content: [
      { connector: { name: 'c1', identifier: 'cid1', type: 'ServiceNow', spec: {} } },
      { connector: { name: 'c2', identifier: 'cid2', type: 'ServiceNow', spec: {} } }
    ]
  }
}

export const mockServiceNowMetadataResponse: UseGetMockData<ResponseListServiceNowFieldNG> = {
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
        key: 'f1',
        name: 'f1',
        allowedValues: [],
        schema: {
          type: 'string' as ServiceNowFieldSchemaNG['type'],
          typeStr: ''
        }
      },
      {
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
          type: 'string' as ServiceNowFieldSchemaNG['type'],
          typeStr: ''
        }
      }
    ]
  }
}

export const mockServiceNowTicketTypesErrorResponse: ResponseListServiceNowTicketTypeDTO = {
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
