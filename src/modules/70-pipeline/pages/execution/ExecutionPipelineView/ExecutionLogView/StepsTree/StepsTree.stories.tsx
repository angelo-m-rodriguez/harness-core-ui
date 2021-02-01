import React from 'react'
import type { Meta, Story } from '@storybook/react'
import styled from '@emotion/styled'

import { TestWrapper } from '@common/utils/testUtils'
import { StepsTree, StepsTreeProps } from './StepsTree'

import data from './__tests__/data.json'

const Wrapper = styled.div`
  border: 1px solid #eee;
  width: 290px;
  padding: 40px;
  overflow: hidden;
`

export default {
  title: 'Pipelines / Execution / StepsTree',
  component: StepsTree
} as Meta

export const Basic: Story<StepsTreeProps> = args => {
  const [selectedStepId, setSelectedStepId] = React.useState(args.selectedStepId)

  React.useEffect(() => {
    setSelectedStepId(args.selectedStepId)
  }, [args.selectedStepId])

  return (
    <TestWrapper>
      <Wrapper>
        <StepsTree {...args} selectedStepId={selectedStepId} onStepSelect={setSelectedStepId} />
      </Wrapper>
    </TestWrapper>
  )
}

Basic.args = {
  nodes: data as any,
  isRoot: true
}
