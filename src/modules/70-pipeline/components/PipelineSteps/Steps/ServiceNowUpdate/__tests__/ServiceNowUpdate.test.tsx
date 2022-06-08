/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { act, findByText, fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  mockServiceNowMetadataResponse,
  mockServiceNowTemplateResponse
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/__tests__/ServiceNowCreateTestHelper'
import { mockTicketTypesResponse } from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/__test__/ServiceNowApprovalTestHelper'
import { FieldType } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'
import {
  getServiceNowUpdateDeploymentModeProps,
  getServiceNowUpdateDeploymentModeWithCustomFieldsProps,
  getServiceNowUpdateEditModeProps,
  getServiceNowUpdateEditModePropsWithValues,
  getServiceNowUpdateInputVariableModeProps,
  getServiceNowUpdateTemplateTypeEditModeProps,
  mockConnectorResponse
} from './ServiceNowUpdateTestHelper'
import type { ServiceNowUpdateData } from '../types'
import { processFormData } from '../helper'
import { ServiceNowUpdate } from '../ServiceNowUpdate'
import { factory, TestStepWidget } from '../../__tests__/StepTestUtil'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => mockConnectorResponse,
  useGetServiceNowTicketTypes: () => mockTicketTypesResponse,
  useGetServiceNowIssueMetadata: () => mockServiceNowMetadataResponse,
  useGetServiceNowTemplateMetadata: () => mockServiceNowTemplateResponse
}))

describe('ServiceNow Update tests', () => {
  beforeEach(() => {
    factory.registerStep(new ServiceNowUpdate())
  })

  test('Basic snapshot - inputset mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container, getByText, queryByText } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    fireEvent.click(getByText('Submit'))
    await waitFor(() => queryByText('Errors'))
    expect(container).toMatchSnapshot('input set with errors')
  })

  test('Basic snapshot - deploymentform mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={props.inputSetData}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-deploymentform')
  })

  test('deploymentform readonly mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={{ ...props.inputSetData, path: props.inputSetData?.path || '', readonly: true }}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-deploymentform-readonly')
  })

  test('Basic snapshot - inputset mode but no runtime values', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        template={{ spec: { transitionTo: {} } }}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    expect(container).toMatchSnapshot('serviceNow-update-inputset-noruntime')
  })

  test('Basic snapshot - input variable view', () => {
    const props = getServiceNowUpdateInputVariableModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        template={{ spec: {} }}
        stepViewType={StepViewType.InputVariable}
        customStepProps={props.customStepProps}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-input variable view')
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Basic functions - edit stage view validations', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowUpdateEditModeProps()
    const { container, queryByText, getByText } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
      />
    )

    // Submit with empty form
    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('pipelineSteps.stepNameRequired')).toBeTruthy())

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'serviceNow update step' } })

    act(() => {
      fireEvent.click(getByText('pipelineSteps.timeoutLabel'))
    })
    fireEvent.change(queryByNameAttribute('timeout')!, { target: { value: '' } })

    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('validation.timeout10SecMinimum')).toBeTruthy())
    await waitFor(() => expect(queryByText('pipeline.serviceNowApprovalStep.validations.ticketType')).toBeTruthy())
  })

  test('Edit stage - readony view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowUpdateEditModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        readonly={true}
      />
    )

    expect(container).toMatchSnapshot('editstage-readonly')
  })

  test('Edit Stage - readonly view for Template type', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowUpdateTemplateTypeEditModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        readonly={true}
      />
    )
    expect(container).toMatchSnapshot('edit-templatetype-stage-readonly')
  })

  test('Open a saved step - edit stage view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = { ...getServiceNowUpdateEditModePropsWithValues() }
    const {
      container,
      getByText,
      getByTestId,
      queryByPlaceholderText,
      getByPlaceholderText,
      queryByDisplayValue,
      queryByText
    } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={props.onUpdate}
      />
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'serviceNow update step' } })
    expect(queryByDisplayValue('1d')).toBeTruthy()

    // Check if fields are populated
    expect(queryByDisplayValue('value1')).toBeTruthy()
    expect(queryByDisplayValue('2233')).toBeTruthy()
    expect(queryByDisplayValue('23-march')).toBeTruthy()
    expect(queryByDisplayValue('INCIDENT')).toBeTruthy()

    // Update the ticket type to Change from Incident
    const ticketType = container
      .querySelector(`input[name="spec.ticketType"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(ticketType!)
    })
    const changeTicketType = await findByText(document.body, 'CHANGE')
    act(() => {
      fireEvent.click(changeTicketType)
    })

    fireEvent.change(getByPlaceholderText('pipeline.serviceNowCreateStep.descriptionPlaceholder'), {
      target: { value: 'description' }
    })

    // Open the fields selector dialog
    act(() => {
      fireEvent.click(getByText('pipeline.jiraCreateStep.fieldSelectorAdd'))
    })

    await waitFor(() => expect(queryByText('pipeline.serviceNowCreateStep.selectFieldListHelp')).toBeTruthy())
    const dialogContainer = document.body.querySelector('.bp3-portal')

    // Click the new custom field
    fireEvent.click(getByText('f1'))

    // Add the field to serviceNow create form
    const button = dialogContainer?.querySelector('.bp3-button-text')
    fireEvent.click(button!)

    // The selected field should be now added to the main form
    expect(queryByPlaceholderText('f1')).toBeTruthy()

    // Delete a field
    act(() => {
      const deleteField = container?.querySelector(`button[data-testid="remove-selectedField-0"]`)
      fireEvent.click(deleteField!)
    })

    // Open the fields selector dialog again
    act(() => {
      fireEvent.click(getByText('pipeline.jiraCreateStep.fieldSelectorAdd'))
    })
    // Click on provide field list option - to add KV pairs
    fireEvent.click(getByText('pipeline.jiraCreateStep.provideFieldList'))

    const dialogContainerPostUpdate = document.body.querySelector('.bp3-portal')
    act(() => {
      fireEvent.click(getByTestId('add-fieldList'))
    })
    // add the new KV pair inside the dialog container
    const keyDiv = dialogContainerPostUpdate?.querySelector('input[name="fieldList[0].name"]')
    fireEvent.change(keyDiv!, { target: { value: 'issueKey1' } })
    const valueDiv = dialogContainerPostUpdate?.querySelector('input[name="fieldList[0].value"]')
    fireEvent.change(valueDiv!, { target: { value: 'issueKey1Value' } })

    // Add the field to form
    const addButton = dialogContainerPostUpdate?.querySelector('button[type="submit"]')
    fireEvent.click(addButton!)

    // the new kv pair should now be visible in the main form
    expect(queryByDisplayValue('issueKey1')).toBeTruthy()
    expect(queryByDisplayValue('issueKey1Value')).toBeTruthy()
    await act(() => ref.current?.submitForm()!)

    expect(props.onUpdate).toBeCalledWith({
      identifier: 'serviceNow_update_step',
      timeout: '1d',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: 'c1d1',
        useServiceNowTemplate: false,
        ticketType: 'CHANGE',
        ticketNumber: '<+ticketNumber>',
        delegateSelectors: undefined,
        fields: [
          { name: 'description', value: 'desc' },
          { name: 'short_description', value: 'short desc' },
          { name: 'f1', value: '' },
          { name: 'issueKey1', value: 'issueKey1Value' }
        ]
      },
      name: 'serviceNow update step'
    })
  })

  test('Minimum time cannot be less than 10s', () => {
    const response = new ServiceNowUpdate().validateInputSet({
      data: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '1s',
        type: 'ServiceNowUpdate',
        spec: {
          connectorRef: '',
          ticketType: '',
          fields: [],
          ticketNumber: '',
          fieldType: FieldType.ConfigureFields,
          useServiceNowTemplate: false
        }
      },
      template: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '<+input>',
        type: 'ServiceNowUpdate',
        spec: {
          connectorRef: '',
          ticketType: '',
          fields: [],
          ticketNumber: '',
          fieldType: FieldType.ConfigureFields,
          useServiceNowTemplate: false
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot('Value must be greater than or equal to "10s"')
  })

  test('Deploymentform with custom fields as runtime', async () => {
    const props = getServiceNowUpdateDeploymentModeWithCustomFieldsProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={{ ...props.inputSetData, path: props.inputSetData?.path || '', readonly: true }}
      />
    )
    expect(container).toMatchSnapshot('serviceNow-update-deploymentform-customFields')
  })
})

describe('ServiceNow Update process form data tests', () => {
  test('if duplicate fields are not sent', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: 'conn',
        fieldType: FieldType.ConfigureFields,
        useServiceNowTemplate: false,
        ticketType: 'INCIDENT',
        ticketNumber: '123',
        description: 'description',
        shortDescription: 'short description',
        fields: [
          {
            name: 'f1',
            value: 'v1'
          },
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' }
          }
        ],
        selectedFields: [
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' },
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          },
          {
            name: 'f3',
            value: [
              { label: 'v3', value: 'v3' },
              { label: 'v32', value: 'v32' }
            ],
            key: 'f3',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: 'conn',
        delegateSelectors: undefined,
        ticketType: 'INCIDENT',
        ticketNumber: '123',
        useServiceNowTemplate: false,
        fields: [
          {
            name: 'description',
            value: 'description'
          },
          {
            name: 'short_description',
            value: 'short description'
          },
          {
            name: 'f2',
            value: 'vb2'
          },
          {
            name: 'f3',
            value: 'v3,v32'
          },
          {
            name: 'f1',
            value: 'v1'
          }
        ]
      }
    })
  })

  test('if runtime values work', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        ticketType: 'INCIDENT',
        fieldType: FieldType.ConfigureFields,
        useServiceNowTemplate: false,
        fields: [
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ],
        selectedFields: [
          {
            name: 'f2',
            value: '<+x.y>',
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        useServiceNowTemplate: false,
        ticketType: 'INCIDENT',
        fields: [
          {
            name: 'description',
            value: ''
          },
          {
            name: 'short_description',
            value: ''
          },
          {
            name: 'f2',
            value: '<+x.y>'
          },
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ]
      }
    })
  })

  test('when useServiceNowTemplate is true', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'snup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        ticketType: 'INCIDENT',
        fieldType: FieldType.CreateFromTemplate,
        useServiceNowTemplate: true,
        fields: [],
        selectedFields: [],
        templateName: 'snowUpdateTemplate'
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'snup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        useServiceNowTemplate: true,
        ticketType: 'INCIDENT',
        templateName: 'snowUpdateTemplate',
        fields: []
      }
    })
  })
})
