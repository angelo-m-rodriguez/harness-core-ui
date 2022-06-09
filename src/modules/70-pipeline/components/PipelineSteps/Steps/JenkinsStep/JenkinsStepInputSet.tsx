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
import { get, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
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
  const connectorRefFixedValue = getGenuineValue(get(formik, `values.${prefix}spec?.connectorRef`))
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
    error: projectsFetchError,
    loading: fetchingProjects
  } = useGetJobDetailsForJenkins({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  useEffect(() => {
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
  }, [get(formik.values, `${prefix}spec?.connectorRef`)])

  return (
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
      {/* {getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME ? (
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
            selectWithSubmenuTypeInputProps={{
              items: jobDetails,
              interactionKind: PopoverInteractionKind.CLICK,
              onChange: (primaryValue, secondaryValue) => {
                console.log('check', primaryValue, secondaryValue)
                const newJobName = secondaryValue ? secondaryValue : primaryValue
                formik.setValues({
                  ...formik.values,
                  spec: { ...formik.values.spec, jobName: newJobName.value as any }
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
      ) : null} */}
    </FormikForm>
  )
}

export default JenkinsStepInputSet
