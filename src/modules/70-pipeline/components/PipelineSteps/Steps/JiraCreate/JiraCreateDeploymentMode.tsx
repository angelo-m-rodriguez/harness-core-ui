/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { JiraProjectBasicNG, JiraProjectNG, useGetJiraIssueCreateMetadata, useGetJiraProjects } from 'services/cd-ng'
import { getGenuineValue, setIssueTypeOptions } from '../JiraApproval/helper'
import type { JiraProjectSelectOption } from '../JiraApproval/types'
import { isApprovalStepFieldDisabled } from '../Common/ApprovalCommons'
import type { JiraCreateDeploymentModeProps, JiraCreateDeploymentModeFormContentInterface } from './types'
import css from './JiraCreate.module.scss'

function FormContent(formContentProps: JiraCreateDeploymentModeFormContentInterface) {
  const {
    inputSetData,
    allowableTypes,
    initialValues,
    projectMetaResponse,
    projectsResponse,
    refetchProjects,
    refetchProjectMetadata,
    fetchingProjectMetadata,
    fetchingProjects,
    projectMetadataFetchError,
    projectsFetchError
  } = formContentProps
  const template = inputSetData?.template
  const path = inputSetData?.path
  const prefix = isEmpty(path) ? '' : `${path}.`
  const readonly = inputSetData?.readonly
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps & GitQueryParams>>()
  const { expressions } = useVariablesExpression()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }
  const [projectOptions, setProjectOptions] = useState<JiraProjectSelectOption[]>([])
  const [projectMetadata, setProjectMetadata] = useState<JiraProjectNG>()

  const [selectedProjectValue, setSelectedProjectValue] = useState<JiraProjectSelectOption>()
  const [selectedIssueTypeValue, setSelectedIssueTypeValue] = useState<JiraProjectSelectOption>()

  const connectorRefFixedValue = getGenuineValue(
    initialValues.spec?.connectorRef || (inputSetData?.allValues?.spec?.connectorRef as string)
  )
  const projectKeyFixedValue = initialValues.spec?.projectKey || inputSetData?.allValues?.spec?.projectKey

  useEffect(() => {
    // If connector value changes in form, fetch projects
    if (connectorRefFixedValue) {
      refetchProjects({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString()
        }
      })
    }
  }, [connectorRefFixedValue])

  useEffect(() => {
    // If project value changes in form, fetch metadata
    if (connectorRefFixedValue && projectKeyFixedValue) {
      refetchProjectMetadata({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString(),
          projectKey: projectKeyFixedValue.toString()
        }
      })
    }
  }, [projectKeyFixedValue])

  useEffect(() => {
    let options: JiraProjectSelectOption[] = []
    const projectResponseList: JiraProjectBasicNG[] = projectsResponse?.data || []
    options =
      projectResponseList.map((project: JiraProjectBasicNG) => ({
        label: project.name || '',
        value: project.key || '',
        key: project.key || ''
      })) || []

    setProjectOptions(options)
    const matched = options?.find(opt => opt.key === projectKeyFixedValue)
    if (matched) {
      setSelectedProjectValue(matched)
    }
  }, [projectsResponse?.data])

  useEffect(() => {
    if (projectKeyFixedValue && projectMetaResponse?.data?.projects) {
      const projectMD: JiraProjectNG = projectMetaResponse?.data?.projects[projectKeyFixedValue as string]
      setProjectMetadata(projectMD)

      const issueTypeOptions = setIssueTypeOptions(projectMD?.issuetypes)
      const matched = issueTypeOptions.find(opt => opt.key === initialValues?.spec?.issueType)
      if (matched) {
        setSelectedIssueTypeValue(matched)
      }
    }
  }, [projectMetaResponse?.data])
  return (
    <React.Fragment>
      {getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME ? (
        <FormMultiTypeDurationField
          name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
          label={getString('pipelineSteps.timeoutLabel')}
          className={css.deploymentViewMedium}
          multiTypeDurationProps={{
            enableConfigureOptions: false,
            allowableTypes,
            expressions,
            disabled: isApprovalStepFieldDisabled(readonly)
          }}
          disabled={isApprovalStepFieldDisabled(readonly)}
        />
      ) : null}

      {getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME ? (
        <FormMultiTypeConnectorField
          name={`${prefix}spec.connectorRef`}
          label={getString('pipeline.jiraApprovalStep.connectorRef')}
          selected={(initialValues?.spec?.connectorRef as string) || ''}
          placeholder={getString('pipeline.jiraApprovalStep.jiraConnectorPlaceholder')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          width={385}
          setRefValue
          disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeProps={{
            allowableTypes,
            expressions
          }}
          type={'Jira'}
          gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
        />
      ) : null}
      {getMultiTypeFromValue(template?.spec?.projectKey) === MultiTypeInputType.RUNTIME ? (
        <FormInput.MultiTypeInput
          selectItems={projectOptions}
          className={css.deploymentViewMedium}
          label={getString('pipeline.jiraApprovalStep.project')}
          name={`${prefix}spec.projectKey`}
          useValue
          placeholder={
            fetchingProjects
              ? getString('pipeline.jiraApprovalStep.fetchingProjectsPlaceholder')
              : projectsFetchError?.message
              ? projectsFetchError?.message
              : getString('pipeline.jiraCreateStep.selectProject')
          }
          multiTypeInputProps={{
            expressions,
            allowableTypes,
            selectProps: {
              defaultSelectedItem: selectedProjectValue,
              items: projectOptions
            }
          }}
          disabled={isApprovalStepFieldDisabled(readonly)}
        />
      ) : null}

      {getMultiTypeFromValue(template?.spec?.issueType) === MultiTypeInputType.RUNTIME ? (
        <FormInput.MultiTypeInput
          selectItems={setIssueTypeOptions(projectMetadata?.issuetypes)}
          className={css.deploymentViewMedium}
          placeholder={
            fetchingProjectMetadata
              ? getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder')
              : projectMetadataFetchError?.message
              ? projectMetadataFetchError?.message
              : getString('pipeline.jiraApprovalStep.issueTypePlaceholder')
          }
          label={getString('pipeline.jiraApprovalStep.issueType')}
          name={`${prefix}spec.issueType`}
          disabled={isApprovalStepFieldDisabled(readonly)}
          useValue
          multiTypeInputProps={{
            expressions,
            allowableTypes,
            selectProps: {
              defaultSelectedItem: selectedIssueTypeValue,
              items: setIssueTypeOptions(projectMetadata?.issuetypes)
            }
          }}
        />
      ) : null}
    </React.Fragment>
  )
}

export default function JiraCreateDeploymentMode(props: JiraCreateDeploymentModeProps): JSX.Element {
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps & GitQueryParams>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const {
    refetch: refetchProjects,
    data: projectsResponse,
    error: projectsFetchError,
    loading: fetchingProjects
  } = useGetJiraProjects({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  const {
    refetch: refetchProjectMetadata,
    data: projectMetaResponse,
    error: projectMetadataFetchError,
    loading: fetchingProjectMetadata
  } = useGetJiraIssueCreateMetadata({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: '',
      projectKey: ''
    }
  })

  return (
    <FormContent
      {...props}
      refetchProjects={refetchProjects}
      projectsResponse={projectsResponse}
      projectsFetchError={projectsFetchError}
      fetchingProjects={fetchingProjects}
      refetchProjectMetadata={refetchProjectMetadata}
      projectMetaResponse={projectMetaResponse}
      projectMetadataFetchError={projectMetadataFetchError}
      fetchingProjectMetadata={fetchingProjectMetadata}
    />
  )
}
