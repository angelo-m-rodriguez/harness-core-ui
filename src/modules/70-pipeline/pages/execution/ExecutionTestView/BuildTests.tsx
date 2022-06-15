/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Layout, Select, Heading, Container, Text, SelectOption, PageError } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import React, { useState, useEffect, useMemo, SetStateAction, Dispatch } from 'react'
import { useParams } from 'react-router-dom'
import { get } from 'lodash-es'
import { useStrings, UseStringsReturn } from 'framework/strings'
import {
  useReportSummary,
  useGetToken,
  useTestOverview,
  useReportsInfo,
  useTestInfo,
  TestReportSummary,
  SelectionOverview
} from 'services/ti-service'
import { PageSpinner } from '@common/components'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { BuildZeroState } from './BuildZeroState'
import { TestsExecution } from './TestsExecution'
import { TestsOverview } from './TestsOverview'
import { TestsExecutionResult } from './TestsExecutionResult'
import { TestsSelectionBreakdown } from './TestsSelectionBreakdown'
import { TICallToAction } from './TICallToAction'
import {
  AllOption,
  AllStepsOption,
  getOptionalQueryParamKeys,
  setInitialStageAndSteps,
  getUIType,
  getError,
  UI,
  StepTypes
} from './TestsUtils'
// import { TestsCoverage } from './TestsCoverage'
import css from './BuildTests.module.scss'

/* eslint-enable @typescript-eslint/no-shadow */

interface BuildTestsProps {
  reportSummaryMock?: TestReportSummary
  testOverviewMock?: SelectionOverview
}

const renderTestsOverview = ({
  testOverviewData,
  testsCountDiff
}: {
  testOverviewData?: SelectionOverview | null
  testsCountDiff?: number
}): JSX.Element | null => {
  if (
    typeof testOverviewData?.total_tests !== 'undefined' &&
    typeof testOverviewData?.skipped_tests !== 'undefined' &&
    typeof testOverviewData?.time_saved_ms !== 'undefined' &&
    typeof testOverviewData?.time_taken_ms !== 'undefined'
  ) {
    return (
      <TestsOverview
        totalTests={testOverviewData.total_tests}
        skippedTests={testOverviewData.skipped_tests}
        timeSavedMS={testOverviewData.time_saved_ms}
        durationMS={testOverviewData.time_taken_ms}
        testsCountDiff={testsCountDiff}
      />
    )
  }
  return null
}

const renderHeader = ({
  stageIdOptions,
  selectedStageId,
  getString,
  setSelectedStageId,
  stepIdOptions,
  setStepIdOptions,
  setSelectedStepId,
  stepIdOptionsFromStageKeyMap,
  selectedStepId,
  testOverviewHasTests
}: {
  stageIdOptions: SelectOption[]
  getString: UseStringsReturn['getString']
  setSelectedStageId: Dispatch<SetStateAction<SelectOption | undefined>>
  stepIdOptions: SelectOption[]
  setStepIdOptions: Dispatch<SetStateAction<SelectOption[]>>
  setSelectedStepId: Dispatch<SetStateAction<SelectOption | undefined>>
  stepIdOptionsFromStageKeyMap: { [key: string]: SelectOption[] }
  selectedStageId?: SelectOption
  selectedStepId?: SelectOption
  testOverviewHasTests: boolean
}): JSX.Element => (
  <Container
    flex
    padding={{ bottom: 'small' }}
    margin={{ bottom: 'medium' }}
    style={{ borderBottom: '1px solid #D9DAE6', justifyContent: 'space-between' }}
  >
    <Container flex style={{ justifyContent: 'initial' }}>
      <Heading level={5} color={Color.BLACK} style={{ fontWeight: 600 }}>
        {getString('pipeline.testsReports.testExecutions')}
      </Heading>
      {stageIdOptions && selectedStageId && (
        <div className={css.stageOptions}>
          <Select
            fill
            popoverClassName={css.repositionWarning}
            value={selectedStageId}
            items={stageIdOptions}
            onChange={option => {
              setSelectedStageId(option)
              if (option.value === AllOption.value) {
                const newStepIdOptions = [...stepIdOptions]
                // Add All Steps option if not present
                if (!stepIdOptions.some(stepIdOption => stepIdOption.value === AllOption.value)) {
                  newStepIdOptions.unshift(AllStepsOption)
                  setStepIdOptions(newStepIdOptions)
                }
                setSelectedStepId(newStepIdOptions[0])
              } else if (option.value) {
                const stageStepIdOptions = stepIdOptionsFromStageKeyMap[option.value as string] || []
                const newStepIdOptions = [...stageStepIdOptions].filter(
                  stepIdOption => stepIdOption.value !== AllOption.value
                )
                // Remove All Steps option if only 1 option available
                if (newStepIdOptions.length === 1) {
                  setStepIdOptions(stageStepIdOptions)
                  setSelectedStepId(stageStepIdOptions[0])
                } else {
                  setStepIdOptions(stageStepIdOptions)
                  setSelectedStepId(stageStepIdOptions[1])
                }
              }
            }}
          />
        </div>
      )}
      {stepIdOptions && selectedStepId && (
        <div className={css.stepOptions}>
          <Select
            fill
            value={selectedStepId}
            items={stepIdOptions}
            disabled={selectedStageId?.value === AllOption.value && selectedStepId.value === AllOption.value}
            onChange={option => setSelectedStepId(option)}
          />
        </div>
      )}
    </Container>
    {testOverviewHasTests && (
      <Text
        className={css.poweredByTi}
        font={{ variation: FontVariation.TINY, weight: 'semi-bold' }}
        icon="upgrade-bolt"
        iconProps={{
          intent: 'primary',
          size: 16,
          color: Color.PRIMARY_8
        }}
        color={Color.PRIMARY_8}
      >
        {getString('pipeline.testsReports.poweredByTI')}
      </Text>
    )}
  </Container>
)

export function TIAndReports({
  header,
  testOverviewData,
  reportSummaryData,
  stageId,
  stepId,
  serviceToken,
  testsCountDiff,
  isAggregatedReports
}: {
  header: JSX.Element
  testOverviewData?: SelectionOverview | null
  reportSummaryData?: TestReportSummary | null
  stageId?: string
  stepId?: string
  serviceToken?: string | null
  testsCountDiff?: number
  isAggregatedReports?: boolean
}): JSX.Element {
  return (
    <>
      {header}
      <Layout.Horizontal spacing="large" margin={{ bottom: 'xlarge' }}>
        {renderTestsOverview({ testOverviewData, testsCountDiff })}
        {typeof reportSummaryData?.total_tests !== 'undefined' &&
          typeof reportSummaryData?.failed_tests !== 'undefined' &&
          typeof reportSummaryData?.successful_tests !== 'undefined' &&
          typeof reportSummaryData?.skipped_tests !== 'undefined' && (
            <TestsExecutionResult
              totalTests={reportSummaryData.total_tests}
              failedTests={reportSummaryData.failed_tests}
              successfulTests={reportSummaryData.successful_tests}
              skippedTests={reportSummaryData.skipped_tests}
            />
          )}
        {typeof testOverviewData?.selected_tests?.source_code_changes !== 'undefined' &&
          typeof testOverviewData?.selected_tests?.new_tests !== 'undefined' &&
          typeof testOverviewData?.selected_tests?.updated_tests !== 'undefined' && (
            <TestsSelectionBreakdown
              sourceCodeChanges={testOverviewData.selected_tests.source_code_changes}
              newTests={testOverviewData.selected_tests.new_tests}
              updatedTests={testOverviewData.selected_tests.updated_tests}
            />
          )}
      </Layout.Horizontal>
      <Layout.Horizontal spacing="large">
        {/* <TestsCoverage /> */}
        {/* TI is above Reports which is 100% width */}
        {stageId && stepId && serviceToken && (
          <TestsExecution
            stageId={stageId}
            stepId={stepId}
            serviceToken={serviceToken}
            showCallGraph
            isAggregatedReports={isAggregatedReports}
            reportSummaryData={reportSummaryData}
          />
        )}
      </Layout.Horizontal>
    </>
  )
}

export function TI({
  header,
  testOverviewData,
  testsCountDiff
}: {
  header: JSX.Element
  testOverviewData?: SelectionOverview | null
  testsCountDiff?: number
}): JSX.Element {
  return (
    <>
      {header}
      <Layout.Horizontal spacing="large" margin={{ bottom: 'xlarge' }}>
        {renderTestsOverview({ testOverviewData, testsCountDiff })}
        {typeof testOverviewData?.selected_tests?.source_code_changes !== 'undefined' &&
          typeof testOverviewData?.selected_tests?.new_tests !== 'undefined' &&
          typeof testOverviewData?.selected_tests?.updated_tests !== 'undefined' && (
            <TestsSelectionBreakdown
              sourceCodeChanges={testOverviewData.selected_tests.source_code_changes}
              newTests={testOverviewData.selected_tests.new_tests}
              updatedTests={testOverviewData.selected_tests.updated_tests}
            />
          )}
      </Layout.Horizontal>
    </>
  )
}

export function Reports({
  header,
  reportSummaryData,
  stageId,
  stepId,
  serviceToken,
  testsCountDiff,
  hasTIStep
}: {
  header: JSX.Element
  hasTIStep: boolean
  reportSummaryData?: TestReportSummary | null
  stageId?: string
  stepId?: string
  serviceToken?: string | null
  testsCountDiff?: number
}): JSX.Element {
  const { NG_LICENSES_ENABLED } = useFeatureFlags()

  return (
    <>
      {header}
      <Layout.Horizontal spacing="large" margin={{ bottom: 'xlarge' }}>
        {typeof reportSummaryData?.total_tests !== 'undefined' &&
          typeof reportSummaryData?.skipped_tests !== 'undefined' &&
          typeof reportSummaryData?.duration_ms !== 'undefined' &&
          typeof reportSummaryData?.failed_tests !== 'undefined' && (
            <TestsOverview
              totalTests={reportSummaryData.total_tests}
              skippedTests={reportSummaryData.skipped_tests}
              // timeSavedMS={reportSummaryData.time_saved_ms}
              durationMS={reportSummaryData.duration_ms}
              failedTests={reportSummaryData.failed_tests}
              testsCountDiff={testsCountDiff}
            />
          )}
        {typeof reportSummaryData?.total_tests !== 'undefined' &&
          typeof reportSummaryData?.failed_tests !== 'undefined' &&
          typeof reportSummaryData?.successful_tests !== 'undefined' &&
          typeof reportSummaryData?.skipped_tests !== 'undefined' && (
            <TestsExecutionResult
              totalTests={reportSummaryData.total_tests}
              failedTests={reportSummaryData.failed_tests}
              successfulTests={reportSummaryData.successful_tests}
              skippedTests={reportSummaryData.skipped_tests}
            />
          )}
        {NG_LICENSES_ENABLED && !hasTIStep && <TICallToAction />}
      </Layout.Horizontal>
      <Layout.Horizontal spacing="large">
        {/* <TestsCoverage /> */}
        {/* TI is above Reports which is 100% width */}
        {stageId && stepId && serviceToken && (
          <TestsExecution
            stageId={stageId}
            stepId={stepId}
            serviceToken={serviceToken}
            reportSummaryData={reportSummaryData}
          />
        )}
      </Layout.Horizontal>
    </>
  )
}

function BuildTests({ reportSummaryMock, testOverviewMock }: BuildTestsProps): React.ReactElement | null {
  const context = useExecutionContext()
  const { getString } = useStrings()

  const { accountId, orgIdentifier, projectIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()

  const {
    data: serviceToken,
    loading: serviceTokenLoading,
    error: serviceTokenError,
    refetch: refetchServiceToken
  } = useGetToken({
    queryParams: { accountId }
  })

  const [hasTIStep, setHasTIStep] = useState<boolean>(false)

  const [stageIdOptions, setStageIdOptions] = useState<SelectOption[]>([])
  const [selectedStageId, setSelectedStageId] = useState<SelectOption>()

  const [stepIdOptionsFromStageKeyMap, setStepIdOptionsFromStageKeyMap] = useState<{ [key: string]: SelectOption[] }>(
    {}
  )
  const [stepIdOptions, setStepIdOptions] = useState<SelectOption[]>([])
  const [selectedStepId, setSelectedStepId] = useState<SelectOption>()
  const stageId = selectedStageId?.value as string | undefined
  const stepId = selectedStepId?.value as string | undefined

  const isAggregatedStepsReport = stepId === AllOption.value
  // Second condition is cannot be All Steps with only 1 stage option aka All Stages
  const isAggregatedStageReports =
    stageId === AllOption.value || (stepId === AllOption.value && stageIdOptions.length === 1)
  const isAggregatedReports = isAggregatedStageReports || isAggregatedStepsReport
  const status = (context?.pipelineExecutionDetail?.pipelineExecutionSummary?.status || '').toUpperCase()
  const infoQueryParams = useMemo(
    () => ({
      accountId,
      orgId: orgIdentifier,
      projectId: projectIdentifier,
      pipelineId: context?.pipelineExecutionDetail?.pipelineExecutionSummary?.pipelineIdentifier || '',
      buildId: String(context?.pipelineExecutionDetail?.pipelineExecutionSummary?.runSequence || '')
    }),
    [
      accountId,
      orgIdentifier,
      projectIdentifier,
      context?.pipelineExecutionDetail?.pipelineExecutionSummary?.pipelineIdentifier,
      context?.pipelineExecutionDetail?.pipelineExecutionSummary?.runSequence
    ]
  )

  const {
    data: reportInfoData,
    error: reportInfoError,
    loading: reportInfoLoading,
    refetch: fetchReportInfo
  } = useReportsInfo({
    queryParams: infoQueryParams,
    lazy: true,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken || ''
      }
    }
  })

  const {
    data: testInfoData,
    error: testInfoError,
    loading: testInfoLoading,
    refetch: fetchTestInfo
  } = useTestInfo({
    queryParams: infoQueryParams,
    lazy: true,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken || ''
      }
    }
  })

  useEffect(() => {
    if (status && serviceToken) {
      fetchReportInfo()
      fetchTestInfo()
    }
  }, [status, serviceToken])

  useEffect(() => {
    if (reportInfoData && testInfoData) {
      const tiStepExists = Object.values(context?.allNodeMap || {})?.some(step => step.stepType === StepTypes.RUN_TESTS)
      setInitialStageAndSteps({
        reportInfoData,
        testInfoData,
        context,
        setStepIdOptionsFromStageKeyMap,
        setSelectedStageId,
        setSelectedStepId,
        setStageIdOptions,
        setStepIdOptions
      })

      if (testInfoData.length > 0 || tiStepExists) {
        setHasTIStep(true)
      }
    }
  }, [reportInfoData, testInfoData])

  const queryParams = useMemo(() => {
    const optionalKeys = getOptionalQueryParamKeys({ stageId, stepId })

    return {
      accountId,
      orgId: orgIdentifier,
      projectId: projectIdentifier,
      pipelineId: context?.pipelineExecutionDetail?.pipelineExecutionSummary?.pipelineIdentifier || '',
      buildId: String(context?.pipelineExecutionDetail?.pipelineExecutionSummary?.runSequence || ''),
      ...optionalKeys
    }
  }, [
    accountId,
    orgIdentifier,
    projectIdentifier,
    context?.pipelineExecutionDetail?.pipelineExecutionSummary?.pipelineIdentifier,
    context?.pipelineExecutionDetail?.pipelineExecutionSummary?.runSequence,
    stageId,
    stepId
  ])

  const {
    data: reportSummaryData,
    error: reportSummaryError,
    loading: reportSummaryLoading,
    refetch: fetchReportSummary
  } = useReportSummary({
    queryParams: { ...queryParams, report: 'junit' as const },
    lazy: true,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken || ''
      }
    },
    mock: reportSummaryMock
      ? {
          data: reportSummaryMock
        }
      : undefined
  })

  const {
    data: testOverviewData,
    error: testOverviewError,
    loading: testOverviewLoading,
    refetch: fetchTestOverview
  } = useTestOverview({
    queryParams,
    lazy: true,
    requestOptions: {
      headers: {
        'X-Harness-Token': serviceToken || ''
      }
    },
    mock: testOverviewMock
      ? {
          data: testOverviewMock
        }
      : undefined
  })

  const reportSummaryHasTests = (reportSummaryData?.total_tests || 0) > 0
  const testOverviewHasTests = (testOverviewData?.total_tests || 0) > 0

  const uiType = getUIType({ reportSummaryHasTests, testOverviewHasTests, reportInfoLoading, testInfoLoading })

  useEffect(() => {
    if (status && stageId && stepId) {
      fetchReportSummary()
      if (!isAggregatedReports) {
        // do not need overview call for ti-related data when aggregated.
        // summary call above will provide ui overview data
        fetchTestOverview()
      }
    }
  }, [stageId, stepId, status])

  const testsCountDiff = useMemo(() => {
    const newTests = testOverviewData?.selected_tests?.new_tests
    const total = testOverviewData?.total_tests
    if (newTests && total) {
      return Number(Number(newTests / (total / 100)).toFixed(2))
    }
    return 0
  }, [testOverviewData?.total_tests, testOverviewData?.selected_tests?.new_tests])

  // When build/execution is not resolved from context, render nothing
  if (!status) {
    return null
  }

  const error = getError({
    reportInfoData,
    reportSummaryError,
    serviceTokenError,
    testInfoData,
    testOverviewError,
    reportInfoError,
    testInfoError
  })
  if (error) {
    return (
      <PageError
        message={get(error, 'data.error_msg', error?.message)}
        onClick={() => {
          refetchServiceToken()

          if (serviceToken) {
            fetchReportInfo()
            fetchTestInfo()

            if (stageId && stepId) {
              fetchReportSummary()
              fetchTestOverview()
            }
          }
        }}
      />
    )
  }

  if (serviceTokenLoading || reportInfoLoading || testInfoLoading || testOverviewLoading || reportSummaryLoading) {
    return <PageSpinner />
  }

  let ui = null
  switch (uiType) {
    case UI.LoadingState:
      ui = <BuildZeroState isLoading={true} />
      break
    case UI.ZeroState:
      ui = (
        <>
          {stageIdOptions?.length > 1 || stepIdOptions?.length > 1
            ? renderHeader({
                stageIdOptions,
                selectedStageId,
                getString,
                setSelectedStageId,
                stepIdOptions,
                setStepIdOptions,
                setSelectedStepId,
                stepIdOptionsFromStageKeyMap,
                selectedStepId,
                testOverviewHasTests
              })
            : null}
          <BuildZeroState />
        </>
      )
      break
    case UI.TIAndReports:
      ui = (
        <TIAndReports
          header={renderHeader({
            stageIdOptions,
            selectedStageId,
            getString,
            setSelectedStageId,
            stepIdOptions,
            setStepIdOptions,
            setSelectedStepId,
            stepIdOptionsFromStageKeyMap,
            selectedStepId,
            testOverviewHasTests
          })}
          testOverviewData={testOverviewData}
          reportSummaryData={reportSummaryData}
          stageId={stageId}
          stepId={stepId}
          serviceToken={serviceToken}
          testsCountDiff={testsCountDiff}
          isAggregatedReports={isAggregatedReports}
        />
      )
      break
    case UI.TI:
      ui = (
        <TI
          header={renderHeader({
            stageIdOptions,
            selectedStageId,
            getString,
            setSelectedStageId,
            stepIdOptions,
            setStepIdOptions,
            setSelectedStepId,
            stepIdOptionsFromStageKeyMap,
            selectedStepId,
            testOverviewHasTests
          })}
          testOverviewData={testOverviewData}
          testsCountDiff={testsCountDiff}
        />
      )
      break
    case UI.Reports:
      ui = (
        <Reports
          header={renderHeader({
            stageIdOptions,
            selectedStageId,
            getString,
            setSelectedStageId,
            stepIdOptions,
            setStepIdOptions,
            setSelectedStepId,
            stepIdOptionsFromStageKeyMap,
            selectedStepId,
            testOverviewHasTests
          })}
          hasTIStep={hasTIStep}
          reportSummaryData={reportSummaryData}
          stageId={stageId}
          stepId={stepId}
          serviceToken={serviceToken}
          testsCountDiff={testsCountDiff}
        />
      )
      break
    default:
      ui = <BuildZeroState />
      break
  }

  return <div className={css.mainContainer}>{ui}</div>
}

export default BuildTests
