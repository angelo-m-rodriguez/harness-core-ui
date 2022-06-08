/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { TestWrapper } from '@common/utils/testUtils'
import { TerraformPlan } from '../TerraformPlan'

const mockGetCallFunction = jest.fn()
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/portal', () => ({
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return []
  })
}))

jest.mock('@common/components/MonacoEditor/MonacoEditor')

describe('Test TerraformPlan', () => {
  beforeEach(() => {
    factory.registerStep(new TerraformPlan())
  })
  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.TerraformPlan} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render edit view as edit step', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply'
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.TerraformPlan} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render edit view with command Destroy', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Destroy'
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render edit view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              spec: {
                targets: RUNTIME_INPUT_VALUE,
                environmentVariables: RUNTIME_INPUT_VALUE,
                configFiles: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          }
        }}
        template={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              spec: {
                targets: RUNTIME_INPUT_VALUE,
                environmentVariables: RUNTIME_INPUT_VALUE,
                configFiles: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          }
        }}
        allValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              spec: {
                targets: RUNTIME_INPUT_VALUE,
                environmentVariables: RUNTIME_INPUT_VALUE,
                configFiles: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          }
        }}
        inputSetData={{
          template: {
            type: 'TerraformPlan',
            name: 'Test A',
            identifier: 'Test_A',
            timeout: RUNTIME_INPUT_VALUE,
            delegateSelectors: ['test-1', 'test-2'],
            spec: {
              provisionerIdentifier: RUNTIME_INPUT_VALUE,
              configuration: {
                command: 'Apply',
                spec: {
                  targets: RUNTIME_INPUT_VALUE,
                  environmentVariables: RUNTIME_INPUT_VALUE,
                  configFiles: {
                    store: {
                      spec: {
                        connectorRef: RUNTIME_INPUT_VALUE
                      }
                    }
                  }
                }
              }
            }
          },
          path: 'test'
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view for FF EXPORT_TF_PLAN_JSON_NG enabled', () => {
    const { container } = render(
      <TestWrapper
        defaultAppStoreValues={{
          featureFlags: { EXPORT_TF_PLAN_JSON_NG: true }
        }}
      >
        <TestStepWidget
          initialValues={{
            type: 'TerraformPlan',
            name: 'Test A',
            identifier: 'Test_A',
            timeout: '10m',

            delegateSelectors: ['test-1', 'test-2'],
            spec: {
              provisionerIdentifier: RUNTIME_INPUT_VALUE,
              configuration: {
                command: 'Apply',
                spec: {
                  targets: RUNTIME_INPUT_VALUE,
                  environmentVariables: RUNTIME_INPUT_VALUE,
                  configFiles: {
                    store: {
                      spec: {
                        connectorRef: RUNTIME_INPUT_VALUE
                      }
                    }
                  }
                },
                exportTerraformPlanJson: true
              }
            }
          }}
          template={{
            type: 'TerraformPlan',
            name: 'Test A',
            identifier: 'Test_A',
            timeout: RUNTIME_INPUT_VALUE,
            delegateSelectors: ['test-1', 'test-2'],
            spec: {
              provisionerIdentifier: RUNTIME_INPUT_VALUE,
              configuration: {
                command: 'Apply',
                spec: {
                  targets: RUNTIME_INPUT_VALUE,
                  environmentVariables: RUNTIME_INPUT_VALUE,
                  configFiles: {
                    store: {
                      spec: {
                        connectorRef: RUNTIME_INPUT_VALUE
                      }
                    }
                  }
                },
                exportTerraformPlanJson: true
              }
            }
          }}
          allValues={{
            type: 'TerraformPlan',
            name: 'Test A',
            identifier: 'Test_A',
            timeout: '10m',
            delegateSelectors: ['test-1', 'test-2'],
            spec: {
              provisionerIdentifier: RUNTIME_INPUT_VALUE,
              configuration: {
                command: 'Apply',
                spec: {
                  targets: RUNTIME_INPUT_VALUE,
                  environmentVariables: RUNTIME_INPUT_VALUE,
                  configFiles: {
                    store: {
                      spec: {
                        connectorRef: RUNTIME_INPUT_VALUE
                      }
                    }
                  }
                },
                exportTerraformPlanJson: true
              }
            }
          }}
          inputSetData={{
            template: {
              type: 'TerraformPlan',
              name: 'Test A',
              identifier: 'Test_A',
              timeout: RUNTIME_INPUT_VALUE,
              delegateSelectors: ['test-1', 'test-2'],
              spec: {
                provisionerIdentifier: RUNTIME_INPUT_VALUE,
                configuration: {
                  command: 'Apply',
                  spec: {
                    targets: RUNTIME_INPUT_VALUE,
                    environmentVariables: RUNTIME_INPUT_VALUE,
                    configFiles: {
                      store: {
                        spec: {
                          connectorRef: RUNTIME_INPUT_VALUE
                        }
                      }
                    }
                  }
                },
                exportTerraformPlanJson: true
              }
            },
            path: 'test'
          }}
          type={StepType.TerraformPlan}
          stepViewType={StepViewType.InputSet}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should submit form for terraform plan', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const { container } = render(
      <TestStepWidget
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={onUpdate}
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            provisionerIdentifier: 'test',
            delegateSelectors: ['anyonefive'],
            configuration: {
              command: 'Apply',
              secretManagerRef: {
                label: 'secret-1',
                value: 'sercet-1',
                scope: 'account'
              },
              configFiles: {
                store: {
                  spec: {
                    connectorRef: {
                      label: 'test',
                      value: 'test',
                      scope: 'account',
                      connector: { type: 'Git' }
                    }
                  }
                }
              },
              backendConfig: {
                spec: {
                  content: 'test-content'
                }
              },
              targets: ['test-1'],
              environmentVariables: [{ name: 'test', type: 'String', value: 'abc' }],
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    spec: {
                      content: 'test'
                    }
                  }
                }
              ]
            }
          }
        }}
      />
    )
    await act(() => ref.current?.submitForm()!)
    expect(onUpdate).toHaveBeenCalledWith({
      type: 'TerraformPlan',
      name: 'Test A',
      identifier: 'Test_A',
      timeout: '10m',

      spec: {
        provisionerIdentifier: 'test',
        delegateSelectors: ['anyonefive'],
        configuration: {
          command: 'Apply',
          secretManagerRef: {
            label: 'secret-1',
            value: 'sercet-1',
            scope: 'account'
          },
          configFiles: {
            store: {
              spec: {
                connectorRef: 'test',
                gitFetchType: 'Branch'
              },
              type: 'Git'
            }
          },
          backendConfig: {
            spec: {
              content: 'test-content'
            },
            type: 'Inline'
          },
          targets: ['test-1'],
          environmentVariables: [{ name: 'test', type: 'String', value: 'abc' }],
          varFiles: [
            {
              varFile: {
                type: 'Inline',
                spec: {
                  content: 'test'
                }
              }
            }
          ]
        }
      }
    })
    expect(container).toMatchSnapshot()
  })
  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    connectorRef: 'test'
                  }
                }
              },
              backendConfig: {
                spec: {
                  content: 'test-content'
                }
              },
              targets: ['test-1'],
              environmentVariables: [{ key: 'test', value: 'abc' }],
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    spec: {
                      content: 'test'
                    }
                  }
                }
              ]
            }
          }
        }}
        template={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            backendConfig: {
              spec: {
                content: 'test-content'
              }
            },

            targets: ['test-1'],
            environmentVariables: [{ key: 'test', value: 'abc' }],
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    connectorRef: 'test'
                  }
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    spec: {
                      content: 'test'
                    }
                  }
                }
              ]
            }
          }
        }}
        allValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              backendConfig: {
                spec: {
                  content: 'test-content'
                }
              },

              targets: ['test-1'],
              environmentVariables: [{ key: 'test', value: 'abc' }],
              configFiles: {
                store: {
                  spec: {
                    connectorRef: 'test'
                  }
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    spec: {
                      content: 'test'
                    }
                  }
                }
              ]
            }
          }
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.TerraformPlan.name',
                localName: 'step.TerraformPlan.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.TerraformPlan.timeout',
                localName: 'step.TerraformPlan.timeout'
              }
            },
            'step-delegateSelectors': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.TerraformPlan.delegateSelectors',
                localName: 'step.TerraformPlan.delegateSelectors'
              }
            },
            'step-provisionerIdentifier': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.TerraformPlan.provisionerIdentifier',
                localName: 'step.TerraformPlan.provisionerIdentifier'
              }
            }
          },
          variablesData: {
            type: 'TerraformPlan',
            name: 'step-name',
            identifier: 'Test_A',
            timeout: 'step-timeout',

            delegateSSelectors: ['test-1', 'test-2'],
            spec: {
              provisionerIdentifier: 'step-provisionerIdentifier',
              configuration: {
                command: 'Apply',
                configFiles: {
                  store: {
                    spec: {
                      connectorRef: 'test'
                    }
                  }
                },

                targets: ['test-1'],
                environmentVariables: [{ key: 'test', value: 'abc' }],
                varFiles: [
                  {
                    varFile: {
                      type: 'Inline',
                      spec: {
                        content: 'test'
                      }
                    }
                  }
                ]
              }
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('renders more than one var file', async () => {
    const { container, getByText } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                },
                {
                  varFile: {
                    type: 'Remote',
                    connectorRef: 'test',
                    branch: 'testBranch',
                    gitFetchType: 'Branch'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(getByText('common.optionalConfig'))
    expect(container).toMatchSnapshot()
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('click on add tf var file -should open the dialog', async () => {
    const { container, getByText } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                },
                {
                  varFile: {
                    type: 'Remote',
                    connectorRef: 'test',
                    branch: 'testBranch',
                    gitFetchType: 'Branch'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    fireEvent.click(getByText('common.optionalConfig'))

    await act(() => {
      fireEvent.click(getByText('pipelineSteps.addTerraformVarFile'))
      expect(container).toMatchSnapshot()

      fireEvent.click(container.querySelector('[data-name=edit-inline-0] .bp3-icon-edit')!)
      expect(container).toMatchSnapshot()
    })
  })

  test('should render input set view', () => {
    const { container } = render(
      <TestStepWidget
        path={'test'}
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              workspace: RUNTIME_INPUT_VALUE,
              configFiles: {
                store: {
                  spec: {
                    branch: RUNTIME_INPUT_VALUE,
                    folderPath: RUNTIME_INPUT_VALUE,
                    connectorRef: {
                      label: 'test',
                      Scope: 'Account',
                      value: 'test',
                      connector: {
                        type: 'GIT',
                        spec: {
                          val: 'test'
                        }
                      }
                    }
                  }
                }
              },
              backendConfig: {
                spec: {
                  content: RUNTIME_INPUT_VALUE
                }
              }
            },
            targets: RUNTIME_INPUT_VALUE,
            environmentVariables: RUNTIME_INPUT_VALUE
          }
        }}
        template={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              workspace: RUNTIME_INPUT_VALUE,
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    branch: RUNTIME_INPUT_VALUE,
                    folderPath: RUNTIME_INPUT_VALUE,
                    connectorRef: RUNTIME_INPUT_VALUE
                  }
                }
              },
              backendConfig: {
                spec: {
                  content: RUNTIME_INPUT_VALUE
                }
              }
            },
            targets: RUNTIME_INPUT_VALUE,
            environmentVariables: RUNTIME_INPUT_VALUE
          }
        }}
        allValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE,
            configuration: {
              command: 'Apply',
              workspace: RUNTIME_INPUT_VALUE,
              configFiles: {
                store: {
                  spec: {
                    branch: RUNTIME_INPUT_VALUE,
                    folderPath: RUNTIME_INPUT_VALUE,
                    connectorRef: RUNTIME_INPUT_VALUE
                  }
                }
              }
            },
            targets: RUNTIME_INPUT_VALUE,
            environmentVariables: RUNTIME_INPUT_VALUE
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    gitFetchType: 'Branch',
                    branch: 'test-branch',
                    connectorRef: 'test'
                  }
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                },
                {
                  varFile: {
                    type: 'Remote',
                    connectorRef: 'test',
                    branch: 'testBranch',
                    gitFetchType: 'Branch'
                  }
                }
              ]
            }
          }
        }}
        template={{
          type: 'TerraformDestroy',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    gitFetchType: 'Branch',
                    branch: 'test-branch',
                    connectorRef: 'test'
                  }
                }
              },

              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                },
                {
                  varFile: {
                    type: 'Remote',
                    connectorRef: 'test',
                    branch: 'testBranch',
                    gitFetchType: 'Branch'
                  }
                }
              ]
            }
          }
        }}
        allValues={{
          type: 'TerraformDestroy',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    gitFetchType: 'Branch',
                    branch: 'test-branch',
                    connectorRef: 'test'
                  }
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                },
                {
                  varFile: {
                    type: 'Remote',
                    connectorRef: 'test',
                    branch: 'testBranch',
                    gitFetchType: 'Branch'
                  }
                }
              ]
            }
          }
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.terraformDestroy.name',
                localName: 'step.terraformDestroy.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.terraformDestroy.timeout',
                localName: 'step.terraformDestroy.timeout'
              }
            },
            'step-delegateSelectors': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.terraformDestroy.delegateSelectors',
                localName: 'step.terraformDestroy.delegateSelectors'
              }
            },
            'step-provisionerIdentifier': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.terraformDestroy.provisionerIdentifier',
                localName: 'step.terraformDestroy.provisionerIdentifier'
              }
            }
          },
          variablesData: {
            type: 'TerraformDestroy',
            name: 'step-name',
            identifier: 'Test_A',
            timeout: 'step-timeout',

            spec: {
              provisionerIdentifier: 'test',
              configuration: {
                command: 'Apply',
                configFiles: {
                  store: {
                    spec: {
                      gitFetchType: 'Branch',
                      branch: 'test-branch',
                      connectorRef: 'test'
                    }
                  }
                },
                varFiles: [
                  {
                    varFile: {
                      type: 'Inline',
                      content: 'test'
                    }
                  },
                  {
                    varFile: {
                      type: 'Remote',
                      connectorRef: 'test',
                      branch: 'testBranch',
                      gitFetchType: 'Branch'
                    }
                  }
                ]
              }
            }
          }
        }}
        type={StepType.TerraformApply}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('renders config file info', async () => {
    render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {}
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    const configPlaceholder = await screen.getByText('cd.configFilePlaceHolder')
    expect(configPlaceholder).toBeInTheDocument()
  })

  test('renders config file info with defined file path', async () => {
    render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'test',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {
                    folderPath: 'some/path'
                  }
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    const configFileName = await screen.findByTestId('some/path')
    expect(configFileName).toBeInTheDocument()
  })

  test('renders config runtime identifier options', async () => {
    const container = render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: 'RUNTIME',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'provisionerIdentifier',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {}
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('opens and closes dialog component', async () => {
    render(
      <TestStepWidget
        initialValues={{
          type: 'TerraformPlan',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: 'RUNTIME',
          delegateSelectors: ['test-1', 'test-2'],
          spec: {
            provisionerIdentifier: 'provisionerIdentifier',
            configuration: {
              command: 'Apply',
              configFiles: {
                store: {
                  spec: {}
                }
              },
              varFiles: [
                {
                  varFile: {
                    type: 'Inline',
                    content: 'test'
                  }
                }
              ]
            }
          }
        }}
        type={StepType.TerraformPlan}
        stepViewType={StepViewType.Edit}
      />
    )

    const configPlaceholder = await screen.getByText('cd.configFilePlaceHolder')
    expect(configPlaceholder).toBeInTheDocument()
    await fireEvent.click(configPlaceholder)

    const closeButton = await screen.getByTestId('close-wizard')
    expect(closeButton).toBeInTheDocument()
    await fireEvent.click(closeButton)
  })
})
