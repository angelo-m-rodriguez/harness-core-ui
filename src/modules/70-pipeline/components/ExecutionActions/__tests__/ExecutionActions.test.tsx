/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, findByText, act, RenderResult, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { useStrings } from 'framework/strings'

import { TestWrapper } from '@common/utils/testUtils'
import * as useFeaturesLib from '@common/hooks/useFeatures'
import routes from '@common/RouteDefinitions'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { HandleInterruptQueryParams, useHandleInterrupt, useHandleStageInterrupt } from 'services/pipeline-ng'
import { accountPathProps, executionPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'

import type { Module } from '@common/interfaces/RouteInterfaces'
import ExecutionActions from '../ExecutionActions'

jest.mock('services/pipeline-ng', () => ({
  useHandleInterrupt: jest.fn(() => ({
    mutate: jest.fn()
  })),
  useHandleStageInterrupt: jest.fn(() => ({
    mutate: jest.fn()
  })),
  useGetInputsetYaml: jest.fn(() => ({ data: null }))
}))

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/exports', () => ({
  useToaster: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    clear: jest.fn
  }),
  useConfirmationDialog: jest.fn().mockImplementation(async ({ onCloseDialog }) => {
    await onCloseDialog(true)
  })
}))
jest.mock('@common/utils/YamlUtils', () => ({}))

const TEST_PATH = routes.toExecutionPipelineView({
  ...accountPathProps,
  ...executionPathProps,
  ...pipelineModuleParams
})

const pipelineDeploymentListPage = routes.toPipelineDeploymentList({
  ...accountPathProps,
  ...pipelinePathProps,
  ...pipelineModuleParams
})

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

describe('<ExecutionActions /> tests', () => {
  test.each<[ExecutionStatus]>([
    ['Aborted'],
    ['Expired'],
    ['Failed'],
    ['NotStarted'],
    ['Paused'],
    ['Queued'],
    ['Running'],
    ['Success'],
    ['Suspended'],
    ['ResourceWaiting']
  ])('snapshot tests "%s" status', async executionStatus => {
    let result: RenderResult

    act(() => {
      result = render(
        <TestWrapper path={TEST_PATH} pathParams={pathParams}>
          <ExecutionActions
            params={pathParams as any}
            source="executions"
            executionStatus={executionStatus}
            refetch={jest.fn()}
          />
        </TestWrapper>
      )
    })

    expect(result!.container).toMatchSnapshot('container')

    const btn = result!.container.querySelector('[icon="more"]')?.closest('button')

    act(() => {
      fireEvent.click(btn!)
    })

    await findByText(document.body, 'editPipeline')

    expect(document.body.querySelector('.bp3-menu')).toMatchSnapshot('Menu')
  })

  test.each<[ExecutionStatus, string, HandleInterruptQueryParams['interruptType']]>([
    ['Paused', 'play', 'Resume'],
    ['Running', 'pause', 'Pause'],
    ['Running', 'stop', 'AbortAll']
  ])('Interrupt "%s" status  with action "%s"', async (executionStatus, icon, interruptType) => {
    const mutate = jest.fn()
    ;(useHandleInterrupt as jest.Mock).mockImplementation(() => ({
      mutate,
      loading: true,
      data: null
    }))

    let result: RenderResult

    act(() => {
      result = render(
        <TestWrapper path={TEST_PATH} pathParams={pathParams}>
          <ExecutionActions
            params={pathParams as any}
            source="executions"
            executionStatus={executionStatus}
            refetch={jest.fn()}
          />
        </TestWrapper>
      )
    })

    act(() => {
      const btn = result!.container.querySelector(`[data-icon="${icon}"]`)?.closest('button')
      fireEvent.click(btn!)
    })

    await waitFor(() => {
      if (interruptType === 'AbortAll') {
        const dialog = document.body.querySelector('.bp3-dialog')

        expect(dialog).toBeDefined()
        const confirmButton = dialog?.querySelector('.bp3-button')

        fireEvent.click(confirmButton!)
      }

      expect(mutate).toHaveBeenCalledWith(
        {},
        {
          queryParams: {
            accountIdentifier: pathParams.accountId,
            orgIdentifier: pathParams.orgIdentifier,
            projectIdentifier: pathParams.projectIdentifier,
            interruptType
          }
        }
      )
    })
  })

  test.each<[ExecutionStatus, string, string, HandleInterruptQueryParams['interruptType']]>([
    ['Paused', 'play', 'selectedStageId', 'Resume'],
    ['Running', 'pause', 'selectedStageId', 'Pause'],
    ['Running', 'stop', 'selectedStageId', 'AbortAll']
  ])(
    'Interrupt "%s" status  with action "%s" for stage "%s"',
    async (executionStatus, icon, stageId, interruptType) => {
      jest.clearAllMocks()
      const mutate = jest.fn()
      ;(useHandleStageInterrupt as jest.Mock).mockImplementation(() => ({
        mutate,
        loading: true,
        data: null
      }))

      let result: RenderResult

      act(() => {
        result = render(
          <TestWrapper path={TEST_PATH} pathParams={pathParams} queryParams={{ stageId: stageId }}>
            <ExecutionActions
              source="executions"
              params={pathParams as any}
              executionStatus={executionStatus}
              refetch={jest.fn()}
              stageId={stageId}
            />
          </TestWrapper>
        )
      })

      act(() => {
        const btn = result!.container.querySelector(`[data-icon="${icon}"]`)?.closest('button')
        fireEvent.click(btn!)
      })

      await waitFor(() => {
        if (interruptType === 'AbortAll') {
          const dialog = document.body.querySelector('.bp3-dialog')

          expect(dialog).toBeDefined()
          const confirmButton = dialog?.querySelector('.bp3-button')

          fireEvent.click(confirmButton!)
        }

        expect(mutate).toHaveBeenCalledWith(
          {},
          {
            queryParams: {
              accountIdentifier: pathParams.accountId,
              orgIdentifier: pathParams.orgIdentifier,
              projectIdentifier: pathParams.projectIdentifier,
              interruptType
            }
          }
        )
      })
    }
  )

  test('if feature restriction is applied on rerun button', () => {
    jest.spyOn(useFeaturesLib, 'useGetFirstDisabledFeature').mockReturnValue({
      featureEnabled: false,
      disabledFeatureName: FeatureIdentifier.DEPLOYMENTS_PER_MONTH
    })

    const mutate = jest.fn()
    ;(useHandleInterrupt as jest.Mock).mockImplementation(() => ({
      mutate,
      loading: true,
      data: null
    }))

    let result: RenderResult

    act(() => {
      result = render(
        <TestWrapper path={TEST_PATH} pathParams={pathParams}>
          <ExecutionActions
            source="executions"
            params={pathParams as any}
            executionStatus="Expired"
            refetch={jest.fn()}
            modules={['cd', 'ci']}
          />
        </TestWrapper>
      )
    })

    expect(result!.container).toMatchSnapshot('repeat button should be disabled as cd, ci are not allowed')
  })

  test('do not show the edit buttonif prop is false', () => {
    const mutate = jest.fn()
    ;(useHandleInterrupt as jest.Mock).mockImplementation(() => ({
      mutate,
      loading: true,
      data: null
    }))

    let result: RenderResult

    act(() => {
      result = render(
        <TestWrapper path={TEST_PATH} pathParams={pathParams}>
          <ExecutionActions
            source="executions"
            params={pathParams as any}
            executionStatus="Expired"
            refetch={jest.fn()}
            showEditButton={false}
          />
        </TestWrapper>
      )
    })

    const moreIcon = result!.container.querySelector('span[icon="more"]')
    act(() => {
      fireEvent.click(moreIcon!)
    })
    const menuItems = result!.baseElement.querySelectorAll('.bp3-menu-item')
    const editPipelineMenuItem = Array.from(menuItems).find(item => item.textContent === 'editPipeline')
    expect(editPipelineMenuItem).toBeUndefined()
  })

  test('Open in new tab button visible on Execution History', () => {
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper>{children}</TestWrapper>
    )
    const { result } = renderHook(() => useStrings(), { wrapper })

    const { orgIdentifier, pipelineIdentifier, executionIdentifier, projectIdentifier, accountId } = pathParams
    const module: Module = pathParams.module as Module

    const executionPipelineViewRoute = routes.toExecutionPipelineView({
      orgIdentifier,
      pipelineIdentifier,
      executionIdentifier,
      projectIdentifier,
      accountId,
      module,
      source: 'executions'
    })

    const { getByText } = render(
      <TestWrapper path={pipelineDeploymentListPage} pathParams={pathParams}>
        <ExecutionActions
          params={pathParams as any}
          source="executions"
          executionStatus="Expired"
          refetch={jest.fn()}
          showEditButton={false}
        />
      </TestWrapper>
    )

    const moreButton = getByText('more')?.closest('button')

    act(() => {
      fireEvent.click(moreButton!)
    })

    const openInNewTabButton = getByText(result.current.getString('pipeline.openInNewTab')) as HTMLAnchorElement
    expect(openInNewTabButton).toBeDefined()
    expect(openInNewTabButton?.href).toContain(executionPipelineViewRoute)
  })

  test('Open in new tab button unavailable on Pipeline View page', () => {
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper>{children}</TestWrapper>
    )
    const { result } = renderHook(() => useStrings(), { wrapper })

    const { getByText, queryByText } = render(
      <TestWrapper path={TEST_PATH} pathParams={pathParams}>
        <ExecutionActions
          params={pathParams as any}
          executionStatus="Expired"
          refetch={jest.fn()}
          source="executions"
          showEditButton={false}
        />
      </TestWrapper>
    )

    const moreButton = getByText('more')?.closest('button')

    act(() => {
      fireEvent.click(moreButton!)
    })

    const openInNewTabButton = queryByText(result.current.getString('pipeline.openInNewTab'))
    expect(openInNewTabButton).not.toBeInTheDocument()
  })
})
