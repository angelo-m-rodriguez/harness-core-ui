/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { ExecutionNode, ResponseApprovalInstanceResponse } from 'services/pipeline-ng'
import type { StepDetailProps } from '@pipeline/factories/ExecutionFactory/types'
import { BaseApprovalView } from '@pipeline/components/execution/StepDetails/views/BaseApprovalView/BaseApprovalView'
import { ServiceNowApprovalTab } from '@pipeline/components/execution/StepDetails/tabs/ServiceNowApprovalTab/ServiceNowApprovalTab'

export const REFRESH_APPROVAL = 'REFRESH_APPROVAL'

export interface ServiceNowApprovalViewProps extends StepDetailProps {
  step: ExecutionNode
  mock?: {
    data?: ResponseApprovalInstanceResponse
    loading?: boolean
  }
}

export function ServiceNowApprovalView(props: ServiceNowApprovalViewProps): React.ReactElement | null {
  return <BaseApprovalView {...props} approvalTabComponent={ServiceNowApprovalTab} />
}
