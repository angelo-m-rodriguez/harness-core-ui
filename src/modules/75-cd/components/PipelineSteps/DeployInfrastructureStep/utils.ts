/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FormikProps } from 'formik'
import { isEmpty } from 'lodash-es'

import { getMultiTypeFromValue, MultiTypeInputType, SelectOption } from '@harness/uicore'
import type { EnvironmentResponseDTO, PipelineInfrastructure } from 'services/cd-ng'

import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'

export interface PipelineInfrastructureV2 extends PipelineInfrastructure {
  environmentOrEnvGroupRef?: SelectOption
  environmentGroup?: any
  environmentRef2?: any
  infrastructureRef?: any
  deployToAll?: boolean
}

export interface DeployInfrastructureProps {
  initialValues: PipelineInfrastructureV2
  onUpdate?: (data: PipelineInfrastructureV2) => void
  readonly: boolean
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  inputSetData?: {
    template?: PipelineInfrastructureV2
    path?: string
    readonly?: boolean
  }
}

export interface DeployInfrastructureState {
  isEdit: boolean
  isEnvironment: boolean
  formik?: FormikProps<PipelineInfrastructureV2>
  data?: EnvironmentResponseDTO
}

export function isEditEnvironment(data: PipelineInfrastructureV2): boolean {
  if (
    getMultiTypeFromValue(data.environmentOrEnvGroupRef) !== MultiTypeInputType.RUNTIME &&
    !isEmpty(data.environmentOrEnvGroupRef)
  ) {
    return true
  }
  return false
}

export function isEditInfrastructure(data: any): boolean {
  if (
    getMultiTypeFromValue(data.infrastructureRef) !== MultiTypeInputType.RUNTIME &&
    !isEmpty(data.infrastructureRef)
  ) {
    return true
  }
  return false
}
