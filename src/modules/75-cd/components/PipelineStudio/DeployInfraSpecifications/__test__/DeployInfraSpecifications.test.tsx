/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import {
  PipelineContextInterface,
  PipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StageType } from '@pipeline/utils/stageHelpers'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import * as useValidationErrors from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import { envs } from './mocks'
import overridePipelineContext from './overrideSetPipeline.json'
import DeployInfraSpecifications from '../DeployInfraSpecifications'

const getOverrideContextValue = (): PipelineContextInterface => {
  return {
    ...overridePipelineContext,
    getStageFromPipeline: jest.fn().mockReturnValue({
      stage: {
        stage: {
          name: 'Stage 3',
          identifier: 's3',
          type: StageType.DEPLOY,
          description: ''
        }
      }
    }),
    updateStage: jest.fn().mockImplementation(() => ({ then: jest.fn() })),
    updatePipeline: jest.fn()
  } as any
}

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentList: jest.fn().mockImplementation(() => ({ loading: false, data: envs, refetch: jest.fn() }))
}))

jest.mock('lodash-es', () => ({
  ...(jest.requireActual('lodash-es') as Record<string, any>),
  debounce: jest.fn(fn => {
    fn.cancel = jest.fn()
    return fn
  })
}))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

jest.mock('@pipeline/components/AbstractSteps/StepWidget', () => ({
  ...(jest.requireActual('@pipeline/components/AbstractSteps/StepWidget') as any),
  // eslint-disable-next-line react/display-name
  StepWidget: (props: any) => {
    return (
      <div className="step-widget-mock">
        <button
          name={'updateStepWidget'}
          onClick={() => {
            props.onUpdate(props.initialValues)
          }}
        >
          Step Widget button
        </button>
      </div>
    )
  }
}))

describe('Deploy infra specifications test', () => {
  test('Should match snapshot', () => {
    const context = getOverrideContextValue()
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraSpecifications />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should call submitFormsForTab when errorMap is not empty', async () => {
    const errorContextProvider = {
      state: {} as any,
      checkErrorsForTab: jest.fn().mockResolvedValue(Promise.resolve()),
      subscribeForm: () => undefined,
      unSubscribeForm: () => undefined,
      submitFormsForTab: jest.fn()
    }

    jest.spyOn(useValidationErrors, 'useValidationErrors').mockReturnValue({ errorMap: new Map([['error', []]]) })

    render(
      <TestWrapper>
        <PipelineContext.Provider value={getOverrideContextValue()}>
          <StageErrorContext.Provider value={errorContextProvider}>
            <DeployInfraSpecifications />
          </StageErrorContext.Provider>
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(errorContextProvider.submitFormsForTab).toBeCalled()
  })
})
