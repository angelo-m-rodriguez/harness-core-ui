import React from 'react'
import { IconName, Formik, Layout, FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import cx from 'classnames'
import { FormikErrors, FormikProps, yupToFormErrors } from 'formik'

import { isEmpty } from 'lodash-es'

import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { StepViewType, StepProps } from '@pipeline/components/AbstractSteps/Step'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepElementConfig, K8sBGSwapServicesStepInfo } from 'services/cd-ng'

import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'

import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { useStrings } from 'framework/strings'
import type { UseStringsReturn } from 'framework/strings'

import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface K8sBGSwapServicesData extends StepElementConfig {
  spec: K8sBGSwapServicesStepInfo
}

interface K8sBGSwapProps {
  initialValues: K8sBGSwapServicesData
  onUpdate?: (data: K8sBGSwapServicesData) => void
  stepViewType?: StepViewType
  isNewStep?: boolean
  readonly?: boolean
  inputSetData?: {
    template?: K8sBGSwapServicesData
    path?: string
    readonly?: boolean
  }
}

export interface K8sBGSwapServicesVariablesStepProps {
  initialValues: K8sBGSwapServicesData
  stageIdentifier: string
  onUpdate?(data: K8sBGSwapServicesData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData: K8sBGSwapServicesData
}

function K8sBGSwapWidget(
  props: K8sBGSwapProps,
  formikRef: StepFormikFowardRef<K8sBGSwapServicesData>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, readonly } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      <Formik<K8sBGSwapServicesData>
        onSubmit={(values: K8sBGSwapServicesData) => {
          /* istanbul ignore next */
          onUpdate?.({ ...values, spec: { skipDryRun: false } })
        }}
        formName="k8BgSwap"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          identifier: IdentifierSchema()
        })}
      >
        {(formik: FormikProps<K8sBGSwapServicesData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)

          return (
            <>
              <Layout.Vertical padding={{ left: 'xsmall', right: 'xsmall' }}>
                <div className={cx(stepCss.formGroup, stepCss.md)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('name')}
                    isIdentifierEditable={isNewStep}
                    inputGroupProps={{ disabled: readonly }}
                  />
                </div>

                <div className={cx(stepCss.formGroup, stepCss.sm)}>
                  <FormMultiTypeDurationField
                    name="timeout"
                    label={getString('pipelineSteps.timeoutLabel')}
                    className={stepCss.duration}
                    multiTypeDurationProps={{ enableConfigureOptions: false, expressions, disabled: readonly }}
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
                        /* istanbul ignore next */
                        setFieldValue('timeout', value)
                      }}
                      isReadonly={readonly}
                    />
                  )}
                </div>
              </Layout.Vertical>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const K8sBGSwapInputStep: React.FC<K8sBGSwapProps> = ({ inputSetData }) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
              expressions,
              disabled: inputSetData?.readonly
            }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            label={getString('pipelineSteps.timeoutLabel')}
            disabled={inputSetData?.readonly}
          />
        </div>
      )}
    </>
  )
}

const K8sBGSwapServicesVariablesStep: React.FC<K8sBGSwapServicesVariablesStepProps> = ({
  variablesData,
  metadataMap,
  initialValues
}) => {
  return <VariablesListTable data={variablesData.spec} originalData={initialValues.spec} metadataMap={metadataMap} />
}

const K8sBGSwapWidgetWithRef = React.forwardRef(K8sBGSwapWidget)
export class K8sBGSwapServices extends PipelineStep<K8sBGSwapServicesData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<K8sBGSwapServicesData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <K8sBGSwapInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <K8sBGSwapServicesVariablesStep
          {...(customStepProps as K8sBGSwapServicesVariablesStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <K8sBGSwapWidgetWithRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        ref={formikRef}
        readonly={readonly}
      />
    )
  }

  protected type = StepType.K8sBGSwapServices
  protected stepName = 'K8s Blue Green Swap Services'

  protected stepIcon: IconName = 'command-swap'
  /* istanbul ignore next */

  validateInputSet(
    data: K8sBGSwapServicesData,
    template: K8sBGSwapServicesData,
    getString?: UseStringsReturn['getString']
  ): FormikErrors<K8sBGSwapServicesData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = {} as any
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      const timeout = Yup.object().shape({
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString?.('validation.timeout10SecMinimum'))
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

  protected defaultValues: K8sBGSwapServicesData = {
    name: '',
    identifier: '',
    timeout: '10m',
    spec: {
      skipDryRun: false
    }
  }
}
