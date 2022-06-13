/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useRef } from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormikForm,
  FormInput,
  Accordion,
  getMultiTypeFromValue,
  MultiTypeInputType,
  SelectOption
} from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { v4 as uuid } from 'uuid'
import { FieldArray } from 'formik'
import cx from 'classnames'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'

import type { JenkinsStepDataUI, JenkinsStepProps } from './JenkinsStep'
import { JobDetails, useGetJobDetailsForJenkins, useGetJobParametersForJenkins } from 'services/cd-ng'
import { PopoverInteractionKind } from '@blueprintjs/core'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useParams } from 'react-router'
import { useQueryParams } from '@common/hooks'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { getGenuineValue } from '../JiraApproval/helper'
import type { JenkinsFormContentInterface, JenkinsStepData, jobParameterInterface, SubmenuSelectOption } from './types'
import { resetForm, scriptInputType } from './helper'
import OptionalConfiguration from './OptionalConfiguration'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './JenkinsStep.module.scss'
import { getFormValuesInCorrectFormat, getInitialValuesInCorrectFormat } from '../StepsTransformValuesUtils'
import { transformValuesFieldsConfig } from './JenkinsStepFunctionConfigs'

function FormContent({
  formik,
  isNewStep,
  readonly,
  allowableTypes,
  stepViewType
}: JenkinsFormContentInterface): React.ReactElement {
  const { getString } = useStrings()
  const lastOpenedJob = useRef<any>(null)
  const { expressions } = useVariablesExpression()
  const { values: formValues } = formik
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [connectorValueType, setConnectorValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [jobDetails, setJobDetails] = useState<SubmenuSelectOption[]>([])
  const [jobParamerter, setJobParameters] = useState<jobParameterInterface[]>([])
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const {
    refetch: refetchJobs,
    data: jobsResponse,
    error: jobDetailsFetchError,
    loading: fetchingJobDetails
  } = useGetJobDetailsForJenkins({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  const {
    refetch: refetchJobParameters,
    data: jobParameterResponse
    // error: jobDetailsFetchError,
    // loading: fetchingJobDetails
  } = useGetJobParametersForJenkins({
    lazy: true,
    jobName: ''
  })

  useEffect(() => {
    if (jobParameterResponse?.data) {
      const parameterData: jobParameterInterface[] =
        jobParameterResponse?.data?.map(item => {
          return {
            name: item.name,
            value: item.defaultValue,
            type: 'String',
            id: uuid()
          } as any
        }) || ([] as jobParameterInterface[])
      formik.setValues({
        ...formik.values,
        spec: {
          ...formik.values.spec,
          jobParameter: parameterData
        }
      })
    }
  }, [jobParameterResponse])

  useEffect(() => {
    if (typeof formik.values.spec.jobName === 'string' && jobsResponse?.data?.jobDetails?.length) {
      const job = jobsResponse?.data?.jobDetails?.find(job => job.url === formik.values?.spec?.jobName)
      if (job) {
        const jobObj = {
          label: job?.jobName || '',
          value: job?.url || '',
          submenuItems: [],
          hasSubItems: job?.folder
        }
        formik.setValues({
          ...formik.values,
          spec: {
            ...formik.values.spec,
            jobName: jobObj as any
          }
        })
      }
    }
    if (lastOpenedJob.current) {
      setJobDetails((prevState: SubmenuSelectOption[]) => {
        const parentJob = prevState.find(obj => obj.value === lastOpenedJob.current)
        if (parentJob) {
          parentJob.submenuItems = [...getJobItems(jobsResponse?.data?.jobDetails || [])]
        }
        return prevState
      })
    } else {
      const jobs = jobsResponse?.data?.jobDetails?.map(job => {
        return {
          label: job.jobName || '',
          value: job.url || '',
          submenuItems: [],
          hasSubItems: job.folder
        }
      })
      setJobDetails(jobs || ([] as any))
    }
  }, [jobsResponse])

  const connectorRefFixedValue = getGenuineValue(formik.values.spec.connectorRef)

  useEffect(() => {
    refetchJobs({
      queryParams: {
        ...commonParams,
        connectorRef: connectorRefFixedValue?.toString()
      }
    })
    if (getMultiTypeFromValue(formik.values.spec.connectorRef) === MultiTypeInputType.RUNTIME) {
      formik.setValues({
        ...formik.values,
        spec: {
          ...formik.values.spec,
          jobName: formik.values.spec.connectorRef
        }
      })
    }
  }, [formik.values.spec.connectorRef])

  const getJobItems = (jobs: JobDetails[]): SubmenuSelectOption[] => {
    return jobs?.map(job => {
      return {
        label: job.jobName || '',
        value: job.url || '',
        submenuItems: [],
        hasSubItems: job.folder
      }
    })
  }

  console.log('formik', formik.values)

  return (
    <React.Fragment>
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
          label={getString('pipelineSteps.timeoutLabel')}
          disabled={readonly}
          multiTypeDurationProps={{
            expressions,
            enableConfigureOptions: false,
            allowableTypes
          }}
        />
        {getMultiTypeFromValue(formik.values.timeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formik.values.timeout || ''}
            type="String"
            variableName="timeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('timeout', value)}
            isReadonly={readonly}
          />
        )}
      </div>

      <div className={cx(stepCss.formGroup, stepCss.lg)}>
        <FormMultiTypeConnectorField
          name="spec.connectorRef"
          label={getString('connectors.jenkins.jenkinsConnectorLabel')}
          width={390}
          className={css.connector}
          connectorLabelClass={css.connectorLabel}
          placeholder={getString('select')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          multiTypeProps={{ expressions, allowableTypes }}
          type="Jenkins"
          enableConfigureOptions={false}
          selected={formik?.values?.spec.connectorRef as string}
          onChange={(value: any, _unused, multiType) => {
            console.log('check it', multiType, value)
            setConnectorValueType(multiType)
            if (value?.record?.identifier !== connectorRefFixedValue) {
              resetForm(formik, 'connectorRef')
            }
            lastOpenedJob.current = null
          }}
          disabled={readonly}
          gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
        />
        {getMultiTypeFromValue(formik.values.spec.connectorRef) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 14 }}
            value={formik.values.spec.connectorRef as string}
            type="String"
            variableName="spec.connectorRef"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('spec.connectorRef', value)}
            isReadonly={readonly}
          />
        )}
      </div>

      <div className={cx(stepCss.formGroup, stepCss.lg, css.jobDetails)}>
        <FormInput.SelectWithSubmenuTypeInput
          label={'Job Name'}
          name={'spec.jobName'}
          disabled={jobDetailsFetchError !== null || fetchingJobDetails}
          placeholder={formik.values.spec.jobName || 'Select a job'}
          selectWithSubmenuTypeInputProps={{
            value:
              formik.values.spec.connectorRef === MultiTypeInputType.RUNTIME
                ? (MultiTypeInputType.RUNTIME as any)
                : jobDetails.find(job => job.value === formik.values.spec.jobName),
            items: jobDetails,
            interactionKind: PopoverInteractionKind.CLICK,
            onChange: (primaryValue, secondaryValue, type) => {
              const newJobName = secondaryValue ? secondaryValue : primaryValue
              formik.setValues({
                ...formik.values,
                spec: {
                  ...formik.values.spec,
                  jobName: type === MultiTypeInputType.RUNTIME ? primaryValue : (newJobName as any)
                }
              })
              if (type !== MultiTypeInputType.RUNTIME) {
                refetchJobParameters({
                  pathParams: { jobName: newJobName.label },
                  queryParams: {
                    ...commonParams,
                    connectorRef: connectorRefFixedValue?.toString()
                  }
                })
              }
            },
            onOpening: (item: SelectOption) => {
              lastOpenedJob.current = item.value
              refetchJobs({
                queryParams: {
                  ...commonParams,
                  connectorRef: connectorRefFixedValue?.toString(),
                  parentJobName: item.label
                }
              })
            }
          }}
        />

        {getMultiTypeFromValue(formik.values.spec.connectorRef) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 14 }}
            value={formik.values.spec.connectorRef as string}
            type="String"
            variableName="spec.jobName"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('spec.jobName', value)}
            isReadonly={readonly}
          />
        )}
      </div>

      <div className={stepCss.formGroup}>
        <MultiTypeFieldSelector
          name="spec.jobParameter"
          label={getString('pipeline.jenkinsStep.jobParameter')}
          isOptional
          optionalLabel={getString('common.optionalLabel')}
          defaultValueToReset={[]}
          disableTypeSelection
        >
          <FieldArray
            name="spec.jobParameter"
            render={({ push, remove }) => {
              return (
                <div className={css.panel}>
                  <div className={css.environmentVarHeader}>
                    <span className={css.label}>Name</span>
                    <span className={css.label}>Type</span>
                    <span className={css.label}>Value</span>
                  </div>
                  {formValues.spec.jobParameter?.map(({ id }: jobParameterInterface, i: number) => {
                    return (
                      <div className={css.environmentVarHeader} key={id}>
                        <FormInput.Text
                          name={`spec.jobParameter.[${i}].name`}
                          placeholder={getString('name')}
                          disabled={readonly}
                        />
                        <FormInput.Select
                          items={scriptInputType}
                          name={`spec.jobParameter.[${i}].type`}
                          placeholder={getString('typeLabel')}
                          disabled={readonly}
                        />
                        <FormInput.MultiTextInput
                          name={`spec.jobParameter.[${i}].value`}
                          placeholder={getString('valueLabel')}
                          multiTextInputProps={{
                            allowableTypes,
                            expressions,
                            disabled: readonly
                          }}
                          label=""
                          disabled={readonly}
                        />
                        <Button
                          variation={ButtonVariation.ICON}
                          icon="main-trash"
                          data-testid={`remove-environmentVar-${i}`}
                          onClick={() => remove(i)}
                          disabled={readonly}
                        />
                      </div>
                    )
                  })}
                  <Button
                    icon="plus"
                    variation={ButtonVariation.LINK}
                    data-testid="add-environmentVar"
                    disabled={readonly}
                    onClick={() => push({ name: '', type: 'String', value: '', id: uuid() })}
                    className={css.addButton}
                  >
                    {getString('addInputVar')}
                  </Button>
                </div>
              )
            }}
          />
        </MultiTypeFieldSelector>
      </div>

      <div className={stepCss.noLookDivider} />

      <Accordion className={stepCss.accordion}>
        <Accordion.Panel
          id="optional-config"
          summary={getString('common.optionalConfig')}
          details={<OptionalConfiguration readonly={readonly} allowableTypes={allowableTypes} />}
        />
      </Accordion>
    </React.Fragment>
  )
}

export const JenkinsStepBase = (
  { initialValues, onUpdate, isNewStep = true, readonly, allowableTypes, stepViewType, onChange }: JenkinsStepProps,
  formikRef: StepFormikFowardRef<JenkinsStepData>
): React.ReactElement => {
  return (
    <Formik
      initialValues={initialValues}
      formName="JenkinsStep"
      validate={valuesToValidate => {
        onChange?.(valuesToValidate)
      }}
      onSubmit={(_values: JenkinsStepData) => {
        onUpdate?.(_values)
      }}
      // initialValues={getInitialValuesInCorrectFormat<JenkinsStepData, JenkinsStepDataUI>(
      //   initialValues,
      //   transformValuesFieldsConfig
      // )}
      // formName="JenkinsStep"
      // validate={valuesToValidate => {
      //   const schemaValues = getFormValuesInCorrectFormat<JenkinsStepDataUI, JenkinsStepData>(
      //     valuesToValidate,
      //     transformValuesFieldsConfig
      //   )
      //   onChange?.(schemaValues)
      //   // return validate(
      //   //   valuesToValidate,
      //   //   editViewValidateFieldsConfig,
      //   //   {
      //   //     initialValues,
      //   //     steps: currentStage?.stage?.spec?.execution?.steps || {},
      //   //     serviceDependencies: currentStage?.stage?.spec?.serviceDependencies || {},
      //   //     getString
      //   //   },
      //   //   stepViewType
      //   // )
      // }}
      // onSubmit={(_values: JenkinsStepDataUI) => {
      //   const schemaValues = getFormValuesInCorrectFormat<JenkinsStepDataUI, JenkinsStepData>(
      //     _values,
      //     transformValuesFieldsConfig
      //   )
      //   onUpdate?.(schemaValues)
      // }}
    >
      {(formik: FormikProps<JenkinsStepData>) => {
        // This is required
        setFormikRef?.(formikRef, formik)

        return (
          <FormikForm>
            <FormContent
              formik={formik}
              allowableTypes={allowableTypes}
              stepViewType={stepViewType}
              readonly={readonly}
              isNewStep={isNewStep}
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export const JenkinsStepBaseWithRef = React.forwardRef(JenkinsStepBase)
