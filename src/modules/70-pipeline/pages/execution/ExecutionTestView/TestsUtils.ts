/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SetStateAction, Dispatch } from 'react'
import type { GetDataError } from 'restful-react'
import type { SelectOption } from '@wings-software/uicore'
import { uniqWith, isEqual, orderBy } from 'lodash-es'
import type { StepInfo, Error } from 'services/ti-service'
import type { GraphLayoutNode } from 'services/pipeline-ng'

export const StepTypes = {
  RUN_TESTS: 'RunTests'
}
export const renderFailureRate = (failureRate: number): number => {
  let scale = 1
  let value = failureRate

  if (failureRate === 0 || Math.round(failureRate * 100) > 0) {
    return Math.round(failureRate * 100)
  }

  while (value < 10) {
    scale *= 10
    value *= 10
  }
  const valueScaled = Math.round(value) / scale
  const exceeds4DecimalPlaces = valueScaled.toString().split('.')?.[1]?.length > 4
  return exceeds4DecimalPlaces ? Number(valueScaled.toFixed(4)) : valueScaled
}

export enum SortByKey {
  FAILURE_RATE = 'fail_pct',
  FAILED_TESTS = 'failed_tests',
  PASSED_TESTS = 'passed_tests',
  SKIPPED_TESTS = 'skipped_tests',
  DURATION_MS = 'duration_ms',
  TOTAL_TESTS = 'total_tests'
}

const StageStatus = {
  FAILED: 'Failed'
}

export const TestStatus = {
  PASSED: 'passed',
  SKIPPED: 'skipped',
  ERROR: 'error',
  FAILED: 'failed'
}

enum ExecutionStatus {
  RUNNING = 'running',
  FAILED = 'failed',
  NOTSTARTED = 'notstarted',
  EXPIRED = 'expired',
  ABORTED = 'aborted',
  QUEUED = 'queued',
  PAUSED = 'paused',
  WAITING = 'waiting',
  SUCCESS = 'success',
  SUSPENDED = 'suspended',
  SKIPPED = 'skipped'
}

/* eslint-disable @typescript-eslint/no-shadow */
export enum UI {
  TIAndReports,
  TI,
  Reports,
  ZeroState,
  LoadingState
}

export const isExecutionComplete = (status: string) => {
  const _status = (status || '').toLowerCase()

  return (
    _status === ExecutionStatus.SUCCESS ||
    _status === ExecutionStatus.FAILED ||
    _status === ExecutionStatus.EXPIRED ||
    _status === ExecutionStatus.ABORTED ||
    _status === ExecutionStatus.SKIPPED
  )
}

export const CALL_GRAPH_WIDTH = 360
export const CALL_GRAPH_HEIGHT = 360
export const CALL_GRAPH_API_LIMIT = 75

export const AllOption = { label: 'All', value: 'AGGREGATE_ALL_TEST_REPORTS' }

export const AllStagesOption = {
  label: `${AllOption.label} Stages`,
  value: AllOption.value
}

export const AllStepsOption = {
  label: `${AllOption.label} Steps`,
  value: AllOption.value
}

interface OptionalQueryParamKeys {
  stageId?: string
  stepId?: string
}

export const getOptionalQueryParamKeys = ({
  stageId,
  stepId
}: {
  stageId?: string
  stepId?: string
}): OptionalQueryParamKeys => {
  const optionalKeys: OptionalQueryParamKeys = {}

  if (stageId !== AllOption.value && stageId) {
    optionalKeys.stageId = stageId
  }

  if (stepId !== AllOption.value && stepId) {
    optionalKeys.stepId = stepId
  }
  return optionalKeys
}

const getUniqueStageAndStepOptions = ({
  reportInfoData,
  testInfoData,
  context
}: {
  reportInfoData: StepInfo[]
  testInfoData: StepInfo[]
  context?: any
}) => {
  const uniqItems = uniqWith([...reportInfoData, ...testInfoData], isEqual)
  let uniqueStageIdOptions: SelectOption[] | any = [] // any includes additionally index for ordering below
  const uniqueStepIdOptionsFromStageKeyMap: { [key: string]: SelectOption[] | any } = {}
  const pipelineOrderedStagesMap: { [key: string]: { index: number; isFailed: boolean } } = {}
  Array.from(context?.pipelineStagesMap?.values() || {})?.forEach(
    (stage, index) =>
      (pipelineOrderedStagesMap[`${(stage as GraphLayoutNode).nodeIdentifier}`] = {
        index,
        isFailed: (stage as GraphLayoutNode).status === StageStatus.FAILED
      })
  )

  uniqItems.forEach(({ stage, step }) => {
    if (stage && !uniqueStageIdOptions.some((option: { value: string }) => option.value === stage)) {
      uniqueStageIdOptions.push({
        label: `Stage: ${stage}`,
        value: stage,
        index: typeof stage === 'string' && pipelineOrderedStagesMap[stage]?.index,
        ...(pipelineOrderedStagesMap[stage]?.isFailed ? { icon: { name: 'warning-sign' } } : {})
      })
    }
    // Will support Steps with warning icon in redesign + api support
    if (stage && Array.isArray(uniqueStepIdOptionsFromStageKeyMap?.[stage])) {
      uniqueStepIdOptionsFromStageKeyMap[stage].push({
        label: `Step: ${step}`,
        value: step
      })
    } else if (stage && step) {
      uniqueStepIdOptionsFromStageKeyMap[stage] = [
        {
          label: `Step: ${step}`,
          value: step
        }
      ]
    }
  })

  if (uniqueStageIdOptions.length > 1) {
    uniqueStageIdOptions = orderBy(uniqueStageIdOptions, 'index')
  }

  return { uniqueStageIdOptions, uniqueStepIdOptionsFromStageKeyMap }
}

export const setInitialStageAndSteps = ({
  reportInfoData,
  testInfoData,
  context,
  setStepIdOptionsFromStageKeyMap,
  setSelectedStageId,
  setSelectedStepId,
  setStageIdOptions,
  setStepIdOptions
}: {
  reportInfoData: StepInfo[]
  testInfoData: StepInfo[]
  context?: any
  setStepIdOptionsFromStageKeyMap: Dispatch<SetStateAction<{ [key: string]: SelectOption[] }>>
  setSelectedStageId: Dispatch<SetStateAction<SelectOption | undefined>>
  setSelectedStepId: Dispatch<SetStateAction<SelectOption | undefined>>
  setStageIdOptions: Dispatch<SetStateAction<SelectOption[]>>
  setStepIdOptions: Dispatch<SetStateAction<SelectOption[]>>
}): void => {
  const { uniqueStageIdOptions, uniqueStepIdOptionsFromStageKeyMap } = getUniqueStageAndStepOptions({
    reportInfoData,
    testInfoData,
    context
  })

  setStepIdOptionsFromStageKeyMap(uniqueStepIdOptionsFromStageKeyMap)

  let selectedStageIndex = 0
  if (uniqueStageIdOptions.length > 1) {
    uniqueStageIdOptions.unshift(AllStagesOption)
    // select id from previously selected node on Pipeline tab
    const preSelectedStageId = context.pipelineStagesMap.get(context.selectedStageId)?.nodeIdentifier
    const preselectedStageIndex = uniqueStageIdOptions.findIndex(
      (option: SelectOption) => option.value === preSelectedStageId
    )
    if (preselectedStageIndex > -1) {
      selectedStageIndex = preselectedStageIndex
      setSelectedStageId(uniqueStageIdOptions[preselectedStageIndex])
    } else {
      selectedStageIndex = 1
      setSelectedStageId(uniqueStageIdOptions[1])
    }
  } else {
    setSelectedStageId(uniqueStageIdOptions[0])
  }

  const selectedStepOptions =
    typeof selectedStageIndex !== 'undefined' &&
    uniqueStepIdOptionsFromStageKeyMap[uniqueStageIdOptions[selectedStageIndex]?.value as string]

  if (selectedStepOptions?.length) {
    if (selectedStepOptions?.length > 1) {
      selectedStepOptions.unshift(AllStepsOption)
      // select id from previously selected step node on Pipeline tab
      // otherwise default to first in the list
      const preSelectedStepId = context.selectedStepId && context.allNodeMap?.[context.selectedStepId]?.identifier
      const preselectedStepIndex = selectedStepOptions.findIndex(
        (option: SelectOption) => option.value === preSelectedStepId
      )
      if (preselectedStepIndex > -1) {
        setSelectedStepId(selectedStepOptions[preselectedStepIndex])
      } else {
        setSelectedStepId(selectedStepOptions[1])
      }
    } else {
      setSelectedStepId(selectedStepOptions[0])
    }

    setStageIdOptions(uniqueStageIdOptions)
    setStepIdOptions(selectedStepOptions)
  }
}

export const getUIType = ({
  reportSummaryHasTests,
  testOverviewHasTests,
  reportInfoLoading,
  testInfoLoading
}: {
  reportSummaryHasTests: boolean
  testOverviewHasTests: boolean
  reportInfoLoading: boolean
  testInfoLoading: boolean
}): UI => {
  if (reportSummaryHasTests && testOverviewHasTests) {
    return UI.TIAndReports
  } else if (!reportSummaryHasTests && testOverviewHasTests) {
    return UI.TI
  } else if (reportSummaryHasTests && !testOverviewHasTests) {
    return UI.Reports
  } else if (reportInfoLoading || testInfoLoading) {
    return UI.LoadingState
  }
  return UI.ZeroState
}

export const getError = ({
  reportInfoData,
  reportSummaryError,
  serviceTokenError,
  testInfoData,
  testOverviewError,
  reportInfoError,
  testInfoError
}: {
  reportInfoData?: StepInfo[] | null
  reportSummaryError: GetDataError<Error> | null
  serviceTokenError: GetDataError<Error> | null
  testInfoData?: StepInfo[] | null
  testOverviewError: GetDataError<Error> | null
  reportInfoError: GetDataError<Error> | null
  testInfoError: GetDataError<Error> | null
}): GetDataError<Error> | null =>
  (reportInfoData && reportInfoData?.length > 0 && reportSummaryError) ||
  serviceTokenError ||
  (testInfoData && testInfoData?.length > 0 && testOverviewError) ||
  reportInfoError ||
  testInfoError
