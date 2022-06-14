/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { VariableResponseMapValue } from 'services/pipeline-ng'
import type { StepElementConfig } from 'services/cd-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface QueueVariableViewProps {
  metadataMap: Record<string, VariableResponseMapValue>
  variablesData: StepElementConfig // check if this type is correct
  originalData: StepElementConfig
}

function QueueVariableStep({ metadataMap, originalData, variablesData }: QueueVariableViewProps) {
  return (
    <VariablesListTable
      className={pipelineVariableCss.variablePaddingL3}
      metadataMap={metadataMap}
      data={variablesData.spec}
      originalData={originalData?.spec}
    />
  )
}

export default QueueVariableStep
