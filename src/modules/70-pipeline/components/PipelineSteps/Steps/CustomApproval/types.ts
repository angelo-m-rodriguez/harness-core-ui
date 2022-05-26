/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import * as Yup from 'yup'
import type { UseStringsReturn } from 'framework/strings'
import type { CustomApprovalStepInfo, StepElementConfig } from 'services/cd-ng'
import type { ApprovalRejectionCriteria } from '@pipeline/components/PipelineSteps/Steps/Common/types'

export const scriptInputType: SelectOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' }
]

export const variableSchema = (
  getString: UseStringsReturn['getString']
): Yup.NotRequiredArraySchema<
  | {
      name: string
      value: string
      type: string
    }
  | undefined
> =>
  Yup.array().of(
    Yup.object({
      name: Yup.string().required(getString('common.validation.nameIsRequired')),
      value: Yup.string().required(getString('common.validation.valueIsRequired')),
      type: Yup.string().trim().required(getString('common.validation.typeIsRequired'))
    })
  )

export const scriptOutputType: SelectOption[] = [{ label: 'String', value: 'String' }]

export interface CustomApprovalStepVariable {
  value: number | string
  id: string
  name?: string
  type?: 'String' | 'Number'
}
export interface CustomApprovalOutputStepVariable {
  value: number | string
  id: string
  name?: string
  type?: 'String'
}
interface CustomApprovalSource {
  type?: string
  spec?: CustomApprovalInline
}
export interface CustomApprovalInline {
  script?: string
}
export interface CustomApprovalData extends StepElementConfig {
  spec: Omit<CustomApprovalStepInfo, 'environmentVariables' | 'outputVariables' | 'source' | 'rejectionCriteria'> & {
    environmentVariables?: Array<Omit<CustomApprovalStepVariable, 'id'>>
    outputVariables?: Array<Omit<CustomApprovalOutputStepVariable, 'id'>>
    source?: CustomApprovalSource
    rejectionCriteria?: ApprovalRejectionCriteria
  }
}

export interface CustomApprovalFormData extends StepElementConfig {
  spec: Omit<CustomApprovalStepInfo, 'environmentVariables' | 'outputVariables' | 'source' | 'rejectionCriteria'> & {
    environmentVariables?: Array<CustomApprovalStepVariable>
    outputVariables?: Array<CustomApprovalOutputStepVariable>
    source?: CustomApprovalSource
    rejectionCriteria?: ApprovalRejectionCriteria
  }
}
