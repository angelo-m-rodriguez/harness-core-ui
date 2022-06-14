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
import type { AzureSlotDeploymentVariableStepProps } from '../AzureSlotDeploymentInterface'
import { AzureSlotDeploymentVariableStep } from '../AzureSlotDeploymentVariableView'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const props = {
  initialValues: {
    type: 'AzureSlotDeployment',
    name: 'asd',
    identifier: 'asd',
    timeout: '10s',
  },
  originalData: {
    type: 'AzureSlotDeployment',
    name: 'asd',
    identifier: 'asd',
    timeout: '10s',
  },
  stageIdentifier: 'qaStage',
  onUpdate: jest.fn(),
  metadataMap: {
    'step-name': {
      yamlProperties: {
        fqn: 'pipeline.stages.qaStage.execution.steps.asd.name',
        localName: 'step.asd.name'
      }
    },
    'step-timeout': {
      yamlProperties: {
        fqn: 'pipeline.stages.qaStage.execution.steps.asd.timeout',
        localName: 'step.asd.timeout'
      }
    }
  },
  stepType: StepType.AzureSlotDeployment
} as AzureSlotDeploymentVariableStepProps

describe('Azure Slot Deployment Variable view ', () => {
  test('Initial render', () => {
    const { container } = render(
      <AzureSlotDeploymentVariableStep
        initialValues={{
          type: 'AzureSlotDeployment',
          name: 'asd',
          identifier: 'asd',
          timeout: '10m',
        }}
        stepType={StepType.AzureSlotDeployment}
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
        <AzureSlotDeploymentVariableStep
          initialValues={{
            type: 'AzureSlotDeployment',
            name: 'asd',
            identifier: 'asd',
            timeout: '10m',
          }}
          stepType={StepType.AzureSlotDeployment}
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
        <AzureSlotDeploymentVariableStep {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with no config', () => {
    const { container } = render(
      <TestWrapper>
        <AzureSlotDeploymentVariableStep
          {...props}
          initialValues={{
            type: 'AzureSlotDeployment',
            name: 'asd',
            identifier: 'asd',
            timeout: '10m'
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
