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
import type {
  Failure,
  StepElementConfig,
  UseGetServiceNowIssueCreateMetadataProps,
  ResponseListServiceNowFieldNG,
  ResponseListServiceNowTicketTypeDTO,
  UseGetServiceNowTicketTypesProps,
  ResponseListServiceNowTemplate,
  ServiceNowFieldValueNG,
  UseGetServiceNowTemplateMetadataProps
} from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import type { ServiceNowTicketTypeSelectOption } from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/types'

import type {
  ServiceNowCreateFieldType,
  ServiceNowFieldNGWithValue,
  FieldType
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'

export interface ServiceNowUpdateData extends StepElementConfig {
  spec: {
    connectorRef: string | SelectOption
    ticketType: string | ServiceNowTicketTypeSelectOption
    fields: ServiceNowCreateFieldType[]
    selectedFields?: ServiceNowFieldNGWithValue[]
    delegateSelectors?: string[]
    fieldType?: FieldType
    ticketNumber: string
    description?: string
    shortDescription?: string
    templateFields?: ServiceNowFieldValueNG[]
    templateName?: string
    useServiceNowTemplate: boolean
    isTemplateSectionAvailable?: boolean
  }
}

export interface ServiceNowUpdateVariableListModeProps {
  variablesData: ServiceNowUpdateData
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
}

export interface ServiceNowUpdateStepModeProps {
  stepViewType: StepViewType
  initialValues: ServiceNowUpdateData
  onUpdate?: (data: ServiceNowUpdateData) => void
  onChange?: (data: ServiceNowUpdateData) => void
  allowableTypes: MultiTypeInputType[]
  isNewStep?: boolean
  readonly?: boolean
}

export interface ServiceNowUpdateFormContentInterface {
  formik: FormikProps<ServiceNowUpdateData>
  stepViewType: StepViewType
  allowableTypes: MultiTypeInputType[]
  isNewStep?: boolean
  readonly?: boolean
  refetchServiceNowTicketTypes: (props: UseGetServiceNowTicketTypesProps) => Promise<void>
  serviceNowTicketTypesFetchError?: GetDataError<Failure | Error> | null
  fetchingServiceNowTicketTypes: boolean
  serviceNowTicketTypesResponse: ResponseListServiceNowTicketTypeDTO | null
  refetchServiceNowMetadata: (props: UseGetServiceNowIssueCreateMetadataProps) => Promise<void>
  serviceNowMetadataFetchError?: GetDataError<Failure | Error> | null
  fetchingServiceNowMetadata: boolean
  serviceNowMetadataResponse: ResponseListServiceNowFieldNG | null
  refetchServiceNowTemplate: (props: UseGetServiceNowTemplateMetadataProps) => Promise<void>
  serviceNowTemplateResponse: ResponseListServiceNowTemplate | null
  fetchingServiceNowTemplate: boolean
  serviceNowTemplateFetchError?: GetDataError<Failure | Error> | null
}

export interface ServiceNowUpdateDeploymentModeProps {
  stepViewType: StepViewType
  initialValues: ServiceNowUpdateData
  onUpdate?: (data: ServiceNowUpdateData) => void
  allowableTypes: MultiTypeInputType[]
  inputSetData?: InputSetData<ServiceNowUpdateData>
  formik?: any
}

export interface ServiceNowUpdateDeploymentModeFormContentInterface extends ServiceNowUpdateDeploymentModeProps {
  refetchServiceNowTicketTypes: (props: UseGetServiceNowTicketTypesProps) => Promise<void>
  serviceNowTicketTypesFetchError?: GetDataError<Failure | Error> | null
  fetchingServiceNowTicketTypes: boolean
  serviceNowTicketTypesResponse: ResponseListServiceNowTicketTypeDTO | null
  refetchServiceNowMetadata: (props: UseGetServiceNowIssueCreateMetadataProps) => Promise<void>
  serviceNowMetadataFetchError?: GetDataError<Failure | Error> | null
  fetchingServiceNowMetadata: boolean
  serviceNowMetadataResponse: ResponseListServiceNowFieldNG | null
}
