/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { AzureSlotDeploymentData, AzureSlotDeploymentVariableStepProps } from './AzureSlotDeploymentInterface'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export function AzureSlotDeploymentVariableStep({
  variablesData = {} as AzureSlotDeploymentData,
  metadataMap,
  initialValues
}: AzureSlotDeploymentVariableStepProps): React.ReactElement {
  return (
    <VariablesListTable
      data={variablesData}
      originalData={initialValues}
      metadataMap={metadataMap}
      className={pipelineVariableCss.variablePaddingL3}
    />
  )
}
