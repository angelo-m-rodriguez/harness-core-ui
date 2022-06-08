/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { defaultTo, isEmpty, set } from 'lodash-es'
import { FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { StringsMap } from 'stringTypes'
import { PipelineStep, StepProps } from '@pipeline/components/PipelineSteps/PipelineStep'
import { StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import LockWidget from './LockWidget'
import LockInputStep from './LockInputStep'
import LockVariableStep, { LockVariableViewProps } from './LockVariableStep'
import { LockData, SCOPE_KEYS } from './helper'

const LockWidgetWithRef = React.forwardRef(LockWidget)
export class LockStep extends PipelineStep<LockData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  renderStep(props: StepProps<LockData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      isNewStep,
      readonly,
      onChange,
      allowableTypes,
      customStepProps
    } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <LockInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
          inputSetData={inputSetData}
          readonly={!!inputSetData?.readonly}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <LockVariableStep
          originalData={initialValues}
          variablesData={(customStepProps as LockVariableViewProps)?.variablesData as any}
          metadataMap={(customStepProps as LockVariableViewProps)?.metadataMap}
        />
      )
    }
    return (
      <LockWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        stepViewType={stepViewType || StepViewType.Edit}
        ref={formikRef}
        readonly={readonly}
        onChange={onChange}
        allowableTypes={allowableTypes}
      />
    )
  }

  validateInputSet({ data, template, getString, viewType }: ValidateInputSetProps<LockData>): Record<string, any> {
    const errors: FormikErrors<LockData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (isEmpty(data?.timeout) && getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })

      try {
        timeout.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.key) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.key)
    ) {
      set(errors, 'spec.key', getString?.('pipeline.lockStep.keyRequired'))
    }

    if (
      getMultiTypeFromValue(template?.spec?.scope) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.scope)
    ) {
      set(errors, 'spec.scope', getString?.('pipeline.lockStep.scopeRequired'))
    }

    /* istanbul ignore else */
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }

  processFormData(values: LockData): LockData {
    return values
  }

  protected type = StepType.Lock
  protected stepName = 'Queue'
  protected stepIcon: IconName = 'queue-step'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.Lock'

  protected defaultValues: LockData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.Lock,
    spec: {
      key: '',
      scope: SCOPE_KEYS.STAGE
    }
  }
}
