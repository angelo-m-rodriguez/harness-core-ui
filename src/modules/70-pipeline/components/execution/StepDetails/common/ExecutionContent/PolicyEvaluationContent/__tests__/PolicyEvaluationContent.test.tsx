/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import routes from '@common/RouteDefinitions'
import { TestWrapper } from '@common/utils/testUtils'
import { executionPathProps, modulePathProps } from '@common/utils/routeUtils'

import { EvaluatedPolicy, PolicyEvaluationContent, PolicyInfo } from '../PolicyEvaluationContent'

import StepProps from '../__mocks__/StepProps.json'

describe('Policy Evaluation Content', () => {
  test('snapshot for no policy details', () => {
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyEvaluationContent
          step={{
            outcomes: {}
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot for all policy set statuses and policy set headers', () => {
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyEvaluationContent step={StepProps as any} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Policy Info under Policy Evaluation Content', () => {
  test('snapshot renders for passed policy', () => {
    const policy = StepProps.outcomes.output.policySetDetails['org.policySet1'].policyDetails['org.policy1']
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyInfo policy={policy as EvaluatedPolicy} numberInList={1} policyStepEvaluationId={'2980'} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot renders for failed policy with 1 deny message', () => {
    const policy = StepProps.outcomes.output.policySetDetails['account.policySet1'].policyDetails['account.policy1']
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyInfo policy={policy as EvaluatedPolicy} numberInList={1} policyStepEvaluationId={'2980'} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot renders for failed policy with > 1 deny messages', () => {
    const policy = StepProps.outcomes.output.policySetDetails['account.policySet1'].policyDetails['account.policy2']
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyInfo policy={policy as EvaluatedPolicy} numberInList={1} policyStepEvaluationId={'2980'} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot renders for failed policy with 1 error message', () => {
    const policy = StepProps.outcomes.output.policySetDetails['account.policySet1'].policyDetails['account.policy3']
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyInfo policy={policy as EvaluatedPolicy} numberInList={1} policyStepEvaluationId={'2980'} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('snapshot renders for policy with warning', () => {
    const policy = StepProps.outcomes.output.policySetDetails['policySet1'].policyDetails['policy1']
    const { container } = render(
      <TestWrapper
        path={routes.toExecutionPipelineView({ ...executionPathProps, ...modulePathProps })}
        pathParams={{
          accountId: 'acc',
          orgIdentifier: 'org',
          projectIdentifier: 'project',
          pipelineIdentifier: 'pipeline',
          executionIdentifier: 'execution',
          source: 'executions',
          module: 'cd'
        }}
      >
        <PolicyInfo policy={policy as EvaluatedPolicy} numberInList={1} policyStepEvaluationId={'2980'} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
