/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button } from '@wings-software/uicore'
import { render, fireEvent, waitFor, queryByText } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { accountPathProps, executionPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { DelegateTaskData, useDelegateSelectionLogsModal } from '../DelegateSelectionLogs'
import mock from './logsMock.json'

const TEST_PATH = routes.toExecutionPipelineView({
  ...accountPathProps,
  ...executionPathProps,
  ...pipelineModuleParams
})

jest.mock('services/portal', () => ({
  useGetSelectionLogsV2: jest.fn(() => ({ data: mock, loading: false }))
}))

const pathParams = {
  accountId: 'TEST_ACCOUNT_ID',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  pipelineIdentifier: 'TEST_PIPELINE',
  executionIdentifier: 'TEST_EXECUTION',
  module: 'cd',
  source: 'executions',
  stageId: 'selectedStageId'
}

function TestComponent({ taskData }: { taskData: DelegateTaskData[] }): React.ReactElement {
  const { openDelegateSelectionLogsModal } = useDelegateSelectionLogsModal()
  const openDialog = (task: DelegateTaskData): void => {
    openDelegateSelectionLogsModal(task)
  }
  return (
    <div>
      {taskData.map(task => (
        <Button key={task.taskId} onClick={() => openDialog(task)} text={task.taskName} />
      ))}
    </div>
  )
}
describe('<ExecutionStepDetails /> tests', () => {
  let mockDate: jest.SpyInstance<unknown> | undefined
  let mocktime: jest.SpyInstance<unknown> | undefined
  beforeAll(() => {
    mockDate = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('4:15')
    mocktime = jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2020-04-15')
  })

  afterAll(() => {
    mockDate?.mockRestore()
    mocktime?.mockRestore()
  })
  test('renders normal step', async () => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={pathParams}>
        <TestComponent taskData={[{ taskId: 'taskId', taskName: 'taskName', delegateName: 'delegateName' }]} />
      </TestWrapper>
    )
    const btn = queryByText(container, 'taskName')
    fireEvent.click(btn!)
    const modal = findDialogContainer()
    await waitFor(() => queryByText(modal!, 'Selected'))
    expect(findDialogContainer()).toMatchSnapshot()
  })
})
