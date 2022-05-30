/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, queryByAttribute, fireEvent, createEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { useListAwsRegions } from '../../__tests__/ApiRequestMocks'

import ParameterFileInputs from '../ParameterInputs'

const initialValues = {
  type: StepType.CloudFormationCreateStack,
  name: 'test name',
  identifier: 'test_identifier',
  timeout: '10m',
  spec: {
    provisionerIdentifier: 'test',
    configuration: {
      stackName: 'testName',
      connectorRef: 'test_ref',
      region: 'test region',
      templateFile: {
        type: 'Remote',
        spec: {}
      },
      parameters: []
    }
  }
}

const eventData = { dataTransfer: { setData: jest.fn(), dropEffect: '', getData: () => '1' } }

const renderComponent = (data: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <Formik initialValues={{}} onSubmit={() => undefined} formName="wrapperComponentTestForm">
        <FormikForm>
          <ParameterFileInputs
            initialValues={initialValues as any}
            stepType={StepType.CloudFormationCreateStack}
            stepViewType={StepViewType.InputSet}
            inputSetData={{
              template: data
            }}
            path="test"
            readonly={false}
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
          />
        </FormikForm>
      </Formik>
    </TestWrapper>
  )
}

describe('Test cloudformation create stack parameters input set', () => {
  test('should render remote parameters with region request', async () => {
    useListAwsRegions()
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          parameters: [
            {
              store: {
                type: 'S3Url',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  urls: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE
                }
              }
            }
          ]
        }
      }
    }
    const { container, getByPlaceholderText, getByText } = renderComponent(data)
    const input = getByPlaceholderText('pipeline.regionPlaceholder')
    act(() => {
      userEvent.click(input)
    })

    const label = getByText('GovCloud (US-West)')
    act(() => {
      userEvent.click(label)
    })

    expect(input).toHaveValue('GovCloud (US-West)')
    expect(container).toMatchSnapshot()
  })

  test('should render remote parameters with region loading state', async () => {
    useListAwsRegions(false, true)
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          parameters: [
            {
              store: {
                type: 'S3Url',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  urls: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE
                }
              }
            }
          ]
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render remote parameters add/remove new url path', async () => {
    useListAwsRegions()
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          parameters: [
            {
              store: {
                type: 'S3Url',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  urls: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE
                }
              }
            }
          ]
        }
      }
    }
    const { container, getByTestId } = renderComponent(data)
    const addLabel = getByTestId('add-header')
    act(() => {
      userEvent.click(addLabel)
    })
    const input = queryByAttribute('name', container, 'test.spec.configuration.parameters[0].store.spec.urls[0]')
    act(() => {
      userEvent.type(input!, 'test')
    })
    expect(input).toHaveValue('test')

    const paramOne = getByTestId(`filePath-0`)

    act(() => {
      const dragStartEvent = Object.assign(createEvent.dragStart(paramOne), eventData)

      fireEvent(paramOne, dragStartEvent)
      fireEvent.dragEnd(addLabel)
      fireEvent.dragLeave(paramOne)

      const dropEffectEvent = Object.assign(createEvent.dragOver(paramOne), eventData)
      fireEvent(addLabel, dropEffectEvent)

      const dropEvent = Object.assign(createEvent.drop(paramOne), eventData)
      fireEvent(addLabel, dropEvent)
    })

    const removeLabel = getByTestId('remove-header-0')
    act(() => {
      userEvent.click(removeLabel)
    })
    expect(input).toHaveValue('')
    expect(container).toMatchSnapshot()
  })

  test('should render remote parameters with github params', async () => {
    const data = {
      type: StepType.CloudFormationCreateStack,
      name: 'testCreate',
      identifier: 'testID',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'id',
        configuration: {
          stackName: 'name',
          connectorRef: 'testRef',
          templateFile: {
            type: 'Remote',
            spec: {}
          },
          parameters: [
            {
              store: {
                type: 'Github',
                spec: {
                  connectorRef: 'testRef',
                  repoName: RUNTIME_INPUT_VALUE,
                  commitId: RUNTIME_INPUT_VALUE,
                  branch: RUNTIME_INPUT_VALUE,
                  paths: RUNTIME_INPUT_VALUE
                }
              }
            }
          ]
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })
})
