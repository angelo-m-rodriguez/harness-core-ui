/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import { TestWrapper } from '@common/utils/testUtils'
import type { AzureTrafficShiftVariableStepProps } from '../AzureTrafficShiftInterface'
import { AzureTrafficShiftVariableStep } from '../AzureTrafficShiftVariableView'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const props = {
  initialValues: {
    type: 'AzureTrafficShift',
    name: 'ats',
    identifier: 'ats',
    timeout: '10s'
  },
  originalData: {
    type: 'AzureTrafficShift',
    name: 'ats',
    identifier: 'ats',
    timeout: '10s'
  },
  stageIdentifier: 'qaStage',
  onUpdate: jest.fn(),
  metadataMap: {
    'step-name': {
      yamlProperties: {
        fqn: 'pipeline.stages.qaStage.execution.steps.ats.name',
        localName: 'step.ats.name'
      }
    },
    'step-timeout': {
      yamlProperties: {
        fqn: 'pipeline.stages.qaStage.execution.steps.ats.timeout',
        localName: 'step.ats.timeout'
      }
    }
  },
  stepType: StepType.AzureTrafficShift
} as AzureTrafficShiftVariableStepProps

describe('Azure Traffic Shift Variable view ', () => {
  test('Initial render', () => {
    const { container } = render(
      <AzureTrafficShiftVariableStep
        initialValues={{
          type: 'AzureTrafficShift',
          name: 'ats',
          identifier: 'ats',
          timeout: '10m'
        }}
        stepType={StepType.AzureTrafficShift}
        onUpdate={() => jest.fn()}
        {...{
          stageIdentifier: 'qaStage',
          metadataMap: props.metadataMap,
          variablesData: props.variablesData
        }}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('Initial render inline with no values', () => {
    const { container } = render(
      <TestWrapper>
        <AzureTrafficShiftVariableStep
          initialValues={{
            type: 'AzureTrafficShift',
            name: 'ats',
            identifier: 'ats',
            timeout: '10m'
          }}
          stepType={StepType.AzureTrafficShift}
          onUpdate={() => jest.fn()}
          {...{
            stageIdentifier: 'qaStage',
            metadataMap: props.metadataMap,
            variablesData: props.variablesData
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should render with inline config', () => {
    const { container } = render(
      <TestWrapper>
        <AzureTrafficShiftVariableStep {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with no config', () => {
    const { container } = render(
      <TestWrapper>
        <AzureTrafficShiftVariableStep
          {...props}
          initialValues={{
            type: 'AzureTrafficShift',
            name: 'ats',
            identifier: 'ats',
            timeout: '10m'
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
