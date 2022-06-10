/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FormikProps } from 'formik'
import { isEmpty } from 'lodash-es'

import { getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import type { EnvironmentResponseDTO, PipelineInfrastructure } from 'services/cd-ng'

import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'

export interface DeployInfrastructureProps {
  initialValues: PipelineInfrastructure
  onUpdate?: (data: PipelineInfrastructure) => void
  readonly: boolean
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  inputSetData?: {
    template?: PipelineInfrastructure
    path?: string
    readonly?: boolean
  }
}

export interface DeployInfrastructureState {
  isEdit: boolean
  isEnvironment: boolean
  formik?: FormikProps<PipelineInfrastructure>
  data?: EnvironmentResponseDTO
}

export function isEditEnvironment(data: PipelineInfrastructure): boolean {
  if (getMultiTypeFromValue(data.environmentRef) !== MultiTypeInputType.RUNTIME && !isEmpty(data.environmentRef)) {
    return true
  } else if (data.environment && !isEmpty(data.environment.identifier)) {
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
  } else if (data.infrastructure && !isEmpty(data.infrastructure.identifier)) {
    return true
  }
  return false
}
