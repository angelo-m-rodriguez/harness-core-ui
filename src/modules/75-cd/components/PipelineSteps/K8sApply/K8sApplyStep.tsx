/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  IconName,
  Label,
  Layout,
  MultiTypeInputType,
  Text
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { FieldArray, FormikErrors, FormikProps, yupToFormErrors } from 'formik'
import * as Yup from 'yup'
import { v4 as uuid } from 'uuid'
import { defaultTo, isEmpty } from 'lodash-es'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'

import {
  StepFormikFowardRef,
  setFormikRef,
  StepProps,
  StepViewType,
  ValidateInputSetProps
} from '@pipeline/components/AbstractSteps/Step'
import type { ManifestConfigWrapper } from 'services/cd-ng'

import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'

import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import List from '@common/components/List/List'
import type { StringsMap } from 'stringTypes'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { getSelectedDeploymentType } from '@pipeline/utils/stageHelpers'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { K8sOverrideValuesRuntimeFields } from './K8sOverrideValuesRuntimeFields'
import K8sOverrideValuesManifest from './K8sOverrideValuesManifest'
import type {
  FilePathConfig,
  K8sApplyData,
  K8sApplyFormData,
  K8sApplyProps,
  K8sApplyVariableStepProps
} from './K8sInterface'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const formatData = (data: K8sApplyFormData): K8sApplyData => {
  return {
    ...data,
    spec: {
      ...data?.spec,
      skipDryRun: data?.spec?.skipDryRun,
      skipSteadyStateCheck: data?.spec?.skipSteadyStateCheck,
      filePaths:
        getMultiTypeFromValue(data?.spec?.filePaths as string) === MultiTypeInputType.RUNTIME
          ? data?.spec?.filePaths
          : ((data?.spec?.filePaths || []) as FilePathConfig[])?.map((item: FilePathConfig) => item.value),
      overrides: data?.spec?.overrides
    }
  }
}

function K8sApplyDeployWidget(props: K8sApplyProps, formikRef: StepFormikFowardRef<K8sApplyData>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, isDisabled, allowableTypes, onChange, stepViewType } = props
  const { getString } = useStrings()
  const defaultValueToReset = [{ value: '', id: uuid() }]
  const {
    state: {
      selectionState: { selectedStageId }
    },
    getStageFromPipeline
  } = usePipelineContext()

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const selectedDeploymentType = getSelectedDeploymentType(stage, getStageFromPipeline)

  const { expressions } = useVariablesExpression()

  return (
    <>
      <Formik<K8sApplyFormData>
        enableReinitialize={true}
        onSubmit={(values: K8sApplyFormData) => {
          const formData = {
            ...values,
            spec: {
              ...values.spec,
              skipDryRun: defaultTo(values?.spec?.skipDryRun, false),
              skipSteadyStateCheck: defaultTo(values?.spec?.skipSteadyStateCheck, false),
              filePaths: values?.spec?.filePaths,
              overrides: values?.spec?.overrides
            }
          }
          onUpdate?.(formData)
        }}
        validate={(values: K8sApplyFormData) => {
          const formData = {
            ...values,
            spec: {
              ...values.spec,
              skipDryRun: defaultTo(values?.spec?.skipDryRun, false),
              skipSteadyStateCheck: defaultTo(values?.spec?.skipSteadyStateCheck, false),
              filePaths: values?.spec?.filePaths,
              overrides: values?.spec?.overrides
            }
          }
          onChange?.(formData)
        }}
        formName="k8Apply"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          spec: Yup.object().shape({
            filePaths: Yup.lazy(value =>
              getMultiTypeFromValue(value as boolean) === MultiTypeInputType.FIXED
                ? Yup.array(
                    Yup.object().shape({
                      value: Yup.string().required(getString('cd.pathCannotBeEmpty'))
                    })
                  ).required(getString('cd.filePathRequired'))
                : Yup.string()
            )
          })
        })}
      >
        {(formik: FormikProps<K8sApplyFormData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)
          return (
            <>
              {stepViewType === StepViewType.Template ? null : (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('name')}
                    isIdentifierEditable={isNewStep}
                    inputGroupProps={{
                      placeholder: getString('pipeline.stepNamePlaceholder'),
                      disabled: isDisabled
                    }}
                  />
                </div>
              )}
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormMultiTypeDurationField
                  name="timeout"
                  disabled={isDisabled}
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{ enableConfigureOptions: false, disabled: isDisabled, allowableTypes }}
                />
                {getMultiTypeFromValue(values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values.timeout as string}
                    type="String"
                    variableName="timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('timeout', value)
                    }}
                    isReadonly={isDisabled}
                  />
                )}
              </div>
              <div className={stepCss.divider} />
              <div className={stepCss.formGroup}>
                <MultiTypeFieldSelector
                  defaultValueToReset={defaultValueToReset}
                  name={'spec.filePaths'}
                  label={getString('common.git.filePath')}
                  allowedTypes={allowableTypes}
                >
                  <FieldArray
                    name="spec.filePaths"
                    render={arrayHelpers => (
                      <Layout.Vertical>
                        {(values?.spec?.filePaths as FilePathConfig[])?.map((path: FilePathConfig, index: number) => (
                          <Layout.Horizontal key={path.id}>
                            <FormInput.MultiTextInput
                              label=""
                              placeholder={getString('cd.filePathPlaceholder')}
                              name={`spec.filePaths[${index}].value`}
                              multiTextInputProps={{
                                allowableTypes: allowableTypes.filter(item => item !== MultiTypeInputType.RUNTIME),
                                expressions,
                                textProps: { disabled: isDisabled }
                              }}
                              disabled={isDisabled}
                              style={{ width: '430px' }}
                            />

                            <Button
                              variation={ButtonVariation.ICON}
                              icon="main-trash"
                              onClick={() => arrayHelpers.remove(index)}
                              disabled={isDisabled}
                            />
                          </Layout.Horizontal>
                        ))}
                        <span>
                          <Button
                            variation={ButtonVariation.PRIMARY}
                            text={getString('addFileText')}
                            onClick={() => {
                              arrayHelpers.push({ value: '', id: uuid() })
                            }}
                            disabled={isDisabled}
                          />
                        </span>
                      </Layout.Vertical>
                    )}
                  />
                </MultiTypeFieldSelector>
              </div>

              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormMultiTypeCheckboxField
                  name="spec.skipDryRun"
                  label={getString('pipelineSteps.skipDryRun')}
                  disabled={isDisabled}
                  multiTypeTextbox={{ expressions, allowableTypes }}
                />
                {getMultiTypeFromValue(values.spec?.skipDryRun) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={(values.spec.skipDryRun || '') as string}
                    type="String"
                    variableName="spec.skipDryRun"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('spec.skipDryRun', value)
                    }}
                    isReadonly={isDisabled}
                  />
                )}
              </div>
              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormMultiTypeCheckboxField
                  name="spec.skipSteadyStateCheck"
                  disabled={isDisabled}
                  label={getString('pipelineSteps.skipSteadyStateCheck')}
                  multiTypeTextbox={{ expressions, allowableTypes }}
                />
                {getMultiTypeFromValue(values.spec?.skipSteadyStateCheck) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={(values.spec.skipSteadyStateCheck || '') as string}
                    type="String"
                    variableName="spec.skipSteadyStateCheck"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('spec.skipSteadyStateCheck', value)
                    }}
                    isReadonly={isDisabled}
                  />
                )}
              </div>
              <div className={stepCss.divider} />
              <div>
                <K8sOverrideValuesManifest deploymentType={selectedDeploymentType} formik={formik} />
              </div>
            </>
          )
        }}
      </Formik>
    </>
  )
}

const K8sApplyInputStep: React.FC<K8sApplyProps> = ({ inputSetData, readonly, allowableTypes, ...props }) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
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
            className={stepCss.checkbox}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
            disabled={readonly}
          />
        </div>
      )}

      {getMultiTypeFromValue(inputSetData?.template?.spec?.filePaths) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <List
            label={getString('filePaths')}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.filePaths`}
            disabled={readonly}
            expressions={expressions}
            style={{ marginBottom: 'var(--spacing-small)' }}
            isNameOfArrayType
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.skipDryRun) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes,
              disabled: readonly
            }}
            disabled={readonly}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.skipDryRun`}
            className={stepCss.checkbox}
            label={getString('pipelineSteps.skipDryRun')}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
      {getMultiTypeFromValue(inputSetData?.template?.spec?.skipSteadyStateCheck) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeCheckboxField
            multiTypeTextbox={{
              expressions,
              allowableTypes,
              disabled: readonly
            }}
            disabled={readonly}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}spec.skipSteadyStateCheck`}
            className={stepCss.checkbox}
            label={getString('pipelineSteps.skipSteadyStateCheck')}
            setToFalseWhenEmpty={true}
          />
        </div>
      )}
      {inputSetData?.template?.spec?.overrides?.length && (
        <Label style={{ color: Color.GREY_900, paddingBottom: 'var(--spacing-small)' }}>
          <Text> {getString('cd.overrideYaml')}</Text>
        </Label>
      )}
      {inputSetData?.template?.spec?.overrides?.map((overrideValue: ManifestConfigWrapper, index: number) => {
        return (
          <K8sOverrideValuesRuntimeFields
            allowableTypes={allowableTypes}
            overrideValue={overrideValue}
            index={index}
            {...props}
            key={overrideValue?.manifest?.identifier}
          />
        )
      })}
    </>
  )
}

const K8sApplyVariableStep: React.FC<K8sApplyVariableStepProps> = ({ variablesData, metadataMap, initialValues }) => {
  return (
    <VariablesListTable
      className={pipelineVariableCss.variablePaddingL3}
      data={variablesData.spec}
      originalData={initialValues.spec}
      metadataMap={metadataMap}
    />
  )
}

const K8sApplyDeployWidgetWithRef = React.forwardRef(K8sApplyDeployWidget)
export class K8sApplyStep extends PipelineStep<K8sApplyData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  renderStep(props: StepProps<K8sApplyData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes,
      onChange
    } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <K8sApplyInputStep
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
        <K8sApplyVariableStep
          {...(customStepProps as K8sApplyVariableStepProps)}
          initialValues={initialValues}
          onUpdate={data => onUpdate?.(formatData(data))}
        />
      )
    }
    return (
      <K8sApplyDeployWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        readonly={!!inputSetData?.readonly}
        isDisabled={readonly}
        ref={formikRef}
        allowableTypes={allowableTypes}
        onChange={data => onChange?.(this.processFormData(data))}
      />
    )
  }
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<K8sApplyData>): FormikErrors<K8sApplyData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = {} as any
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
    if (getMultiTypeFromValue(template?.spec?.filePaths) === MultiTypeInputType.RUNTIME) {
      let filePathSchema = Yup.object().shape({
        spec: Yup.object().shape({
          filePaths: Yup.array(Yup.string().trim()).ensure().nullable()
        })
      })
      if (isRequired) {
        filePathSchema = Yup.object().shape({
          spec: Yup.object().shape({
            filePaths: Yup.array(Yup.string().trim().required(getString?.('cd.pathCannotBeEmpty')))
              .required(getString?.('cd.filePathRequired'))
              .min(1, getString?.('cd.filePathRequired'))
              .ensure()
          })
        })
      }
      try {
        filePathSchema.validateSync(data)
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

  private getInitialValues(initialValues: any): K8sApplyFormData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        filePaths:
          getMultiTypeFromValue(initialValues?.spec?.filePaths) === MultiTypeInputType.RUNTIME
            ? initialValues?.spec?.filePaths
            : initialValues?.spec?.filePaths?.length
            ? (initialValues?.spec?.filePaths || [])?.map((item: string) => ({
                value: item,
                id: uuid()
              }))
            : [{ value: '', id: uuid() }],
        overrides: initialValues?.spec?.overrides
      }
    }
  }

  processFormData(data: any): K8sApplyData {
    return {
      ...data,
      spec: {
        ...data.spec,
        skipDryRun: data?.spec?.skipDryRun,
        skipSteadyStateCheck: data?.spec?.skipSteadyStateCheck,
        filePaths:
          getMultiTypeFromValue(data?.spec?.filePaths) === MultiTypeInputType.RUNTIME
            ? data?.spec?.filePaths
            : (data?.spec?.filePaths || [])?.map((item: FilePathConfig) => item.value),
        overrides: data?.spec?.overrides
      }
    }
  }

  protected type = StepType.K8sApply
  protected stepName = 'K8s Apply'
  protected stepIcon: IconName = 'code'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.K8sApply'

  protected defaultValues: K8sApplyData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.K8sApply,
    spec: {
      filePaths: [],
      skipDryRun: false,
      skipSteadyStateCheck: false,
      overrides: []
    }
  }
}
