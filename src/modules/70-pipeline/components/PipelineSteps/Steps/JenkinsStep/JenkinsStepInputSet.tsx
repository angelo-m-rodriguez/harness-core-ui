/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { getMultiTypeFromValue, MultiTypeInputType, FormikForm, FormInput, SelectOption } from '@wings-software/uicore'
import { cloneDeep, get, isArray, isEmpty, set } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { FieldArray } from 'formik'
import { PopoverInteractionKind } from '@blueprintjs/core'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { JobDetails, useGetJobDetailsForJenkins } from 'services/cd-ng'
import type { SubmenuSelectOption } from './types'
import { getGenuineValue } from '../JiraApproval/helper'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import stepCss from './JenkinsStep.module.scss'
import { MultiTypeFieldSelector } from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'

export const jobParameterInputType: SelectOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' }
]

const JenkinsStepInputSet = (formContentProps: any): JSX.Element => {
  const { initialValues, allowableTypes, template, path, readonly, formik } = formContentProps
  const prefix = isEmpty(path) ? '' : `${path}.`
  const { getString } = useStrings()
  const lastOpenedJob = useRef<any>(null)
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const [jobDetails, setJobDetails] = useState<SubmenuSelectOption[]>([])
  const connectorRefFixedValue = getGenuineValue(get(formik, `values.${prefix}spec.connectorRef`))
  console.log(
    'formik input',
    jobDetails.find(job => job.value === get(formik, `values.${prefix}spec.jobName`))
  )
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

  useEffect(() => {
    if (typeof get(formik, `values.${prefix}spec.jobName`) === 'string' && jobsResponse?.data?.jobDetails?.length) {
      const job = jobsResponse?.data?.jobDetails?.find(job => job.url === formik.values?.spec?.jobName)
      if (job) {
        const jobObj = {
          label: job?.jobName || '',
          value: job?.url || '',
          submenuItems: [],
          hasSubItems: job?.folder
        }
        set(formik, `values.${prefix}spec.jobName`, jobObj as any)
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

  useEffect(() => {
    refetchJobs({
      queryParams: {
        ...commonParams,
        connectorRef: connectorRefFixedValue?.toString()
      }
    })
  }, [connectorRefFixedValue])

  return (
    <>
      <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
        {getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME && (
          <div className={cx(css.formGroup, css.sm)}>
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
        {getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME ? (
          <FormMultiTypeConnectorField
            name={`${prefix}spec.connectorRef`}
            label={getString('pipeline.jiraApprovalStep.connectorRef')}
            selected={(initialValues?.spec?.connectorRef as string) || ''}
            placeholder={getString('connectors.selectConnector')}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            width={385}
            setRefValue
            // disabled={isApprovalStepFieldDisabled(readonly)}
            multiTypeProps={{
              allowableTypes,
              expressions
            }}
            type={'Jenkins'}
            gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
          />
        ) : null}

        {getMultiTypeFromValue(template?.spec?.jobName) === MultiTypeInputType.RUNTIME ? (
          <div className={cx(css.formGroup, css.lg)}>
            <FormInput.SelectWithSubmenuTypeInput
              label={'Job Name'}
              name={`${prefix}spec.jobName`}
              disabled={jobDetailsFetchError !== null || fetchingJobDetails}
              value={jobDetails.find(job => job.value === get(formik, `values.${prefix}spec.jobName`))}
              selectWithSubmenuTypeInputProps={{
                items: jobDetails,
                interactionKind: PopoverInteractionKind.CLICK,
                onChange: (primaryValue, secondaryValue, type) => {
                  const newJobName = secondaryValue ? secondaryValue : primaryValue
                  const clonedFormik = cloneDeep(formik.values)
                  set(clonedFormik, `${prefix}spec.jobName`, newJobName.value as any)
                  formik.setValues({
                    ...clonedFormik
                  })
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
          </div>
        ) : null}

        {isArray(template?.spec?.jobParameter) && template?.spec?.jobParameter ? (
          <div className={css.formGroup}>
            <MultiTypeFieldSelector
              name="spec.jobParameter"
              label={getString('pipeline.scriptInputVariables')}
              defaultValueToReset={[]}
              disableTypeSelection
            >
              <FieldArray
                name="spec.jobParameter"
                render={() => {
                  return (
                    <div className={stepCss.panel}>
                      <div className={stepCss.jobParameter}>
                        <span className={css.label}>Name</span>
                        <span className={css.label}>Type</span>
                        <span className={css.label}>Value</span>
                      </div>
                      {template.spec.jobParameter?.map((type: any, i: number) => {
                        return (
                          <div className={stepCss.jobParameter} key={type.value}>
                            <FormInput.Text
                              name={`${prefix}spec.jobParameter[${i}].name`}
                              placeholder={getString('name')}
                              disabled={true}
                            />
                            <FormInput.Select
                              items={jobParameterInputType}
                              name={`${prefix}spec.jobParameter[${i}].type`}
                              placeholder={getString('typeLabel')}
                              disabled={true}
                            />
                            <FormInput.MultiTextInput
                              name={`${prefix}spec.jobParameter[${i}].value`}
                              multiTextInputProps={{
                                allowableTypes,
                                expressions,
                                disabled: readonly
                              }}
                              label=""
                              disabled={readonly}
                              placeholder={getString('valueLabel')}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                }}
              />
            </MultiTypeFieldSelector>
          </div>
        ) : null}
      </FormikForm>
    </>
  )
}

export default JenkinsStepInputSet
