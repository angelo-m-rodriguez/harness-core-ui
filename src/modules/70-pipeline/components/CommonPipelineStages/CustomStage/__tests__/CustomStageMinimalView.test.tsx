/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
// import type { UseGetReturn } from 'restful-react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
// import * as services from 'services/pipeline-ng'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { CustomStage } from '../CustomStage'
import {
  getPropsForMinimalStage,
  getDummyPipelineContextValue,
  getPropsForMinimalStageWithTemplateUsed
} from './CustomStageHelper'

jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))
jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))
jest.mock('lodash-es', () => ({
  ...(jest.requireActual('lodash-es') as Record<string, any>),
  debounce: jest.fn(fn => {
    fn.cancel = jest.fn()
    return fn
  }),
  noop: jest.fn()
}))

jest.mock('resize-observer-polyfill', () => {
  class ResizeObserver {
    static default = ResizeObserver
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    observe() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    unobserve() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    disconnect() {
      // do nothing
    }
  }
  return ResizeObserver
})

describe('Custom Stage Minimal View', () => {
  test('Basic render, selection and setup stage', async () => {
    const props = getPropsForMinimalStage()
    const pipelineContextMockValue = getDummyPipelineContextValue()
    const { container, getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <CustomStage
            minimal={true}
            stageProps={props.stageProps as any}
            name={''}
            type={''}
            icon={'nav-harness'}
            isDisabled={false}
            isApproval={false}
            title="My custom stage"
            description={''}
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await act(async () => {
      await fireEvent.click(getByText('pipelineSteps.build.create.setupStage'))
    })
    expect(getByText('pipelineSteps.build.create.stageNameRequiredError')).toBeDefined()
    expect(() => getByText('pipeline.approvalTypeRequired')).toThrow()
    const nameInput = container.querySelector('.bp3-input')
    expect(container).toMatchSnapshot()
    act(() => {
      fireEvent.change(nameInput!, { target: { value: 'stagename' } })
    })
    expect(props.stageProps?.onChange).toBeCalledTimes(3)
    act(() => {
      fireEvent.click(getByText('pipelineSteps.build.create.setupStage'))
    })

    await waitFor(() =>
      expect(props.stageProps?.onSubmit).toBeCalledWith(
        {
          stage: {
            name: 'stagename',
            identifier: 'stagename',
            description: undefined,
            tags: {}
          }
        },
        'stagename'
      )
    )
  })
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('Basic rendering and setup stage - when a template is used', () => {
    const props = getPropsForMinimalStageWithTemplateUsed()
    const pipelineContextMockValue = getDummyPipelineContextValue()
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContextMockValue}>
          <CustomStage
            minimal={true}
            stageProps={props as any}
            name={''}
            type={''}
            icon={'nav-harness'}
            isDisabled={false}
            isApproval={true}
            title="My approval stage"
            description={''}
          />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    // expect(container).toHaveTextContent('Using Template: Ishant Custom Stage Test (v1)')
  })
})
