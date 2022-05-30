/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import type { FormikProps } from 'formik'
import type { GetDataError } from 'restful-react'
import type { MultiSelectOption, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import type { InputSetData, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  Failure,
  JiraFieldNG,
  ResponseJiraIssueCreateMetadataNG,
  ResponseListJiraProjectBasicNG,
  StepElementConfig,
  UseGetJiraIssueCreateMetadataProps,
  UseGetJiraProjectsProps
} from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import type { JiraProjectSelectOption } from '../JiraApproval/types'

export interface JiraCreateFieldType {
  name: string
  value: string | number | SelectOption | MultiSelectOption[]
}

export interface JiraFieldNGWithValue extends JiraFieldNG {
  value: string | number | SelectOption | MultiSelectOption[]
}

export interface JiraCreateData extends StepElementConfig {
  spec: {
    connectorRef: string | SelectOption
    projectKey: string | JiraProjectSelectOption
    issueType: string | JiraProjectSelectOption
    fields: JiraCreateFieldType[]
    selectedRequiredFields?: JiraFieldNGWithValue[]
    selectedOptionalFields?: JiraFieldNGWithValue[]
    delegateSelectors?: string[]
  }
}

export interface JiraCreateVariableListModeProps {
  variablesData: JiraCreateData
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
}

export interface JiraCreateStepModeProps {
  stepViewType: StepViewType
  initialValues: JiraCreateData
  onUpdate?: (data: JiraCreateData) => void
  onChange?: (data: JiraCreateData) => void
  allowableTypes: MultiTypeInputType[]
  isNewStep?: boolean
  readonly?: boolean
}

export interface JiraCreateFormContentInterface {
  formik: FormikProps<JiraCreateData>
  refetchProjects: (props: UseGetJiraProjectsProps) => Promise<void>
  stepViewType: StepViewType
  refetchProjectMetadata: (props: UseGetJiraIssueCreateMetadataProps) => Promise<void>
  fetchingProjects: boolean
  fetchingProjectMetadata: boolean
  projectsResponse: ResponseListJiraProjectBasicNG | null
  allowableTypes: MultiTypeInputType[]
  projectMetaResponse: ResponseJiraIssueCreateMetadataNG | null
  projectsFetchError?: GetDataError<Failure | Error> | null
  projectMetadataFetchError?: GetDataError<Failure | Error> | null
  isNewStep?: boolean
  readonly?: boolean
}

export enum JiraCreateFormFieldSelector {
  FIXED = 'FIXED',
  EXPRESSION = 'EXPRESSION'
}

export interface JiraFieldSelectorProps {
  fields: JiraFieldNG[]
  selectedFields: JiraFieldNG[]
  addSelectedFields: (selectedFields: JiraFieldNG[]) => void
  onCancel: () => void
}

export interface JiraDynamicFieldsSelectorInterface {
  connectorRef: string
  selectedProjectKey: string
  selectedIssueTypeKey: string
  jiraType: string
  projectOptions: JiraProjectSelectOption[]
  selectedFields?: JiraFieldNG[]
  addSelectedFields: (fields: JiraFieldNG[], selectedProjectKey: string, selectedIssueTypeKey: string) => void
  provideFieldList: (fields: JiraCreateFieldType[]) => void
  onCancel: () => void
  showProjectDisclaimer?: boolean
}

export interface JiraDynamicFieldsSelectorContentInterface extends JiraDynamicFieldsSelectorInterface {
  refetchProjectMetadata: (props: UseGetJiraIssueCreateMetadataProps) => Promise<void>
  fetchingProjectMetadata: boolean
  projectMetaResponse: ResponseJiraIssueCreateMetadataNG | null
  projectMetadataFetchError?: GetDataError<Failure | Error> | null
}

export interface JiraCreateDeploymentModeProps {
  stepViewType: StepViewType
  initialValues: JiraCreateData
  onUpdate?: (data: JiraCreateData) => void
  allowableTypes: MultiTypeInputType[]
  inputSetData?: InputSetData<JiraCreateData>
  formik?: any
}

export interface JiraCreateDeploymentModeFormContentInterface extends JiraCreateDeploymentModeProps {
  refetchProjects: (props: UseGetJiraProjectsProps) => Promise<void>
  refetchProjectMetadata: (props: UseGetJiraIssueCreateMetadataProps) => Promise<void>
  fetchingProjects: boolean
  fetchingProjectMetadata: boolean
  projectsResponse: ResponseListJiraProjectBasicNG | null
  projectMetaResponse: ResponseJiraIssueCreateMetadataNG | null
  projectsFetchError?: GetDataError<Failure | Error> | null
  projectMetadataFetchError?: GetDataError<Failure | Error> | null
}
