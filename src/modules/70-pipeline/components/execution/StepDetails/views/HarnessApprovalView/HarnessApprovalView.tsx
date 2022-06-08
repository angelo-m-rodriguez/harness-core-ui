/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Spinner, Tabs } from '@blueprintjs/core'
import { Button, Layout, PageError } from '@wings-software/uicore'
import { get, merge } from 'lodash-es'

import { useStrings } from 'framework/strings'
import type { StepDetailProps } from '@pipeline/factories/ExecutionFactory/types'
import {
  ResponseApprovalInstanceResponse,
  ResponseHarnessApprovalInstanceAuthorization,
  useGetApprovalInstance,
  useGetHarnessApprovalInstanceAuthorization
} from 'services/pipeline-ng'
import { useDeepCompareEffect } from '@common/hooks'
import { isExecutionWaiting } from '@pipeline/utils/statusHelpers'

import {
  HarnessApprovalTab,
  ApprovalData
} from '@pipeline/components/execution/StepDetails/tabs/HarnessApprovalTab/HarnessApprovalTab'
import { PipelineDetailsTab } from '@pipeline/components/execution/StepDetails/tabs/PipelineDetailsTab/PipelineDetailsTab'
import { InputOutputTab } from '@pipeline/components/execution/StepDetails/tabs/InputOutputTab/InputOutputTab'
import tabCss from '../DefaultView/DefaultView.module.scss'

export interface HarnessApprovalViewProps extends StepDetailProps {
  mock?: {
    data?: ResponseApprovalInstanceResponse
    loading?: boolean
  }
  getApprovalAuthorizationMock?: {
    loading: boolean
    data: ResponseHarnessApprovalInstanceAuthorization
  }
}

export function HarnessApprovalView(props: HarnessApprovalViewProps): React.ReactElement {
  const { step, mock, getApprovalAuthorizationMock } = props
  const approvalInstanceId = get(step, 'executableResponses[0].async.callbackIds[0]') || ''
  const isWaiting = isExecutionWaiting(step.status)
  const { getString } = useStrings()

  // store the data in state because the approve/reject call returns the updated state
  // hence we can save one additional call to the server
  const [approvalData, setApprovalData] = React.useState<ApprovalData>(null)
  const shouldFetchData = !!approvalInstanceId

  const {
    data,
    refetch,
    loading: loadingApprovalData,
    error
  } = useGetApprovalInstance({
    approvalInstanceId,
    mock,
    lazy: !shouldFetchData
  })

  const {
    data: authData,
    refetch: refetchAuthData,
    loading: loadingAuthData
  } = useGetHarnessApprovalInstanceAuthorization({
    approvalInstanceId,
    lazy: !shouldFetchData,
    mock: getApprovalAuthorizationMock
  })

  useDeepCompareEffect(() => {
    setApprovalData(data?.data as ApprovalData)
  }, [data])

  if (error) {
    return (
      <Layout.Vertical height="100%">
        <PageError message={(error.data as Error)?.message || error.message} />
      </Layout.Vertical>
    )
  }

  if (loadingApprovalData || loadingAuthData || !shouldFetchData) {
    return (
      <Layout.Vertical height="100%" flex={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </Layout.Vertical>
    )
  }

  return (
    <Tabs id="step-details" className={tabCss.tabs} renderActiveTabPanelOnly>
      <Tabs.Tab
        key="Approval"
        id="Approval"
        title={getString('approvalStage.title')}
        panel={
          <HarnessApprovalTab
            approvalInstanceId={approvalInstanceId}
            approvalData={approvalData}
            isWaiting={isWaiting}
            authData={authData}
            updateState={updatedData => {
              setApprovalData(updatedData)
              refetchAuthData()
            }}
            stepParameters={step.stepParameters}
          />
        }
      />
      <Tabs.Tab
        id="PipelineDetails"
        key="PipelineDetails"
        title={getString('common.pipelineDetails')}
        panel={<PipelineDetailsTab />}
      />
      <Tabs.Tab
        id="Input"
        key="Input"
        title={getString('common.input')}
        panel={<InputOutputTab baseFqn={step.baseFqn} mode="input" data={step.stepParameters} />}
      />
      <Tabs.Tab
        id="Output"
        key="Output"
        title={getString('outputLabel')}
        panel={
          <InputOutputTab
            baseFqn={step.baseFqn}
            mode="output"
            data={Array.isArray(step.outcomes) ? { output: merge({}, ...step.outcomes) } : step.outcomes}
          />
        }
      />
      <Tabs.Expander />
      <Button
        minimal
        intent="primary"
        icon="refresh"
        iconProps={{ size: 12, style: { marginRight: 'var(--spacing-2)' } }}
        style={{ transform: 'translateY(-5px)' }}
        onClick={() => refetch()}
      >
        {getString('common.refresh')}
      </Button>
    </Tabs>
  )
}
