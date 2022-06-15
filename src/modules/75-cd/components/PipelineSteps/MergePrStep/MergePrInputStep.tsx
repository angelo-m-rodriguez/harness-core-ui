/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getMultiTypeFromValue, MultiTypeInputType, FormikForm } from '@wings-software/uicore'
import { get, defaultTo } from 'lodash-es'
import cx from 'classnames'

import { useStrings } from 'framework/strings'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { StepElementConfig } from 'services/cd-ng'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export interface MergePrInputStepProps {
  initialValues: StepElementConfig
  onUpdate?: (data: StepElementConfig) => void
  onChange?: (data: StepElementConfig) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  readonly?: boolean
  template?: StepElementConfig
  path?: string
}

export default function MergePRInputStep(props: MergePrInputStepProps): React.ReactElement {
  const { template, path, readonly, allowableTypes } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const prefix = defaultTo(path, '')

  return (
    <FormikForm>
      {getMultiTypeFromValue(get(template, 'timeout', '')) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${prefix}timeout`}
            disabled={readonly}
          />
        </div>
      )}
    </FormikForm>
  )
}
