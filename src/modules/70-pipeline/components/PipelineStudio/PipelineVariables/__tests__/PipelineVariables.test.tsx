/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'

import produce from 'immer'
import { cloneDeep, get, set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdng from 'services/cd-ng'
import { PipelineVariablesContext } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import { factory } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CustomVariables } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariables'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import { Scope } from '@common/interfaces/SecretsInterface'
import * as PipelineCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/PipelineCard'
import * as StageCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/StageCard'
import type { PipelineInfoConfig } from 'services/cd-ng'
import { useCreateVariablesV2 } from 'services/pipeline-ng'
import { useGetYamlWithTemplateRefsResolved } from 'services/template-ng'

import { yamlStringify } from '@common/utils/YamlHelperMethods'
import PipelineVariables from '../PipelineVariables'
import { PipelineContext } from '../../PipelineContext/PipelineContext'
import variablesPipeline from './variables.json'
import variablesWithStageTemplate from './variablesWithStageTemplate.json'
import pipelineJson from './pipeline.json'
import pipelineWithStageTemplate from './pipelineWithStageTemplate.json'
import resolvedPipeline from './resolvedPipeline.json'
import metadataMap from './metadataMap.json'
import metadataMapWithStageTemplate from './metadataMapWithStageTemplate.json'

const pipelineContext: any = {
  updatePipeline: jest.fn(),
  state: {
    pipeline: pipelineJson,
    pipelineView: { splitViewData: {} },
    selectionState: { selectedStageId: 'stage_1' }
  } as any,
  contextType: 'Pipeline',
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  stepsFactory: factory,
  stagesMap: {},
  isReadonly: false,
  setSchemaErrorView: jest.fn(),
  view: SelectedView.VISUAL,
  scope: Scope.PROJECT,
  renderPipelineStage: jest.fn(),
  setView: jest.fn(),
  updateGitDetails: jest.fn(),
  updateEntityValidityDetails: jest.fn(),
  updatePipelineView: jest.fn(),
  fetchPipeline: jest.fn(),
  deletePipelineCache: jest.fn(),
  getStageFromPipeline: jest.fn((_stageId, pipeline) => ({ stage: pipeline?.stages?.[0], parent: undefined })),
  setYamlHandler: jest.fn(),
  runPipeline: jest.fn(),
  updateStage: jest.fn(),
  pipelineSaved: jest.fn(),
  setSelectedStageId: jest.fn(),
  setSelectedStepId: jest.fn(),
  setSelectedSectionId: jest.fn(),
  setSelection: jest.fn(),
  getStagePathFromPipeline: jest.fn(),
  setTemplateTypes: jest.fn()
}

const stageTemplateContextMock = produce(pipelineContext, (draft: any) => {
  set(draft, 'state.pipeline', pipelineWithStageTemplate)
}) as any

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

// console.error = jest.fn()

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.spyOn(cdng, 'useGetListOfBranchesWithStatus').mockImplementation((): any => {
  return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
})
jest.spyOn(cdng, 'useListGitSync').mockImplementation((): any => {
  return { data: gitConfigs, refetch: getListGitSync, loading: false }
})
jest.spyOn(cdng, 'useGetSourceCodeManagers').mockImplementation((): any => {
  return { data: sourceCodeManagers, refetch: jest.fn(), loading: false }
})

jest.mock('services/pipeline-ng', () => ({
  useCreateVariablesV2: jest.fn().mockReturnValue({
    mutate: jest.fn()
  })
}))

jest.mock('services/template-ng', () => ({
  useGetYamlWithTemplateRefsResolved: jest.fn().mockReturnValue({
    mutate: jest.fn()
  })
}))

jest.mock('lodash-es', () => ({
  ...(jest.requireActual('lodash-es') as Record<string, any>),
  debounce: jest.fn(fn => {
    fn.cancel = jest.fn()
    return fn
  })
}))

describe('<PipelineVariables /> tests', () => {
  beforeAll(() => {
    factory.registerStep(new CustomVariables())
  })

  test('snapshot test', async () => {
    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            yaml: yamlStringify({ pipeline: variablesPipeline }),
            metadataMap
          }
        })
      ),
      loading: false
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            mergedPipelineYaml: yamlStringify(pipelineJson)
          }
        })
      ),
      loading: false
    })

    const { container, findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContext}>
          <PipelineVariables pipeline={pipelineJson as PipelineInfoConfig} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await findByText('common.variables')

    expect(container).toMatchSnapshot()
  })

  test('should call PipelineCard with unresolved pipeline ', async () => {
    const PipelineCardMock = jest.spyOn(PipelineCard, 'default')
    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            yaml: yamlStringify({ pipeline: variablesWithStageTemplate }),
            metadataMap: metadataMapWithStageTemplate
          }
        })
      ),
      loading: false
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            mergedPipelineYaml: yamlStringify(resolvedPipeline)
          }
        })
      ),
      loading: false
    })

    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={stageTemplateContextMock}>
          <PipelineVariables pipeline={resolvedPipeline as PipelineInfoConfig} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await findByText('common.variables')

    expect(PipelineCardMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pipeline: pipelineWithStageTemplate,
        variablePipeline: variablesWithStageTemplate,
        metadataMap: metadataMapWithStageTemplate
      }),
      expect.anything()
    )
  })

  test('should render StageCard in readonly mode and with resolved stage for stage template', async () => {
    const StageCardMock = jest.spyOn(StageCard, 'default')

    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            yaml: yamlStringify({ pipeline: variablesWithStageTemplate }),
            metadataMap: metadataMapWithStageTemplate
          }
        })
      )
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            mergedPipelineYaml: yamlStringify(resolvedPipeline)
          }
        })
      )
    })

    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={stageTemplateContextMock}>
          <PipelineVariables pipeline={resolvedPipeline as PipelineInfoConfig} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await findByText('common.variables')

    expect(StageCardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        originalStage: resolvedPipeline.stages[0].stage,
        stage: variablesWithStageTemplate.stages[0].stage,
        metadataMap: metadataMapWithStageTemplate,
        readonly: true
      }),
      expect.anything()
    )
  })

  test('should call update pipeline with unresolved stage', async () => {
    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            yaml: yamlStringify({ pipeline: variablesWithStageTemplate }),
            metadataMap: metadataMapWithStageTemplate
          }
        })
      )
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {
            mergedPipelineYaml: yamlStringify(resolvedPipeline)
          }
        })
      )
    })

    const { getByTestId, findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={stageTemplateContextMock}>
          <PipelineVariables pipeline={resolvedPipeline as PipelineInfoConfig} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await findByText('common.variables')

    const apply = await findByText('applyChanges')

    act(() => {
      fireEvent.change(
        getByTestId('pipeline.Stage_2.variables-panel').querySelector(
          'input[name="variables[0].value"]'
        ) as HTMLElement,
        { target: { value: 'val2' } }
      )
    })

    fireEvent.click(apply)

    const updatedSecondStage = cloneDeep(get(stageTemplateContextMock, 'state.pipeline'))
    set(updatedSecondStage, 'stages[1].stage.variables[0].value', 'val2')
    await waitFor(() => expect(stageTemplateContextMock.updatePipeline).toBeCalledWith(updatedSecondStage))
  })

  test('renders loader', async () => {
    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {}
        })
      ),
      loading: true
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn(() =>
        Promise.resolve({
          data: {}
        })
      ),
      loading: true
    })

    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContext}>
          <PipelineVariablesContext.Provider
            value={
              {
                originalPipeline: pipelineJson,
                variablesPipeline,
                loading: false,
                initLoading: true,
                error: null,
                metadataMap
              } as any
            }
          >
            <PipelineVariables />
          </PipelineVariablesContext.Provider>
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('renders error', async () => {
    ;(useCreateVariablesV2 as jest.Mock).mockReturnValue({
      mutate: jest.fn().mockRejectedValue({
        message: 'This is an error message'
      })
    })
    ;(useGetYamlWithTemplateRefsResolved as jest.Mock).mockReturnValue({
      mutate: jest.fn().mockRejectedValue({
        message: 'This is an error message'
      })
    })
    const { container, findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={pipelineContext}>
          <PipelineVariables pipeline={{} as PipelineInfoConfig} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    await findByText('This is an error message')

    expect(container).toMatchSnapshot()
  })
})
