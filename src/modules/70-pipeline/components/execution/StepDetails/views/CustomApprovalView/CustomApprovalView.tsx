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
import { CustomApprovalTab } from '@pipeline/components/execution/StepDetails/tabs/CustomApprovalTab/CustomApprovalTab'

export const REFRESH_APPROVAL = 'REFRESH_APPROVAL'

export interface CustomApprovalViewProps extends StepDetailProps {
  step: ExecutionNode
  mock?: {
    data?: ResponseApprovalInstanceResponse
    loading?: boolean
  }
}

export function CustomApprovalView(props: CustomApprovalViewProps): React.ReactElement | null {
  return <BaseApprovalView {...props} approvalTabComponent={CustomApprovalTab} />
}
