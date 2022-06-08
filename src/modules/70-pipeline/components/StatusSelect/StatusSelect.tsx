/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { MultiSelectDropDown, MultiSelectOption } from '@wings-software/uicore'
import { defaultTo } from 'lodash-es'
import { ExecutionStatus, ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import { StringKeys, useStrings } from 'framework/strings'

type AllowedStatus = Exclude<
  ExecutionStatus,
  | 'NotStarted'
  | 'Queued'
  | 'Skipped'
  | 'Pausing'
  | 'Suspended'
  | 'AsyncWaiting'
  | 'TaskWaiting'
  | 'TimedWaiting'
  | 'Errored'
  | 'IgnoreFailed'
  | 'Discontinuing'
>
const allowedOptions = [
  ExecutionStatusEnum.Aborted,
  ExecutionStatusEnum.Expired,
  ExecutionStatusEnum.Failed,
  ExecutionStatusEnum.Running,
  ExecutionStatusEnum.Success,
  ExecutionStatusEnum.ApprovalRejected,
  ExecutionStatusEnum.Paused,
  ExecutionStatusEnum.ApprovalWaiting,
  ExecutionStatusEnum.InterventionWaiting,
  ExecutionStatusEnum.ResourceWaiting
] as AllowedStatus[]

const labelMap: Record<AllowedStatus, StringKeys> = {
  Aborted: 'pipeline.executionFilters.labels.Aborted',
  Expired: 'pipeline.executionFilters.labels.Expired',
  Failed: 'pipeline.executionFilters.labels.Failed',
  Running: 'pipeline.executionFilters.labels.Running',
  Success: 'pipeline.executionFilters.labels.Success',
  ApprovalRejected: 'pipeline.executionFilters.labels.ApprovalRejected',
  Paused: 'pipeline.executionFilters.labels.Paused',
  ApprovalWaiting: 'pipeline.executionFilters.labels.ApprovalWaiting',
  InterventionWaiting: 'pipeline.executionFilters.labels.InterventionWaiting',
  ResourceWaiting: 'pipeline.executionFilters.labels.Waiting',
  Waiting: 'pipeline.executionFilters.labels.Waiting',
  InputWaiting: 'pipeline.executionFilters.labels.Waiting'
}

export interface StatusSelectProps {
  value?: ExecutionStatus[] | null
  onSelect(status: ExecutionStatus[] | null): void
}

export default function StatusSelect(props: StatusSelectProps): React.ReactElement {
  const { value, onSelect } = props
  const { getString } = useStrings()

  const getAllowedOptions = React.useMemo(
    () =>
      allowedOptions.map(item => ({
        label: getString(labelMap[item]),
        value: item
      })) as MultiSelectOption[],
    [allowedOptions, labelMap]
  )

  return (
    <MultiSelectDropDown
      buttonTestId="status-select"
      value={defaultTo(
        value?.map(item => ({
          label: getString(labelMap[item as AllowedStatus]),
          value: item
        })),
        []
      )}
      onChange={option => {
        onSelect((option.map(item => item.value) as ExecutionStatus[]) || null)
      }}
      items={getAllowedOptions}
      usePortal={true}
      placeholder={getString('status')}
    />
  )
}
