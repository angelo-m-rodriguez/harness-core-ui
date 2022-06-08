/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { flatObject } from '../Common/ApprovalCommons'
import type { JenkinsStepData } from './types'

export interface JenkinsStepVariablesProps {
  initialValues: JenkinsStepData
  stageIdentifier: string
  onUpdate?(data: JenkinsStepData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: JenkinsStepData
}

export const JenkinsStepVariables = ({
  variablesData,
  metadataMap,
  initialValues
}: JenkinsStepVariablesProps): JSX.Element => (
  <VariablesListTable<JenkinsStepData>
    data={flatObject(variablesData) as unknown as JenkinsStepData}
    originalData={initialValues}
    metadataMap={metadataMap}
  />
)
