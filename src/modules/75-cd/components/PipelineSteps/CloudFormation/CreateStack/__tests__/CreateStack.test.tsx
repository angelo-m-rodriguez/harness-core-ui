/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, act, queryByAttribute, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE, MultiTypeInputType } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import {} from '../../CloudFormationInterfaces.types'
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

const renderComponent = (data: any, stepType = StepViewType.Edit) => {
  return render(
    <TestStepWidget
      onUpdate={jest.fn()}
      allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
      type={StepType.CloudFormationCreateStack}
      stepViewType={stepType}
      {...data}
    />
  )
}

describe('Test Cloudformation create stack', () => {
  beforeAll(() => {
    factory.registerStep(new CFCreateStack())
    useCFCapabilitiesForAws()
    useListAwsRegions()
    useCFStatesForAws()
    useGetConnector()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render edit view as new step', () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as new step with data', () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should open and close remote template modal', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { getByTestId } = renderComponent(data)
    await waitFor(() => expect(getByTestId('remoteTemplate')).toBeTruthy())
    act(() => {
      userEvent.click(getByTestId('remoteTemplate'))
    })

    await waitFor(() => expect(getByTestId('remoteClose')).toBeTruthy())
    const remoteClose = getByTestId('remoteClose')
    act(() => {
      userEvent.click(remoteClose)
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip('should be able to edit inputs', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    const stepName = queryByAttribute('name', container, 'name')
    act(() => {
      userEvent.type(stepName!, ' new name')
    })
    expect(stepName).toHaveDisplayValue(['create stack new name'])

    const timeout = queryByAttribute('name', container, 'timeout')
    act(() => {
      userEvent.clear(timeout!)
      userEvent.type(timeout!, '20m')
    })
    expect(timeout).toHaveDisplayValue('20m')

    const provisionerIdentifier = queryByAttribute('name', container, 'spec.provisionerIdentifier')
    act(() => {
      userEvent.clear(provisionerIdentifier!)
      userEvent.type(provisionerIdentifier!, 'newID')
    })
    expect(provisionerIdentifier).toHaveDisplayValue('newID')

    const region = queryByAttribute('name', container, 'spec.configuration.region')
    act(() => {
      userEvent.click(region!)
    })

    const stackName = queryByAttribute('name', container, 'spec.configuration.stackName')
    act(() => {
      userEvent.clear(stackName!)
      userEvent.type(stackName!, 'new name')
    })
    expect(stackName).toHaveDisplayValue('new name')
  })
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip('should be able to open optional dropdown and remove param', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { getByText, getByTestId } = renderComponent(data)
    await waitFor(() => expect(getByText('common.optionalConfig')).toBeTruthy())
    act(() => {
      userEvent.click(getByText('common.optionalConfig'))
    })

    await waitFor(() => expect(getByTestId('remove-param-0')))
    act(() => {
      userEvent.click(getByTestId('remove-param-0'))
    })
  })

  test('should be able to open remote param modal', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { getByText, getByTestId } = renderComponent(data)
    await waitFor(() => expect(getByText('common.optionalConfig')).toBeTruthy())
    act(() => {
      userEvent.click(getByText('common.optionalConfig'))
    })

    await waitFor(() => expect(getByTestId('remoteParamFiles')).toBeTruthy())
    act(() => {
      userEvent.click(getByTestId('remoteParamFiles'))
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip('should be able to open and close inline param modal', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { getByText, getByTestId } = renderComponent(data)
    await waitFor(() => expect(getByText('common.optionalConfig')).toBeTruthy())
    act(() => {
      userEvent.click(getByText('common.optionalConfig'))
    })

    await waitFor(() => expect(getByTestId('inlineParamFiles')).toBeTruthy())
    act(() => {
      userEvent.click(getByTestId('inlineParamFiles'))
    })

    await waitFor(() => expect(getByTestId('inlineParamClose')).toBeTruthy())
    act(() => {
      userEvent.click(getByTestId('inlineParamClose'))
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip('should error on submit with invalid data', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { getByText } = renderComponent({ ...data, ref })
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
    const data = {
      initialValues: {
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
      }
    }
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = renderComponent({ ...data, ref })
    await act(() => ref.current?.submitForm()!)

    expect(container).toMatchSnapshot()
  })

  test('should show api capabilities error', () => {
    useCFCapabilitiesForAws(true)
    const data = {
      initialValues: {
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
      }
    }
    const { getAllByText } = renderComponent(data)
    expect(getAllByText('useCFCapabilitiesForAws error')).toBeTruthy()
  })

  test('should show api capabilities loading state', async () => {
    useCFCapabilitiesForAws(false, true)
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should show api regions error', async () => {
    useListAwsRegions(true)
    const data = {
      initialValues: {
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
      }
    }
    const { getAllByText } = renderComponent(data)
    expect(getAllByText('useListAwsRegions error')).toBeTruthy()
  })

  test('should show api regions loading state', async () => {
    useListAwsRegions(false, true)
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should show api aws statues error', async () => {
    useCFStatesForAws(true)
    const data = {
      initialValues: {
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
      }
    }
    const { getAllByText } = renderComponent(data)
    expect(getAllByText('useCFStatesForAws error')).toBeTruthy()
  })

  test('should show api aws statues loading states', async () => {
    useCFStatesForAws(false, true)
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should show api aws roles error', async () => {
    useGetIamRolesForAws(true)
    const data = {
      initialValues: {
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
      }
    }
    const { getAllByText } = renderComponent(data)
    expect(getAllByText('useGetIamRolesForAws error')).toBeTruthy()
  })

  test('should render runtime components', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data)

    expect(container).toMatchSnapshot()
  })

  test('should render input view', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data, StepViewType.InputVariable)

    expect(container).toMatchSnapshot()
  })

  test('should render variable view', async () => {
    const data = {
      initialValues: {
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
      }
    }
    const { container } = renderComponent(data, StepViewType.InputSet)

    expect(container).toMatchSnapshot()
  })
})
