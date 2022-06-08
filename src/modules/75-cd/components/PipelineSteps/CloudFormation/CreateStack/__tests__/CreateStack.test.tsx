/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, act, queryByAttribute, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CFCreateStack } from '../CreateStack'
import {
  useCFCapabilitiesForAws,
  useListAwsRegions,
  useCFStatesForAws,
  useGetIamRolesForAws,
  useGetConnector
} from './ApiRequestMocks'
jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => {
  return <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
})

describe('Test Cloudformation create stack', () => {
  beforeEach(() => {
    factory.registerStep(new CFCreateStack())
    useGetConnector()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should render edit view as new step', () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '10m',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as new step with data', () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateBody: 'test body'
            }
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should open and close remote template modal', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: '',
          region: 'ireland',
          templateFile: {
            type: 'Remote',
            spec: {}
          }
        }
      }
    })
    const { container, getByTestId } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        onChange={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    await waitFor(() => expect(getByTestId('remoteTemplate')).toBeTruthy())
    userEvent.click(getByTestId('remoteTemplate'))

    await waitFor(() => expect(getByTestId('remoteClose')).toBeTruthy())
    await act(async () => userEvent.click(getByTestId('remoteClose')))
    expect(container).toMatchSnapshot()
  })

  test('should be able to edit inputs', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    useGetIamRolesForAws(true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'Ireland',
          templateFile: {
            type: 'S3URL',
            spec: {
              templateUrl: 'test.test.com'
            }
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    const stepName = queryByAttribute('name', container, 'name')
    userEvent.type(stepName!, ' new name')
    expect(stepName).toHaveDisplayValue(['create stack new name'])

    const timeout = queryByAttribute('name', container, 'timeout')
    userEvent.clear(timeout!)
    userEvent.type(timeout!, '20m')
    expect(timeout).toHaveDisplayValue('20m')

    const provisionerIdentifier = queryByAttribute('name', container, 'spec.provisionerIdentifier')
    userEvent.clear(provisionerIdentifier!)
    userEvent.type(provisionerIdentifier!, 'newID')
    expect(provisionerIdentifier).toHaveDisplayValue('newID')

    const region = queryByAttribute('name', container, 'spec.configuration.region')
    userEvent.click(region!)

    const stackName = queryByAttribute('name', container, 'spec.configuration.stackName')
    userEvent.clear(stackName!)
    userEvent.type(stackName!, 'new name')
    expect(stackName).toHaveDisplayValue('new name')
  })

  test('should be able to open optional dropdown and remove param', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateBody: 'test body'
            }
          },
          // optional
          parameterOverrides: [
            {
              name: 'OtherName',
              type: 'String',
              value: 'test'
            }
          ],
          parameters: [
            {
              identifier: 'idtest',
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['www.test.com']
                }
              }
            }
          ],
          capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          skipOnStackStatuses: ['UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'],
          tags: '[{"key": "value"}]'
        }
      }
    })
    const { container, getByText, getByTestId } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    userEvent.click(getByText('common.optionalConfig'))

    await waitFor(() => expect(getByTestId('remove-param-0')))
    userEvent.click(getByTestId('remove-param-0'))
    expect(container).toMatchSnapshot()
  })

  test('should be able to open remote param modal', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateBody: 'test body'
            }
          },
          // optional
          parameterOverrides: [
            {
              name: 'OtherName',
              type: 'String',
              value: 'test'
            }
          ],
          parameters: [
            {
              identifier: 'idtest',
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['www.test.com']
                }
              }
            }
          ],
          capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          skipOnStackStatuses: ['UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'],
          tags: '[{"key": "value"}]'
        }
      }
    })
    const { container, getByText, getByTestId } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    userEvent.click(getByText('common.optionalConfig'))

    await waitFor(() => expect(getByTestId('remoteParamFiles')).toBeTruthy())
    userEvent.click(getByTestId('remoteParamFiles'))
    expect(container).toMatchSnapshot()
  })

  test('should be able to open and close inline param modal', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'ireland',
          templateFile: {
            type: 'Inline',
            spec: {
              templateBody: 'test body'
            }
          },
          // optional
          parameterOverrides: [
            {
              name: 'OtherName',
              type: 'String',
              value: 'test'
            }
          ],
          parameters: [
            {
              identifier: 'idtest',
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['www.test.com']
                }
              }
            }
          ],
          capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          skipOnStackStatuses: ['UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'],
          tags: '[{"key": "value"}]'
        }
      }
    })
    const { container, getByText, getByTestId } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    userEvent.click(getByText('common.optionalConfig'))

    await waitFor(() => expect(getByTestId('inlineParamFiles')).toBeTruthy())
    userEvent.click(getByTestId('inlineParamFiles'))

    await waitFor(() => expect(getByText('submit')).toBeTruthy())
    await act(async () => userEvent.click(getByText('submit')))
    await waitForElementToBeRemoved(() => getByTestId('inlineParamClose'))
    expect(container).toMatchSnapshot()
  })

  test('should error on submit with invalid data', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { getByText } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
        ref={ref}
      />
    )
    await act(() => ref.current?.submitForm()!)

    const regionError = getByText('cd.cloudFormation.errors.region')
    expect(regionError).toBeInTheDocument()

    const stackNameError = getByText('cd.cloudFormation.errors.stackName')
    expect(stackNameError).toBeInTheDocument()

    const templateFileError = getByText('cd.cloudFormation.errors.templateBody')
    expect(templateFileError).toBeInTheDocument()

    const connectorError = getByText('pipelineSteps.build.create.connectorRequiredError')
    expect(connectorError).toBeInTheDocument()

    const provIDError = getByText('common.validation.provisionerIdentifierIsRequired')
    expect(provIDError).toBeInTheDocument()

    const timeoutError = getByText('validation.timeout10SecMinimum')
    expect(timeoutError).toBeInTheDocument()

    const nameError = getByText('pipelineSteps.stepNameRequired')
    expect(nameError).toBeInTheDocument()
  })

  test('should be able to submit', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'create stack',
      identifier: 'create_stack',
      timeout: '10m',
      spec: {
        provisionerIdentifier: 'provisionerID',
        configuration: {
          stackName: 'test_name',
          connectorRef: RUNTIME_INPUT_VALUE,
          region: 'ireland',
          templateFile: {
            type: 'Remote',
            spec: {
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['test/file/path']
                }
              }
            }
          },
          // optional
          parameterOverrides: [
            {
              name: 'OtherName',
              type: 'String',
              value: 'test'
            }
          ],
          parameters: [
            {
              identifier: 'idtest',
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['www.test.com']
                }
              }
            }
          ],
          capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
          skipOnStackStatuses: ['UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'],
          tags: '[{"key": "value"}]'
        }
      }
    })
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
        ref={ref}
      />
    )
    await act(() => ref.current?.submitForm()!)

    expect(container).toMatchSnapshot()
  })

  test('should show api capabilities error', () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws(true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { getAllByText } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(getAllByText('useCFCapabilitiesForAws error')).toBeTruthy()
  })

  test('should show api capabilities loading state', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws(false, true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should show api regions error', async () => {
    useCFStatesForAws()
    useCFCapabilitiesForAws()
    useListAwsRegions(true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { getAllByText } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(getAllByText('useListAwsRegions error')).toBeTruthy()
  })

  test('should show api regions loading state', async () => {
    useCFStatesForAws()
    useCFCapabilitiesForAws()
    useListAwsRegions(false, true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should show api aws statues error', async () => {
    useListAwsRegions()
    useCFCapabilitiesForAws()
    useCFStatesForAws(true)
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { getAllByText } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(getAllByText('useCFStatesForAws error')).toBeTruthy()
  })

  test('should show api aws statues loading states', async () => {
    useCFStatesForAws(false, true)
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should show api aws roles error', async () => {
    useGetIamRolesForAws(true)
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { getAllByText } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )
    expect(getAllByText('useGetIamRolesForAws error')).toBeTruthy()
  })

  test('should render runtime components', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: 'test',
      identifier: 'test',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        provisionerIdentifier: RUNTIME_INPUT_VALUE,
        configuration: {
          stackName: RUNTIME_INPUT_VALUE,
          connectorRef: RUNTIME_INPUT_VALUE,
          region: RUNTIME_INPUT_VALUE,
          templateFile: {
            type: 'Remote',
            spec: {
              store: {
                spec: {
                  paths: RUNTIME_INPUT_VALUE
                }
              }
            }
          },
          parameters: [
            {
              identifier: 'idtest',
              store: {
                type: 'Github',
                spec: {
                  branch: RUNTIME_INPUT_VALUE,
                  connectorRef: RUNTIME_INPUT_VALUE,
                  gitFetchType: RUNTIME_INPUT_VALUE,
                  paths: RUNTIME_INPUT_VALUE
                }
              }
            }
          ],
          capabilities: RUNTIME_INPUT_VALUE,
          skipOnStackStatuses: RUNTIME_INPUT_VALUE,
          tags: RUNTIME_INPUT_VALUE
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.Edit}
        initialValues={initialValues()}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render input view', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.InputVariable}
        initialValues={initialValues()}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render variable view', async () => {
    useCFStatesForAws()
    useListAwsRegions()
    useCFCapabilitiesForAws()
    const initialValues = () => ({
      type: StepType.CloudFormationCreateStack,
      name: '',
      identifier: '',
      timeout: '',
      spec: {
        provisionerIdentifier: '',
        configuration: {
          stackName: '',
          connectorRef: '',
          region: '',
          templateFile: {
            type: 'Inline',
            spec: {}
          }
        }
      }
    })
    const { container } = render(
      <TestStepWidget
        onUpdate={jest.fn()}
        type={StepType.CloudFormationCreateStack}
        stepViewType={StepViewType.InputSet}
        initialValues={initialValues()}
      />
    )

    expect(container).toMatchSnapshot()
  })
})
