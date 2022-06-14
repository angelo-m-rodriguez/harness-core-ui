/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'

import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CreatePr } from '../CreatePrStep'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

describe('Test CreatePRStep', () => {
  beforeEach(() => {
    factory.registerStep(new CreatePr())
  })
  test('should render edit view as new step', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.CreatePR} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('expand override config panel', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.CreatePR} stepViewType={StepViewType.Edit} />
    )
    const element = container.querySelector('[data-testid="override-config-summary"]')
    fireEvent.click(element!)
    expect(container).toMatchSnapshot()
  })

  test('should render edit view as edit step', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: StepType.CreatePR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,

          spec: {
            overrideConfig: false
          }
        }}
        type={StepType.CreatePR}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render edit view as edit step with runtime inputs', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: StepType.CreatePR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,

          spec: {
            overrideConfig: true,
            source: {
              spec: {
                updateConfigScript: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        type={StepType.CreatePR}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render edit view as inputset step', () => {
    const { container } = render(
      <TestStepWidget
        template={{
          type: StepType.CreatePR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: RUNTIME_INPUT_VALUE,

          spec: {
            overrideConfig: true,
            source: {
              spec: {
                updateConfigScript: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        initialValues={{
          type: StepType.CreatePR,
          name: 'Test A',
          identifier: 'Test_A',
          timeout: 10,

          spec: {
            overrideConfig: true,
            source: {
              spec: {
                updateConfigScript: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        type={StepType.CreatePR}
        stepViewType={StepViewType.InputSet}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'CreatePR',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            source: {
              spec: {
                updateConfigScript: 'test'
              }
            }
          }
        }}
        template={{
          type: 'CreatePR',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            source: {
              spec: {
                updateConfigScript: 'test'
              }
            }
          }
        }}
        allValues={{
          type: 'CreatePR',
          name: 'Test A',
          identifier: 'Test_A',
          timeout: '10m',

          spec: {
            source: {
              spec: {
                updateConfigScript: 'test'
              }
            }
          }
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.createPR.name',
                localName: 'step.createPR.name'
              }
            },

            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.createPR.timeout',
                localName: 'step.createPR.timeout'
              }
            },
            'step-updateConfigScript': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.createPR.updateConfigScript',
                localName: 'step.createPR.updateConfigScript'
              }
            }
          },
          variablesData: {
            type: 'CreatePR',
            name: 'step-name',
            identifier: 'Test_A',
            timeout: 'step-timeout',

            spec: {
              source: {
                spec: {
                  updateConfigScript: 'test'
                }
              }
            }
          }
        }}
        type={StepType.CreatePR}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })
})
