/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, Formik, FormInput, Layout, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import cx from 'classnames'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'

import { isEmpty } from 'lodash-es'
import {
  StepViewType,
  StepProps,
  ValidateInputSetProps,
  setFormikRef,
  StepFormikFowardRef,
  InputSetData
} from '@pipeline/components/AbstractSteps/Step'
import type { ServerlessAwsLambdaRollbackStepInfo, StepElementConfig } from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import { FormMultiTypeCheckboxField } from '@common/components/MultiTypeCheckbox/MultiTypeCheckbox'
import type { StringsMap } from 'stringTypes'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

interface ServerlessLambdaRollbackData extends StepElementConfig {
  spec: Omit<ServerlessAwsLambdaRollbackStepInfo, 'skipDryRun'> & { skipDryRun: boolean }
}

export interface ServerlessLambdaRollbackVariableStepProps {
  initialValues: ServerlessLambdaRollbackData
  stageIdentifier: string
  onUpdate?(data: ServerlessLambdaRollbackData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: ServerlessLambdaRollbackData
}

interface ServerlessLambdaRollbackProps {
  initialValues: ServerlessLambdaRollbackData
  onUpdate?: (data: ServerlessLambdaRollbackData) => void
  onChange?: (data: ServerlessLambdaRollbackData) => void
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  stepViewType?: StepViewType
  isNewStep?: boolean
  inputSetData: {
    template?: ServerlessLambdaRollbackData
    path?: string
    readonly?: boolean
  }
}

function ServerlessLambdaRollbackWidget(
  props: ServerlessLambdaRollbackProps,
  formikRef: StepFormikFowardRef<ServerlessLambdaRollbackData>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, readonly, allowableTypes, onChange, stepViewType } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      <Formik<ServerlessLambdaRollbackData>
        onSubmit={(values: ServerlessLambdaRollbackData) => {
          onUpdate?.({ ...values, spec: { skipDryRun: false } })
        }}
        formName="ServerlessLambdaRB"
        initialValues={initialValues}
        validate={data => {
          onChange?.({ ...data, spec: { skipDryRun: false } })
        }}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
        })}
      >
        {(formik: FormikProps<ServerlessLambdaRollbackData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)

          return (
            <Layout.Vertical padding={{ left: 'xsmall', right: 'xsmall' }}>
              {stepViewType !== StepViewType.Template && (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('name')}
                    isIdentifierEditable={isNewStep}
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
                  disabled={readonly}
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{
                    enableConfigureOptions: false,
                    expressions,
                    disabled: readonly,
                    allowableTypes
                  }}
                />
                {getMultiTypeFromValue(values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values.timeout as string}
                    type="String"
                    variableName="step.timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('timeout', value)
                    }}
                    isReadonly={readonly}
                  />
                )}
              </div>
            </Layout.Vertical>
          )
        }}
      </Formik>
    </>
  )
}

const ServerlessLambdaRollbackInputStep: React.FC<ServerlessLambdaRollbackProps> = ({
  inputSetData,
  allowableTypes
}) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(inputSetData.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            name={`${isEmpty(inputSetData.path) ? '' : `${inputSetData.path}.`}timeout`}
            label={getString('pipelineSteps.timeoutLabel')}
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes: allowableTypes,
              expressions,
              disabled: inputSetData.readonly
            }}
            disabled={inputSetData.readonly}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData.template?.spec?.skipDryRun) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes: allowableTypes
            }}
            name={`${isEmpty(inputSetData.path) ? '' : `${inputSetData.path}.`}spec.skipDryRun`}
            className={stepCss.checkbox}
            label={getString('pipelineSteps.skipDryRun')}
            disabled={inputSetData.readonly}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
    </>
  )
}

const ServerlessLambdaRollbackVariableStep: React.FC<ServerlessLambdaRollbackVariableStepProps> = ({
  variablesData,
  metadataMap,
  initialValues
}) => {
  return (
    <VariablesListTable
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
      className={pipelineVariablesCss.variablePaddingL3}
    />
  )
}

const ServerlessLambdaRollbackWidgetWithRef = React.forwardRef(ServerlessLambdaRollbackWidget)

export class ServerlessLambdaRollbackStep extends PipelineStep<ServerlessLambdaRollbackData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<ServerlessLambdaRollbackData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      onChange,
      allowableTypes
    } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <ServerlessLambdaRollbackInputStep
          allowableTypes={allowableTypes}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          inputSetData={inputSetData as InputSetData<ServerlessLambdaRollbackData>}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <ServerlessLambdaRollbackVariableStep
          {...(customStepProps as ServerlessLambdaRollbackVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <ServerlessLambdaRollbackWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType}
        readonly={readonly}
        ref={formikRef}
        inputSetData={inputSetData as InputSetData<ServerlessLambdaRollbackData>}
      />
    )
  }
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ServerlessLambdaRollbackData>): FormikErrors<ServerlessLambdaRollbackData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = { spec: {} } as any
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
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
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }

  protected type = StepType.ServerlessAwsLambdaRollback
  protected stepName = 'Serverless Lambda Rollback Step'
  protected stepIcon: IconName = 'main-rollback'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ServerlessLambdaRollback'

  protected defaultValues: ServerlessLambdaRollbackData = {
    identifier: '',
    name: '',
    type: StepType.ServerlessAwsLambdaRollback,
    timeout: '10m',
    spec: {
      skipDryRun: false
    }
  }
}
