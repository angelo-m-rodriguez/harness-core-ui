/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import MiniExecutionGraph from '../MiniExecutionGraph'

import pipeline from './pipeline.json'

jest.mock('@pipeline/components/PipelineSteps/PipelineStepFactory', () => ({}))

describe('<MiniExecutionGraph /> tests', () => {
  test('snapshot test', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(
      <MiniExecutionGraph
        pipelineExecution={pipeline as any}
        projectIdentifier="TEST_PROJECT"
        orgIdentifier="TEST_ORG"
        accountId="TEST_ACCOUNT"
        source="executions"
        module="cd"
      />
    )

    expect(container).toMatchSnapshot()
  })
})
