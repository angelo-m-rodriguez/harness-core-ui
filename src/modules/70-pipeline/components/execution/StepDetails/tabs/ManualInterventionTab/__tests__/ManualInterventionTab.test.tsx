/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, queryByAttribute } from '@testing-library/react'

import routes from '@common/RouteDefinitions'
import { useHandleManualInterventionInterrupt } from 'services/pipeline-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { accountPathProps, executionPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import { Strategy } from '@pipeline/utils/FailureStrategyUtils'
import { ManualInterventionTab } from '../ManualInterventionTab'
import data from './data.json'

const mutate = jest.fn()
jest.mock('services/pipeline-ng', () => ({
  useHandleManualInterventionInterrupt: jest.fn(() => ({ mutate }))
}))

const showError = jest.fn()
jest.mock('@wings-software/uicore', () => ({
  ...jest.requireActual('@wings-software/uicore'),
  useToaster: jest.fn(() => ({ showError }))
}))

const TEST_PATH = routes.toExecutionPipelineView({
  ...accountPathProps,
  ...executionPathProps,
  ...pipelineModuleParams
})

const pathParams = {
  accountId: 'TEST_ACCOUNT_ID',
  orgIdentifier: 'TEST_ORG',
  projectIdentifier: 'TEST_PROJECT',
  pipelineIdentifier: 'TEST_PIPELINE',
  executionIdentifier: 'TEST_EXECUTION',
  source: 'executions',
  module: 'cd',
  stageId: 'selectedStageId'
}

const AllStrategies = Object.values(Strategy)

describe('<ManualInterventionTab /> tests', () => {
  beforeEach(() => {
    mutate.mockClear()
    showError.mockClear()
  })

  test('snapshot test', () => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={pathParams}>
        <ManualInterventionTab step={data as any} allowedStrategies={AllStrategies} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test.each(AllStrategies)('interrupt %s works', async strategy => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={pathParams}>
        <ManualInterventionTab step={data as any} allowedStrategies={AllStrategies} />
      </TestWrapper>
    )

    const btn = queryByAttribute('value', container, strategy)!

    fireEvent.click(btn)

    await waitFor(() => {
      expect(mutate).toHaveBeenLastCalledWith(undefined, {
        headers: { 'content-type': 'application/json' },
        queryParams: {
          accountIdentifier: pathParams.accountId,
          interruptType: strategy,
          orgIdentifier: pathParams.orgIdentifier,
          projectIdentifier: pathParams.projectIdentifier
        }
      })
    })
  })

  test('handles error', () => {
    ;(useHandleManualInterventionInterrupt as jest.Mock).mockImplementationOnce(() => ({
      mutate,
      error: { message: 'error occured' }
    }))

    render(
      <TestWrapper path={TEST_PATH} pathParams={pathParams}>
        <ManualInterventionTab step={data as any} allowedStrategies={AllStrategies} />
      </TestWrapper>
    )

    expect(showError).toHaveBeenCalled()
  })
})
