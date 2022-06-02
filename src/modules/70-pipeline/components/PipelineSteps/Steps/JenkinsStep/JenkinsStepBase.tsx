/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormikForm,
  FormInput,
  Accordion,
  Container,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@wings-software/uicore'
import { SelectWithSubmenu } from '@harness/uicore'
import type { FormikProps } from 'formik'
import { v4 as uuid } from 'uuid'
import { FieldArray } from 'formik'
import get from 'lodash/get'
import cx from 'classnames'
import type { K8sDirectInfraYaml } from 'services/ci'
import { Connectors } from '@connectors/constants'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'

import StepCommonFields /*,{ /*usePullOptions }*/ from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFields'
import {
  getInitialValuesInCorrectFormat,
  getFormValuesInCorrectFormat
} from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { validate } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { transformValuesFieldsConfig, editViewValidateFieldsConfig } from './JenkinsStepFunctionConfigs'
import type { JenkinsStepProps, JenkinsStepDataUI } from './JenkinsStep'
import type { JenkinsFormContentInterface, JenkinsStepData, jobParameterInterface } from './types'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useParams } from 'react-router'
import { useQueryParams } from '@common/hooks'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { getGenuineValue } from '../JiraApproval/helper'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './JenkinsStep.module.scss'
import { resetForm, scriptInputType } from './helper'
import {
  GetJobDetailsForJenkins,
  ResponseJenkinsJobDetailsDTO,
  useGetJiraProjects,
  useGetJobDetailsForJenkins
} from 'services/cd-ng'
import OptionalConfiguration from './OptionalConfiguration'

function FormContent({
  formik,
  // refetchProjectMetadata,
  // projectsResponse,
  // projectsFetchError,
  // projectMetadataFetchError,
  // projectMetaResponse,
  // fetchingProjects,
  // fetchingProjectMetadata,
  isNewStep,
  readonly,
  allowableTypes,
  stepViewType
}: JenkinsFormContentInterface): JSX.Element {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()
  const { values: formValues, setFieldValue } = formik
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  // const [statusList, setStatusList] = useState<JiraStatusNG[]>([])
  // const [fieldList, setFieldList] = useState<JiraFieldNG[]>([])
  // const [projectOptions, setProjectOptions] = useState<JiraProjectSelectOption[]>([])
  // const [projectMetadata, setProjectMetadata] = useState<JiraProjectNG>()
  const [connectorValueType, setConnectorValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [jobDetails, setJobDetails] = useState<ResponseJenkinsJobDetailsDTO[]>([])
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
    error: projectsFetchError,
    loading: fetchingProjects
  } = useGetJobDetailsForJenkins({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  const connectorRefFixedValue = getGenuineValue(formik.values.spec.connectorRef)
  console.log('check', jobsResponse)
  useEffect(() => {
    refetchJobs({
      queryParams: {
        ...commonParams,
        connectorRef: connectorRefFixedValue?.toString()
      }
    })
  }, [formik.values])

  // const projectKeyFixedValue =
  //   typeof formik.values.spec.projectKey === 'object'
  //     ? (formik.values.spec.projectKey as JiraProjectSelectOption).key
  //     : undefined
  // const issueTypeFixedValue =
  //   typeof formik.values.spec.issueType === 'object'
  //     ? (formik.values.spec.issueType as JiraProjectSelectOption).key
  //     : undefined

  useEffect(() => {
    // If connector value changes in form, fetch projects
    // second block is needed so that we don't fetch projects if type is expression
    // CDC-15633
    if (connectorRefFixedValue && connectorValueType === MultiTypeInputType.FIXED) {
      // refetchProjects({
      //   queryParams: {
      //     ...commonParams,
      //     connectorRef: connectorRefFixedValue.toString()
      //   }
      // })
    }
  }, [connectorRefFixedValue])

  // useEffect(() => {
  //   // If project value changes in form, fetch metadata
  //   if (connectorRefFixedValue && projectKeyFixedValue) {
  //     refetchProjectMetadata({
  //       queryParams: {
  //         ...commonParams,
  //         connectorRef: connectorRefFixedValue.toString(),
  //         projectKey: projectKeyFixedValue.toString(),
  //         fetchStatus: true
  //       }
  //     })
  //   }
  // }, [projectKeyFixedValue])

  // useEffect(() => {
  //   // If issuetype changes in form, set status and field list
  //   if (issueTypeFixedValue && projectMetadata) {
  //     const issueTypeData = projectMetadata?.issuetypes[issueTypeFixedValue]
  //     const statusListFromType = issueTypeData?.statuses || []
  //     setStatusList(statusListFromType)
  //     const fieldListToSet: JiraFieldNG[] = []
  //     const fieldKeys = Object.keys(issueTypeData?.fields || {})
  //     fieldKeys.forEach(keyy => {
  //       if (issueTypeData?.fields[keyy]) {
  //         fieldListToSet.push(issueTypeData?.fields[keyy])
  //       }
  //     })
  //     setFieldList(fieldListToSet)
  //     const approvalCriteria = getApprovalRejectionCriteriaForInitialValues(
  //       formik.values.spec.approvalCriteria,
  //       statusListFromType,
  //       fieldListToSet
  //     )
  //     formik.setFieldValue('spec.approvalCriteria', approvalCriteria)
  //     const rejectionCriteria = getApprovalRejectionCriteriaForInitialValues(
  //       formik.values.spec.rejectionCriteria,
  //       statusListFromType,
  //       fieldListToSet
  //     )
  //     formik.setFieldValue('spec.rejectionCriteria', rejectionCriteria)
  //   }
  // }, [issueTypeFixedValue, projectMetadata])

  // useEffect(() => {
  //   let options: JiraProjectSelectOption[] = []
  //   const projectResponseList: JiraProjectBasicNG[] = projectsResponse?.data || []
  //   options =
  //     projectResponseList.map((project: JiraProjectBasicNG) => ({
  //       label: project.name || '',
  //       value: project.id || '',
  //       key: project.key || ''
  //     })) || []

  //   setProjectOptions(options)
  // }, [projectsResponse?.data])

  // useEffect(() => {
  //   if (projectKeyFixedValue && projectMetaResponse?.data?.projects) {
  //     const projectMD: JiraProjectNG = projectMetaResponse?.data?.projects[projectKeyFixedValue]
  //     setProjectMetadata(projectMD)
  //   }
  // }, [projectMetaResponse?.data])
  console.log('formValues', formValues)
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
          label={getString('pipeline.jenkinsStep.connectorRef')}
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
            // Clear dependent fields
            setConnectorValueType(multiType)
            if (value?.record?.identifier !== connectorRefFixedValue) {
              resetForm(formik, 'connectorRef')
            }
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

      <div className={cx(stepCss.formGroup, stepCss.lg)}>
        {/* <SelectWithSubmenu items={} /> */}

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
                          name={`spec.jobParameter[${i}].name`}
                          placeholder={getString('name')}
                          disabled={readonly}
                        />
                        <FormInput.Select
                          items={scriptInputType}
                          name={`spec.jobParameter[${i}].type`}
                          placeholder={getString('typeLabel')}
                          disabled={readonly}
                        />
                        <FormInput.MultiTextInput
                          name={`spec.jobParameter[${i}].value`}
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
): JSX.Element => {
  const {
    state: {
      selectionState: { selectedStageId }
    }
  } = usePipelineContext()

  const { getString } = useStrings()
  return (
    <Formik
      initialValues={getInitialValuesInCorrectFormat<JenkinsStepData, JenkinsStepDataUI>(
        initialValues,
        transformValuesFieldsConfig
      )}
      formName="JenkinsStep"
      validate={valuesToValidate => {
        const schemaValues = getFormValuesInCorrectFormat<JenkinsStepDataUI, JenkinsStepData>(
          valuesToValidate,
          transformValuesFieldsConfig
        )
        onChange?.(schemaValues)
        // return validate(
        //   valuesToValidate,
        //   editViewValidateFieldsConfig,
        //   {
        //     initialValues,
        //     steps: currentStage?.stage?.spec?.execution?.steps || {},
        //     serviceDependencies: currentStage?.stage?.spec?.serviceDependencies || {},
        //     getString
        //   },
        //   stepViewType
        // )
      }}
      onSubmit={(_values: JenkinsStepDataUI) => {
        const schemaValues = getFormValuesInCorrectFormat<JenkinsStepDataUI, JenkinsStepData>(
          _values,
          transformValuesFieldsConfig
        )
        onUpdate?.(schemaValues)
      }}
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
              // refetchProjects={refetchProjects}
              // refetchProjectMetadata={refetchProjectMetadata}
              // fetchingProjects={fetchingProjects}
              // fetchingProjectMetadata={fetchingProjectMetadata}
              // projectMetaResponse={projectMetaResponse}
              // projectsResponse={projectsResponse}
              // projectsFetchError={projectsFetchError}
              // projectMetadataFetchError={projectMetadataFetchError}
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
