/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { get, pick } from 'lodash-es'

import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { VariableResponseMapValue } from 'services/pipeline-ng'
import type { StepElementConfig } from 'services/cd-ng'

import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export interface MergePRVariableStepProps {
  metadataMap: Record<string, VariableResponseMapValue>
  variablesData: StepElementConfig
  originalData: StepElementConfig
}

export function MergePRVariableView(props: MergePRVariableStepProps): React.ReactElement {
  const { variablesData, originalData, metadataMap } = props

  const data: Record<any, any> = pick(get(variablesData, 'spec', {}), ['shell', 'onDelegate'])

  return (
    <VariablesListTable
      className={pipelineVariableCss.variablePaddingL3}
      metadataMap={metadataMap}
      data={data}
      originalData={get(originalData, 'spec', {})}
    />
  )
}
