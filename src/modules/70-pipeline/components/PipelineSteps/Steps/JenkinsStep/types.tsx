/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import type { FormikProps } from 'formik'
import type { GetDataError } from 'restful-react'
import type { MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import type { InputSetData, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { Failure } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import type { AllFailureStrategyConfig } from '../../AdvancedSteps/FailureStrategyPanel/utils'

export interface SubmenuSelectOption extends SelectOption {
  submenuItems: SelectOption[]
}
export interface jobParameterInterface {
  value: number | string
  id: string
  name?: string
  type?: 'String' | 'Number'
}

export interface JenkinsStepSpec {
  connectorRef: string
  jobName: string
  jobParameter: jobParameterInterface[]
  delegateSelectors: string[]
  unstableStatusAsSuccess?: boolean
  captureEnvironmentVariable?: boolean
}

export interface JenkinsStepData {
  identifier: string
  name?: string
  type: string
  timeout?: string
  failureStrategies?: AllFailureStrategyConfig[]
  spec: JenkinsStepSpec
}

export interface JenkinsStepFormSpec extends Omit<JenkinsStepSpec, 'jobName'> {
  jobName: SelectOption
}

export interface JenkinsStepFormData {
  identifier: string
  name?: string
  type: string
  timeout?: string
  failureStrategies?: AllFailureStrategyConfig[]
  spec: JenkinsStepFormSpec
}

export interface JenkinsStepVariableListModeProps {
  variablesData: JenkinsStepData
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
}

export interface JenkinsStepDeploymentModeProps {
  stepViewType: StepViewType
  initialValues: JenkinsStepData
  allowableTypes: MultiTypeInputType[]
  onUpdate?: (data: JenkinsStepData) => void
  inputSetData?: InputSetData<JenkinsStepData>
  formik?: any
}

export interface JenkinsStepStepModeProps {
  stepViewType: StepViewType
  initialValues: JenkinsStepData
  allowableTypes: MultiTypeInputType[]
  onUpdate?: (data: JenkinsStepData) => void
  onChange?: (data: JenkinsStepData) => void
  isNewStep?: boolean
  readonly?: boolean
}

export interface JenkinsFormContentInterface {
  formik: FormikProps<JenkinsStepData>
  //   refetchProjects: (props: UseGetJiraProjectsProps) => Promise<void>
  //   refetchProjectMetadata: (props: UseGetJiraIssueCreateMetadataProps) => Promise<void>
  //   fetchingProjects: boolean
  stepViewType: StepViewType
  allowableTypes: MultiTypeInputType[]
  //   fetchingProjectMetadata: boolean
  //   projectsResponse: ResponseListJiraProjectBasicNG | null
  //   projectMetaResponse: ResponseJiraIssueCreateMetadataNG | null
  projectsFetchError?: GetDataError<Failure | Error> | null
  projectMetadataFetchError?: GetDataError<Failure | Error> | null
  isNewStep?: boolean
  readonly?: boolean
}
