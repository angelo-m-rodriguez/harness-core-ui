/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { Meta, Story } from '@storybook/react'
import styled from '@emotion/styled'

import { TestWrapper } from '@common/utils/testUtils'
import MiniExecutionGraph, { MiniExecutionGraphProps } from './MiniExecutionGraph'

import pipeline from './__tests__/pipeline.json'

const Wrapper = styled.div`
  min-height: 500px;
  padding-top: 80px;
  max-width: 300px;
`

export default {
  title: 'Pipelines / Execution / MiniExecutionGraph',
  component: MiniExecutionGraph
} as Meta

export const Basic: Story<MiniExecutionGraphProps> = _args => {
  return (
    <TestWrapper>
      <Wrapper>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MiniExecutionGraph
          pipelineExecution={pipeline as any}
          projectIdentifier="TEST_PROJECT"
          orgIdentifier="TEST_ORG"
          source="executions"
          accountId="TEST_ACCOUNT"
          module="cd"
        />
      </Wrapper>
    </TestWrapper>
  )
}

Basic.args = {}
