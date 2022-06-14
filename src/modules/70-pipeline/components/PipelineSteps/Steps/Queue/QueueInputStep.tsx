/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { getScopeOptions, QueueProps } from './helper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

function QueueInputStep({ inputSetData, readonly, allowableTypes }: QueueProps) {
  const { expressions } = useVariablesExpression()
  const path = inputSetData?.path || ''
  const prefix = isEmpty(path) ? '' : `${path}.`
  const { getString } = useStrings()
  const scopeOptions = getScopeOptions(getString)

  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
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
      {getMultiTypeFromValue(inputSetData?.template?.spec?.key) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormInput.MultiTextInput
            label={getString('pipeline.queueStep.resourceKey')}
            name={`${prefix}spec.key`}
            multiTextInputProps={{ expressions, allowableTypes }}
            placeholder={getString('pipeline.queueStep.keyPlaceholder')}
            disabled={!!readonly}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.scope) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormInput.MultiTypeInput
            label={getString('pipeline.queueStep.scope')}
            name={`${prefix}spec.scope`}
            useValue
            selectItems={scopeOptions}
            multiTypeInputProps={{
              expressions,
              disabled: readonly,
              allowableTypes
            }}
            disabled={readonly}
            placeholder={getString('pipeline.queueStep.scopePlaceholder')}
          />
        </div>
      )}
    </>
  )
}

export default QueueInputStep
