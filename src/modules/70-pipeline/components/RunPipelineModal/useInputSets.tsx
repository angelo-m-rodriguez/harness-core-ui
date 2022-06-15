/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo, useState } from 'react'
import type { GetDataError } from 'restful-react'
import { parse } from 'yaml'
import { defaultTo, isUndefined, memoize } from 'lodash-es'

import { useMutateAsGet } from '@common/hooks/useMutateAsGet'
import {
  Failure,
  useGetTemplateFromPipeline,
  useGetMergeInputSetFromPipelineTemplateWithListInput,
  ResponseInputSetTemplateWithReplacedExpressionsResponse
} from 'services/pipeline-ng'
import type { PipelineInfoConfig } from 'services/cd-ng'
import {
  getStageIdentifierFromStageData,
  mergeTemplateWithInputSetData,
  StageSelectionData
} from '@pipeline/utils/runPipelineUtils'

import type { InputSetValue } from '../InputSetSelector/utils'
import { clearRuntimeInput } from '../PipelineStudio/StepUtil'

const memoizedParse = memoize(parse)

export interface Pipeline {
  pipeline?: PipelineInfoConfig
}

export interface UseInputSetsProps {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
  pipelineIdentifier: string
  branch?: string
  repoIdentifier?: string
  inputSetSelected?: InputSetValue[]
  rerunInputSetYaml?: string
  selectedStageData: StageSelectionData
  resolvedPipeline?: PipelineInfoConfig
  executionInputSetTemplateYaml: string
  executionView?: boolean
  executionIdentifier?: string
}

export interface UseInputSetsReturn {
  inputSet: Pipeline
  inputSetTemplate: Pipeline
  inputSetYamlResponse: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
  loading: boolean
  hasInputSets: boolean
  hasRuntimeInputs: boolean
  isInputSetApplied: boolean
  modules?: string[]
  error: GetDataError<Failure | Error> | null
  refetch(): Promise<void> | undefined
}

export function useInputSets(props: UseInputSetsProps): UseInputSetsReturn {
  const {
    inputSetSelected,
    rerunInputSetYaml,
    accountId,
    orgIdentifier,
    branch,
    repoIdentifier,
    projectIdentifier,
    pipelineIdentifier,
    selectedStageData,
    resolvedPipeline,
    executionInputSetTemplateYaml,
    executionView,
    executionIdentifier
  } = props

  const shouldFetchInputSets = !rerunInputSetYaml && Array.isArray(inputSetSelected) && inputSetSelected.length > 0

  const {
    data: inputSetYamlResponse,
    loading: loadingTemplate,
    error: templateError,
    refetch
  } = useMutateAsGet(useGetTemplateFromPipeline, {
    body: {
      stageIdentifiers: getStageIdentifierFromStageData(selectedStageData)
    },
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      branch,
      repoIdentifier
    }
  })

  const {
    data: inputSetData,
    loading: loadingInputSetsData,
    error: inputSetError
  } = useMutateAsGet(useGetMergeInputSetFromPipelineTemplateWithListInput, {
    lazy: !shouldFetchInputSets,
    body: {
      inputSetReferences: inputSetSelected?.map(row => row.value),
      stageIdentifiers: getStageIdentifierFromStageData(selectedStageData)
    },
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      branch,
      repoIdentifier,
      pipelineIdentifier
    }
  })

  const [isInputSetApplied, setIsInputSetApplied] = useState(false)
  const hasRuntimeInputs = !!inputSetYamlResponse?.data?.inputSetTemplateYaml

  const inputSet = useMemo((): Pipeline => {
    const shouldUseDefaultValues = isUndefined(executionIdentifier)

    if (rerunInputSetYaml) {
      return memoizedParse(rerunInputSetYaml)
    }

    if (hasRuntimeInputs) {
      const parsedRunPipelineYaml = clearRuntimeInput(
        memoizedParse(defaultTo(inputSetYamlResponse?.data?.inputSetTemplateYaml, '')).pipeline
      )

      if (shouldFetchInputSets && inputSetData?.data?.pipelineYaml) {
        setIsInputSetApplied(true)
        const parsedInputSets = clearRuntimeInput(memoizedParse(inputSetData.data.pipelineYaml).pipeline)

        return mergeTemplateWithInputSetData({
          templatePipeline: { pipeline: parsedRunPipelineYaml },
          inputSetPortion: { pipeline: parsedInputSets },
          allValues: { pipeline: defaultTo(resolvedPipeline, {} as PipelineInfoConfig) },
          shouldUseDefaultValues
        })
      }

      return mergeTemplateWithInputSetData({
        templatePipeline: { pipeline: parsedRunPipelineYaml },
        inputSetPortion: { pipeline: parsedRunPipelineYaml },
        allValues: { pipeline: defaultTo(resolvedPipeline, {} as PipelineInfoConfig) },
        shouldUseDefaultValues
      })
    }

    return { pipeline: {} as PipelineInfoConfig }
  }, [
    inputSetData?.data?.pipelineYaml,
    inputSetYamlResponse?.data?.inputSetTemplateYaml,
    rerunInputSetYaml,
    shouldFetchInputSets,
    resolvedPipeline,
    executionIdentifier,
    hasRuntimeInputs
  ])

  const inputSetTemplate = useMemo((): Pipeline => {
    if (executionView) {
      return memoizedParse(executionInputSetTemplateYaml)
    }

    if (inputSetYamlResponse?.data?.inputSetTemplateYaml) {
      const parsedRunPipelineYaml = memoizedParse(inputSetYamlResponse.data.inputSetTemplateYaml).pipeline

      return { pipeline: parsedRunPipelineYaml }
    }

    return {}
  }, [inputSetYamlResponse?.data?.inputSetTemplateYaml, executionInputSetTemplateYaml, executionView])

  return {
    inputSet,
    inputSetTemplate,
    loading: loadingTemplate || loadingInputSetsData,
    error: templateError || inputSetError,
    hasRuntimeInputs,
    hasInputSets: !!inputSetYamlResponse?.data?.hasInputSets,
    isInputSetApplied,
    inputSetYamlResponse,
    refetch
  }
}
