/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/react'
import { accountPathProps, executionPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import { PipelineContextTestWrapper } from '@pipeline/utils/pipelineContextTestUtils'
import routes from '@common/RouteDefinitions'
import ExecutionContext from '@pipeline/context/ExecutionContext'
import ExecutionStageDiagram from '../ExecutionStageDiagram'

import data from './data.json'
import executionStageDiagramProps from './__mock__/props.json'
import executionStepDiagramProps from './__mock__/stepProps.json'

const itemClickHandler = jest.fn()
const itemMouseEnter = jest.fn()
const itemMouseLeave = jest.fn()
const canvasListener = jest.fn()
const onChangeStageSelection = jest.fn()
const mouseEnterStepGroupTitle = jest.fn()
const mouseLeaveStepGroupTitle = jest.fn()

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getExtraProps = () => ({
  itemClickHandler,
  itemMouseEnter,
  itemMouseLeave,
  canvasListener,
  onChangeStageSelection,
  mouseEnterStepGroupTitle,
  mouseLeaveStepGroupTitle
})

jest.mock('resize-observer-polyfill', () => {
  return class ResizeObserver {
    static default = ResizeObserver
    observe(): void {
      // do nothing
    }
    unobserve(): void {
      // do nothing
    }
    disconnect(): void {
      // do nothing
    }
  }
})

// eslint-disable-next-line jest/no-disabled-tests
describe('Test Execution StageDiagram', () => {
  beforeAll(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.12345)
  })
  afterAll(() => {
    jest.spyOn(global.Math, 'random').mockReset()
  })
  test('should render the default snapshot', () => {
    const { container } = render(
      <PipelineContextTestWrapper
        path={routes.toExecutionPipelineView({
          ...accountPathProps,
          ...executionPathProps,
          ...pipelineModuleParams
        })}
        pathParams={{
          accountId: 'px7xd_BFRCi-pfWPYXVjvw',
          projectIdentifier: 'Kapil',
          module: 'cd',
          source: 'executions',
          executionIdentifier: 'dummy',
          pipelineIdentifier: 'test_ash',
          orgIdentifier: 'dummy'
        }}
        pipelineContextValues={{
          state: {
            pipelineIdentifier: 'test_ash'
          } as any
        }}
      >
        <ExecutionContext.Provider value={data as any}>
          <ExecutionStageDiagram {...(executionStageDiagramProps as any)} />
        </ExecutionContext.Provider>
      </PipelineContextTestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

// eslint-disable-next-line jest/no-disabled-tests
describe('Test Execution StageDiagram - Action/Events for Stage', () => {
  beforeAll(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.12345)
  })
  afterAll(() => {
    jest.spyOn(global.Math, 'random').mockReset()
  })
  test('Test Mouse Events on Nodes and Canvas', () => {
    const { container } = render(
      <PipelineContextTestWrapper
        path={routes.toExecutionPipelineView({
          ...accountPathProps,
          ...executionPathProps,
          ...pipelineModuleParams
        })}
        pathParams={{
          accountId: 'px7xd_BFRCi-pfWPYXVjvw',
          projectIdentifier: 'Kapil',
          module: 'cd',
          source: 'executions',
          executionIdentifier: 'P_th0g9eRn-BVTwujdyqPw',
          pipelineIdentifier: 'test_ash',
          orgIdentifier: 'default'
        }}
      >
        <ExecutionContext.Provider value={data as any}>
          <ExecutionStageDiagram {...(executionStageDiagramProps as any)} {...getExtraProps()} />
        </ExecutionContext.Provider>
      </PipelineContextTestWrapper>
    )
    const node = container.querySelector('[data-nodeid="LBmn6BqRSc2WO-kxi36t8g"] .defaultNode') as HTMLElement
    fireEvent.mouseEnter(node)
    expect(itemMouseEnter).toBeCalled()
    fireEvent.mouseLeave(node)
    expect(itemMouseLeave).toBeCalled()
    fireEvent.click(node)
    expect(itemClickHandler).toBeCalled()
    const canvasButton = container.querySelectorAll('.canvasButtons button')[0]
    fireEvent.click(canvasButton)
    const canvasWidget = container.querySelectorAll('.main')[0].children[0]
    fireEvent.mouseDown(canvasWidget)
    fireEvent.mouseUp(canvasWidget)
    expect(canvasListener).toBeCalledWith(3)
  })
})

describe('Test Execution StageDiagram for Grouped Steps', () => {
  beforeAll(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.12345)
  })
  afterAll(() => {
    jest.spyOn(global.Math, 'random').mockReset()
  })

  test('snapshot test', () => {
    const { container } = render(
      <PipelineContextTestWrapper
        path={routes.toExecutionPipelineView({
          ...accountPathProps,
          ...executionPathProps,
          ...pipelineModuleParams
        })}
        pathParams={{
          accountId: 'px7xd_BFRCi-pfWPYXVjvw',
          projectIdentifier: 'Kapil',
          module: 'cd',
          executionIdentifier: 'P_th0g9eRn-BVTwujdyqPw',
          pipelineIdentifier: 'test_ash',
          source: 'executions',
          orgIdentifier: 'default'
        }}
      >
        <ExecutionContext.Provider value={data as any}>
          <ExecutionStageDiagram {...(executionStepDiagramProps as any)} {...getExtraProps()} />
        </ExecutionContext.Provider>
      </PipelineContextTestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Test Mouse Events on Grouped Steps', async () => {
    const { container } = render(
      <PipelineContextTestWrapper
        path={routes.toExecutionPipelineView({
          ...accountPathProps,
          ...executionPathProps,
          ...pipelineModuleParams
        })}
        pathParams={{
          accountId: 'px7xd_BFRCi-pfWPYXVjvw',
          projectIdentifier: 'Kapil',
          module: 'cd',
          source: 'executions',
          executionIdentifier: 'P_th0g9eRn-BVTwujdyqPw',
          pipelineIdentifier: 'test_ash',
          orgIdentifier: 'default'
        }}
      >
        <ExecutionContext.Provider value={data as any}>
          <ExecutionStageDiagram {...(executionStepDiagramProps as any)} {...getExtraProps()} />
        </ExecutionContext.Provider>
      </PipelineContextTestWrapper>
    )

    const node = container.querySelector('[data-nodeid="o7fWy9XJRJa09Qw9k0-5KQ-Start"]') as HTMLElement
    const main = node?.parentElement
    expect(main).toBeDefined()

    const stepGroupTitle = main?.getElementsByTagName('p')[0] as HTMLElement
    expect(stepGroupTitle).toBeDefined()

    await act(async () => {
      fireEvent.mouseEnter(stepGroupTitle)
      expect(mouseEnterStepGroupTitle).toHaveBeenCalled()

      fireEvent.mouseLeave(stepGroupTitle)
      expect(mouseLeaveStepGroupTitle).toHaveBeenCalled()
    })

    const collapseIcon = main?.querySelector('.collapseIcon') as HTMLElement
    await act(async () => {
      fireEvent.click(collapseIcon)
      waitForElementToBeRemoved(collapseIcon).then(() => {
        expect(collapseIcon).not.toBeInTheDocument()
      })
    })
  })
})
