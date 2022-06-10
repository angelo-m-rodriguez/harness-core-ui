/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, fireEvent } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'

import { K8sApplyStep } from '../K8sApplyStep'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
const overrides = [
  {
    manifest: {
      identifier: 'Test',
      type: 'Values' as any,
      spec: {
        store: {
          type: 'Git',
          spec: {
            branch: 'test-3',
            connectorRef: 'account.test',
            gitFetchType: 'Branch',
            paths: ['temp'],
            repoName: 'reponame'
          }
        }
      }
    }
  }
]
describe('Test K8sApplyStep', () => {
  beforeEach(() => {
    factory.registerStep(new K8sApplyStep())
  })
  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.K8sApply} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render edit view as edit step', () => {
    const { container, getByText } = render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2'],
            overrides: overrides
          }
        }}
        type={StepType.K8sApply}
        stepViewType={StepViewType.Edit}
      />
    )
    //remove one
    fireEvent.click(container.querySelector('[data-icon="main-trash"]') as HTMLElement)

    //add new
    fireEvent.click(getByText('addFileText'))
    expect(container).toMatchSnapshot()
  })
  test('should render edit view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2']
          }
        }}
        template={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,

          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: RUNTIME_INPUT_VALUE,
            filePaths: RUNTIME_INPUT_VALUE
          }
        }}
        allValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: false,
            filePaths: RUNTIME_INPUT_VALUE
          }
        }}
        type={StepType.K8sApply}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as edit step with all runtime inputs', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: RUNTIME_INPUT_VALUE,
            filePaths: RUNTIME_INPUT_VALUE
          }
        }}
        type={StepType.K8sApply}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: false,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2']
          }
        }}
        template={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: false,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2']
          }
        }}
        allValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: false,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2']
          }
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.k8sApply.name',
                localName: 'step.k8sApply.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.k8sApply.timeout',
                localName: 'step.k8sApply.timeout'
              }
            },
            'step-filePaths': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.k8sApply.filepaths',
                localName: 'step.k8sApply.filepaths'
              }
            },
            'step-skipdryRun': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.k8sApply.skipDryRun',
                localName: 'step.k8sApply.skipDryRun'
              }
            },
            'step-skipSteadyCheck': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.k8sApply.skipSteadyStateCheck',
                localName: 'step.k8sApply.skipSteadyStateCheck'
              }
            }
          },
          variablesData: {
            type: 'K8sApply',
            name: 'step-name',
            identifier: 'Test_A',
            timeout: 'step-timeout',

            spec: {
              skipDryRun: 'step-skipdryRun',
              skipSteadyStateCheck: 'step-skipSteadyCheck',
              filePaths: ['step-filePaths', 'test-2']
            }
          }
        }}
        type={StepType.K8sApply}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('submitting the form with right payload', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: false,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2'],
            overrides: overrides
          }
        }}
        type={StepType.K8sApply}
        ref={ref}
        onUpdate={onUpdate}
        stepViewType={StepViewType.Edit}
      />
    )
    await act(() => ref.current?.submitForm()!)
    expect(onUpdate).toHaveBeenCalledWith({
      identifier: 'Test_A',
      name: 'Test A',
      spec: {
        filePaths: ['test-1', 'test-2'],
        skipDryRun: false,
        skipSteadyStateCheck: false,
        overrides: overrides
      },
      timeout: '10m',
      type: 'K8sApply'
    })
  })
  test('Minimum time cannot be less than 10s', () => {
    const data = {
      data: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '1s',
        type: 'K8sApplyStep',
        spec: {
          skipDryRun: false,
          skipSteadyStateCheck: false,
          filePaths: null
        }
      },
      template: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '<+input>',
        type: 'K8sApplyStep',
        spec: {
          skipDryRun: false,
          skipSteadyStateCheck: false,
          filePaths: RUNTIME_INPUT_VALUE
        }
      },
      viewType: StepViewType.TriggerForm
    }
    const response = new K8sApplyStep().validateInputSet(data)
    expect(response).toMatchSnapshot()
    const processFormResponse = new K8sApplyStep().processFormData(data.template)
    expect(processFormResponse).toMatchSnapshot()
  })

  test('should render edit view with path and inputSet', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: false,
            filePaths: ['test-1', 'test-2'],
            overrides: overrides
          }
        }}
        path={'/abc'}
        template={{
          type: 'K8sApply',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            skipDryRun: RUNTIME_INPUT_VALUE,
            skipSteadyStateCheck: RUNTIME_INPUT_VALUE,
            filePaths: RUNTIME_INPUT_VALUE,
            overrides: [
              {
                manifest: {
                  identifier: 'Test',
                  type: 'Values' as any,
                  spec: {
                    store: {
                      type: 'Git',
                      spec: {
                        branch: RUNTIME_INPUT_VALUE,
                        connectorRef: RUNTIME_INPUT_VALUE,
                        gitFetchType: 'Branch',
                        paths: RUNTIME_INPUT_VALUE,
                        repoName: 'reponame'
                      }
                    }
                  }
                }
              }
            ]
          }
        }}
        type={StepType.K8sApply}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })
  test('should render null for StepviewType.template', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.K8sApply} stepViewType={StepViewType.Template} />
    )
    expect(container).toMatchSnapshot()
  })
})
