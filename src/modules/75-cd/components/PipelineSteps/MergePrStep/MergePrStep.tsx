/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'

import { Formik, FormInput, getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'

import { defaultTo, get } from 'lodash-es'

import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig } from 'services/cd-ng'

import { useStrings } from 'framework/strings'

import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StringsMap } from 'stringTypes'

import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { MergePRVariableStepProps, MergePRVariableView } from './MergePrVariableView'
import MergePRInputStep from './MergePrInputStep'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface MergePrProps {
  initialValues: StepElementConfig
  onUpdate?: (data: StepElementConfig) => void
  onChange?: (data: StepElementConfig) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  isNewStep?: boolean
  readonly?: boolean
  inputSetData?: {
    template?: StepElementConfig
    path?: string
    readonly?: boolean
  }
}

function MergePRWidget(props: MergePrProps, formikRef: StepFormikFowardRef<StepElementConfig>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep, readonly, allowableTypes, onChange, stepViewType } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <>
      <Formik<StepElementConfig>
        onSubmit={
          /* istanbul ignore next */
          (values: StepElementConfig) => {
            /* istanbul ignore next */
            onUpdate?.(values)
          }
        }
        validate={
          /* istanbul ignore next */
          (values: StepElementConfig) => {
            /* istanbul ignore next */
            onChange?.(values)
          }
        }
        formName="mergepr"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
        })}
      >
        {(formik: FormikProps<StepElementConfig>) => {
          // this is required
          setFormikRef(formikRef, formik)

          return (
            <>
              {stepViewType !== StepViewType.Template && (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('pipelineSteps.stepNameLabel')}
                    isIdentifierEditable={isNewStep && !readonly}
                    inputGroupProps={{
                      placeholder: getString('pipeline.stepNamePlaceholder'),
                      disabled: readonly
                    }}
                  />
                </div>
              )}
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormMultiTypeDurationField
                  name="timeout"
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{
                    enableConfigureOptions: false,
                    expressions,
                    disabled: readonly,
                    allowableTypes
                  }}
                  className={stepCss.duration}
                  disabled={readonly}
                />
                {getMultiTypeFromValue(formik.values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={formik.values.timeout as string}
                    type="String"
                    variableName="step.timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    // istanbul ignore next
                    onChange={
                      // istanbul ignore next
                      value => {
                        // istanbul ignore next
                        formik.setFieldValue('timeout', value)
                      }
                    }
                    isReadonly={readonly}
                  />
                )}
              </div>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const MergePRWidgetWithRef = React.forwardRef(MergePRWidget)
export class MergePR extends PipelineStep<StepElementConfig> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<StepElementConfig>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes,
      inputSetData,
      onChange
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <MergePRInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          allowableTypes={allowableTypes}
          readonly={!!get(inputSetData, 'readonly', false)}
          template={get(inputSetData, 'template', undefined)}
          path={get(inputSetData, 'path', '')}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return <MergePRVariableView {...(customStepProps as MergePRVariableStepProps)} originalData={initialValues} />
    }
    return (
      <MergePRWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={defaultTo(isNewStep, true)}
        stepViewType={defaultTo(stepViewType, StepViewType.Edit)}
        ref={formikRef}
        readonly={readonly}
        allowableTypes={allowableTypes}
        onChange={onChange}
      />
    )
  }

  protected type = StepType.MergePR
  protected stepName = 'Merge PR'
  protected stepIconColor = Color.GREY_700
  protected stepIcon: IconName = 'create-pr'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.createPR'

  // istanbul ignore next
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<StepElementConfig>): FormikErrors<StepElementConfig> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = {} as any
    // istanbul ignore next
    // istanbul ignore else
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      // istanbul ignore next
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      // istanbul ignore next
      if (isRequired) {
        // istanbul ignore next
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
    return errors
  }

  protected defaultValues: StepElementConfig = {
    name: '',
    identifier: '',
    type: StepType.MergePR,
    timeout: '10m'
  }
}
