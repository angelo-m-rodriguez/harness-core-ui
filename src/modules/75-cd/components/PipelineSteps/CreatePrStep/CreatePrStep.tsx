/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik, getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'

import { defaultTo, get } from 'lodash-es'

import { StepViewType, StepProps, ValidateInputSetProps, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig } from 'services/cd-ng'

import type { VariableMergeServiceResponse } from 'services/pipeline-ng'

import { useStrings } from 'framework/strings'

import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import type { StringsMap } from 'stringTypes'
import CreatePRScript from './CreatePrScript'

import CreatePRInputStep from './CreatePRInputStep'
import { CreatePRVariableStepProps, CreatePRVariableView } from './CreatePRVariableStep'

export interface CreatePRStepData extends StepElementConfig {
  spec?: {
    overrideConfig: boolean
    shell?: string
    source?: {
      type: string
      spec: {
        updateConfigScript?: string
      }
    }
  }
}

interface CreatePrProps {
  initialValues: CreatePRStepData
  onUpdate?: (data: CreatePRStepData) => void
  onChange?: (data: CreatePRStepData) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  isNewStep?: boolean
  readonly?: boolean
  inputSetData?: {
    template?: CreatePRStepData
    path?: string
    readonly?: boolean
  }
}

export interface K8sBGSwapServicesVariablesStepProps {
  initialValues: CreatePRStepData
  stageIdentifier: string
  onUpdate?(data: CreatePRStepData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: CreatePRStepData
}

function CreatePRWidget(props: CreatePrProps, formikRef: StepFormikFowardRef<CreatePRStepData>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep, readonly, allowableTypes, onChange, stepViewType } = props
  const { getString } = useStrings()
  return (
    <>
      <Formik<CreatePRStepData>
        onSubmit={
          /* istanbul ignore next */
          (values: CreatePRStepData) => {
            /* istanbul ignore next */
            onUpdate?.(values)
          }
        }
        validate={
          /* istanbul ignore next */
          (values: CreatePRStepData) => {
            /* istanbul ignore next */
            onChange?.(values)
          }
        }
        formName="createpr"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
        })}
      >
        {(formik: FormikProps<CreatePRStepData>) => {
          // this is required
          setFormikRef(formikRef, formik)

          return (
            <React.Fragment>
              <CreatePRScript
                isNewStep={defaultTo(isNewStep, true)}
                stepViewType={stepViewType}
                formik={formik}
                readonly={readonly}
                allowableTypes={allowableTypes}
              />
            </React.Fragment>
          )
        }}
      </Formik>
    </>
  )
}

const CreatePRWidgetWithRef = React.forwardRef(CreatePRWidget)
export class CreatePr extends PipelineStep<CreatePRStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<CreatePRStepData>): JSX.Element {
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
        <CreatePRInputStep
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
      return <CreatePRVariableView {...(customStepProps as CreatePRVariableStepProps)} originalData={initialValues} />
    }
    return (
      <CreatePRWidgetWithRef
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

  protected type = StepType.CreatePR
  protected stepName = 'Create PR'
  protected stepIconColor = Color.GREY_700
  protected stepIcon: IconName = 'create-pr'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.createPR'

  // istanbul ignore next
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<CreatePRStepData>): FormikErrors<CreatePRStepData> {
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

  protected defaultValues: CreatePRStepData = {
    name: '',
    identifier: '',
    type: StepType.CreatePR,
    timeout: '10m',
    spec: {
      overrideConfig: false,
      shell: 'Bash'
    }
  }
}
