/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { FieldArray, FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import {
  Button,
  Formik,
  FormInput,
  HarnessDocTooltip,
  MultiTypeInputType,
  PageSpinner,
  Radio,
  Select,
  Text
} from '@wings-software/uicore'
import { String, useStrings } from 'framework/strings'

import type { AccountPathProps, PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { JiraFieldNG, JiraProjectNG, useGetJiraIssueCreateMetadata } from 'services/cd-ng'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { setIssueTypeOptions } from '../JiraApproval/helper'
import type { JiraProjectSelectOption } from '../JiraApproval/types'
import { JiraFieldSelector } from './JiraFieldSelector'
import {
  JiraCreateFieldType,
  JiraCreateFormFieldSelector,
  JiraDynamicFieldsSelectorContentInterface,
  JiraDynamicFieldsSelectorInterface
} from './types'
import css from './JiraDynamicFieldsSelector.module.scss'

function SelectFieldList(props: JiraDynamicFieldsSelectorContentInterface) {
  const { getString } = useStrings()
  const {
    connectorRef,
    refetchProjectMetadata,
    projectMetaResponse,
    fetchingProjectMetadata,
    showProjectDisclaimer,
    jiraType,
    selectedProjectKey: selectedProjectKeyInit,
    selectedIssueTypeKey: selectedIssueTypeKeyInit
  } = props

  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier
  }
  const [projectValue, setProjectValue] = useState<JiraProjectSelectOption>({
    key: selectedProjectKeyInit,
    value: selectedProjectKeyInit,
    label: selectedProjectKeyInit
  })

  const [issueTypeValue, setIssueTypeValue] = useState<JiraProjectSelectOption>({
    key: selectedIssueTypeKeyInit,
    value: selectedIssueTypeKeyInit,
    label: selectedIssueTypeKeyInit
  })

  const [projectMetadata, setProjectMetadata] = useState<JiraProjectNG>()
  const [fieldList, setFieldList] = useState<JiraFieldNG[]>([])

  const selectedProjectKey = projectValue?.key?.toString()
  const selectedIssueTypeKey = issueTypeValue?.key?.toString()

  useEffect(() => {
    if (connectorRef && selectedProjectKey) {
      refetchProjectMetadata({
        queryParams: {
          ...commonParams,
          connectorRef,
          projectKey: selectedProjectKey
        }
      })
    }
  }, [selectedProjectKey])

  useEffect(() => {
    // If issuetype changes in form, set status and field list
    if (selectedIssueTypeKey) {
      const issueTypeData = projectMetadata?.issuetypes[selectedIssueTypeKey || '']
      const fieldListToSet: JiraFieldNG[] = []
      const fieldKeys = Object.keys(issueTypeData?.fields || {})
      fieldKeys.sort().forEach(keyy => {
        if (issueTypeData?.fields[keyy]) {
          if ((jiraType === 'createMode' && !issueTypeData?.fields[keyy]?.required) || jiraType === 'updateMode') {
            fieldListToSet.push(issueTypeData?.fields[keyy])
          }
        }
      })
      setFieldList(fieldListToSet)
    }
  }, [selectedIssueTypeKey, projectMetadata])

  useEffect(() => {
    if (selectedProjectKey && projectMetaResponse?.data?.projects) {
      const projectMD: JiraProjectNG = projectMetaResponse?.data?.projects[selectedProjectKey]
      setProjectMetadata(projectMD)
    }
  }, [projectMetaResponse?.data, selectedProjectKey])

  return (
    <div>
      <Text className={css.selectFieldListHelp}>{getString('pipeline.jiraCreateStep.selectFieldListHelp')}</Text>
      <div className={css.select}>
        <Text className={css.selectLabel}>{getString('pipeline.jiraApprovalStep.project')}</Text>
        <Select
          items={props.projectOptions}
          defaultSelectedItem={{
            label: selectedProjectKey,
            value: selectedProjectKey
          }}
          onChange={value => {
            setProjectValue(value as JiraProjectSelectOption)
          }}
          inputProps={{
            placeholder: getString('pipeline.jiraCreateStep.selectProject')
          }}
        />
      </div>

      <div className={css.select}>
        <Text className={css.selectLabel}>{getString('pipeline.jiraApprovalStep.issueType')}</Text>
        <Select
          items={
            fetchingProjectMetadata
              ? [{ label: 'Fetching Issue Types...', value: '' }]
              : setIssueTypeOptions(projectMetadata?.issuetypes)
          }
          inputProps={{
            placeholder: fetchingProjectMetadata
              ? getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder')
              : getString('pipeline.jiraApprovalStep.issueTypePlaceholder')
          }}
          defaultSelectedItem={{
            label: selectedIssueTypeKey,
            value: selectedIssueTypeKey
          }}
          onChange={value => {
            setIssueTypeValue(value as JiraProjectSelectOption)
          }}
        />
      </div>

      {fetchingProjectMetadata ? (
        <PageSpinner
          message={getString('pipeline.jiraCreateStep.fetchingFields')}
          className={css.fetchingPageSpinner}
        />
      ) : null}

      {!selectedIssueTypeKey ? (
        <div className={css.fieldsSelectorPlaceholder}>
          <Text>{getString('pipeline.jiraCreateStep.fieldsSelectorPlaceholder')}</Text>
        </div>
      ) : (
        <div>
          {showProjectDisclaimer ? (
            <Text intent="warning">{getString('pipeline.jiraUpdateStep.projectIssueTypeDisclaimer')}</Text>
          ) : null}
          <JiraFieldSelector
            fields={fieldList}
            selectedFields={props?.selectedFields || []}
            onCancel={props.onCancel}
            addSelectedFields={fields => props.addSelectedFields(fields, selectedProjectKey, selectedIssueTypeKey)}
          />
        </div>
      )}
    </div>
  )
}

function ProvideFieldList(props: JiraDynamicFieldsSelectorContentInterface) {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <Formik<JiraCreateFieldType[]>
      onSubmit={values => {
        props.provideFieldList(values)
      }}
      formName="jiraFields"
      initialValues={[]}
    >
      {(formik: FormikProps<{ fieldList: JiraCreateFieldType[] }>) => {
        return (
          <div>
            <FieldArray
              name="fieldList"
              render={({ push, remove }) => {
                return (
                  <div>
                    {formik.values.fieldList?.length ? (
                      <div className={css.headerRow}>
                        <String className={css.label} stringID="keyLabel" />
                        <String className={css.label} stringID="valueLabel" />
                      </div>
                    ) : null}

                    {formik.values.fieldList?.map((_unused: JiraCreateFieldType, i: number) => (
                      <div className={css.headerRow} key={i}>
                        <FormInput.Text
                          name={`fieldList[${i}].name`}
                          placeholder={getString('pipeline.keyPlaceholder')}
                        />
                        <FormInput.MultiTextInput
                          name={`fieldList[${i}].value`}
                          label=""
                          placeholder={getString('common.valuePlaceholder')}
                          multiTextInputProps={{
                            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                            expressions
                          }}
                        />
                        <Button
                          minimal
                          icon="main-trash"
                          data-testid={`remove-fieldList-${i}`}
                          onClick={() => remove(i)}
                        />
                      </div>
                    ))}
                    <Button
                      icon="plus"
                      minimal
                      intent="primary"
                      data-testid="add-fieldList"
                      onClick={() => push({ name: '', value: '' })}
                      className={css.addFieldsButton}
                    >
                      {getString('pipeline.jiraCreateStep.addFields')}
                    </Button>
                  </div>
                )
              }}
            />
            <div className={css.buttons}>
              <Button intent="primary" type="submit" onClick={() => props.provideFieldList(formik.values.fieldList)}>
                {getString('add')}
              </Button>
              <Button className={css.secondButton} onClick={props.onCancel}>
                {getString('cancel')}
              </Button>
            </div>
          </div>
        )
      }}
    </Formik>
  )
}

function Content(props: JiraDynamicFieldsSelectorContentInterface) {
  const { getString } = useStrings()
  const { connectorRef } = props
  const [type, setType] = useState<JiraCreateFormFieldSelector>(
    connectorRef ? JiraCreateFormFieldSelector.FIXED : JiraCreateFormFieldSelector.EXPRESSION
  )
  return (
    <div className={css.contentWrapper}>
      <div className={css.radioGroup}>
        <Radio
          onClick={() => setType(JiraCreateFormFieldSelector.FIXED)}
          checked={type === JiraCreateFormFieldSelector.FIXED}
          disabled={!connectorRef}
        >
          <span data-tooltip-id="jiraSelectFromFieldList">
            {getString('pipeline.jiraCreateStep.selectFromFieldList')}{' '}
            <HarnessDocTooltip useStandAlone={true} tooltipId="jiraSelectFromFieldList" />
          </span>
        </Radio>
        <Radio
          onClick={() => setType(JiraCreateFormFieldSelector.EXPRESSION)}
          checked={type === JiraCreateFormFieldSelector.EXPRESSION}
        >
          <span data-tooltip-id="jiraProvideFromFieldList">
            {getString('pipeline.jiraCreateStep.provideFieldList')}{' '}
            <HarnessDocTooltip useStandAlone={true} tooltipId="jiraProvideFromFieldList" />
          </span>
        </Radio>
      </div>
      {type === JiraCreateFormFieldSelector.FIXED ? <SelectFieldList {...props} /> : <ProvideFieldList {...props} />}
    </div>
  )
}

export function JiraDynamicFieldsSelector(props: JiraDynamicFieldsSelectorInterface) {
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier
  }
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
    <Content
      {...props}
      refetchProjectMetadata={refetchProjectMetadata}
      projectMetaResponse={projectMetaResponse}
      projectMetadataFetchError={projectMetadataFetchError}
      fetchingProjectMetadata={fetchingProjectMetadata}
    />
  )
}
