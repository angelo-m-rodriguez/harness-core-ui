import React, { useEffect, useState } from 'react'
import { isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Dialog, Position } from '@blueprintjs/core'
import cx from 'classnames'
import * as Yup from 'yup'
import { FieldArray, FormikProps } from 'formik'
import {
  Formik,
  Accordion,
  FormInput,
  Popover,
  useModalHook,
  Text,
  MultiTypeInputType,
  Button
} from '@wings-software/uicore'
import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { String, useStrings } from 'framework/exports'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  JiraProjectBasicNG,
  JiraProjectNG,
  JiraFieldNG,
  useGetJiraProjects,
  useGetJiraIssueCreateMetadata
} from 'services/cd-ng'
import type { AccountPathProps, PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { FormMultiTypeTextAreaField } from '@common/components'
import type { JiraProjectSelectOption } from '../JiraApproval/types'
import { getGenuineValue, setAllowedValuesOptions, setIssueTypeOptions } from '../JiraApproval/helper'
import { JiraFieldSelector } from './JiraFieldSelector'
import { JiraDynamicFieldsSelector } from './JiraDynamicFieldsSelector'
import {
  JiraCreateData,
  JiraCreateStepModeProps,
  JiraCreateFormContentInterface,
  JiraCreateFormFieldSelector,
  JiraCreateFieldType,
  JiraFieldNGWithValue
} from './types'
import {
  resetForm,
  getInitialValueForSelectedField,
  getKVFields,
  processFormData,
  getKVFieldsToBeAddedInForm,
  getSelectedFieldsToBeAddedInForm
} from './helper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './JiraCreate.module.scss'

const FormContent = ({
  formik,
  refetchProjects,
  refetchProjectMetadata,
  projectsResponse,
  projectMetadataFetchError,
  projectsFetchError,
  projectMetaResponse,
  fetchingProjects,
  fetchingProjectMetadata,
  isNewStep
}: JiraCreateFormContentInterface) => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<PipelinePathProps & AccountPathProps>
  >()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier
  }
  const [issueTypeFieldList, setIssueTypeFieldList] = useState<JiraFieldNG[]>([])
  const [projectOptions, setProjectOptions] = useState<JiraProjectSelectOption[]>([])
  const [projectMetadata, setProjectMetadata] = useState<JiraProjectNG>()
  const [fieldsSelector, setFieldsSelector] = useState<JiraCreateFormFieldSelector>(
    JiraCreateFormFieldSelector.EXPRESSION
  )
  const [fieldsPopoverOpen, setFieldsPopoverOpen] = useState(false)

  const connectorRefFixedValue = getGenuineValue(formik.values.spec.connectorRef)
  const projectKeyFixedValue =
    typeof formik.values.spec.projectKey === 'object'
      ? (formik.values.spec.projectKey as JiraProjectSelectOption).key
      : undefined
  const issueTypeFixedValue =
    typeof formik.values.spec.issueType === 'object'
      ? (formik.values.spec.issueType as JiraProjectSelectOption).key
      : undefined

  useEffect(() => {
    // If connector value changes in form, fetch projects
    if (connectorRefFixedValue) {
      refetchProjects({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString()
        }
      })
    } else {
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected additional fields, and move everything to key value fields
      formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedFields', [])
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
    } else {
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected additional fields, and move everything to key value fields
      formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedFields', [])
    }
  }, [projectKeyFixedValue])

  useEffect(() => {
    // If issuetype changes in form, set status and field list
    if (issueTypeFixedValue) {
      const issueTypeData = projectMetadata?.issuetypes[issueTypeFixedValue]
      const fieldListToSet: JiraFieldNG[] = []
      const fieldKeys = Object.keys(issueTypeData?.fields || {})
      const formikSelectedFields: JiraFieldNGWithValue[] = []
      fieldKeys.forEach(keyy => {
        const field = issueTypeData?.fields[keyy]
        if (field && keyy !== 'Summary' && keyy !== 'Description') {
          fieldListToSet.push(field)

          const savedValueForThisField = getInitialValueForSelectedField(formik.values.spec.fields, field)
          if (savedValueForThisField) {
            formikSelectedFields.push({ ...field, value: savedValueForThisField })
          } else if (field.required) {
            formikSelectedFields.push({ ...field, value: '' })
          }
        }
      })
      setIssueTypeFieldList(fieldListToSet)
      formik.setFieldValue('spec.selectedFields', formikSelectedFields)
    } else {
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected additional fields, and move everything to key value fields
      formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedFields', [])
    }
  }, [issueTypeFixedValue, projectMetadata])

  useEffect(() => {
    let options: JiraProjectSelectOption[] = []
    const projectResponseList: JiraProjectBasicNG[] = projectsResponse?.data || []
    options =
      projectResponseList.map((project: JiraProjectBasicNG) => ({
        label: project.name || '',
        value: project.id || '',
        key: project.key || ''
      })) || []

    setProjectOptions(options)
  }, [projectsResponse?.data])

  useEffect(() => {
    if (projectKeyFixedValue && projectMetaResponse?.data?.projects) {
      const projectMD: JiraProjectNG = projectMetaResponse?.data?.projects[projectKeyFixedValue]
      setProjectMetadata(projectMD)
    }
  }, [projectMetaResponse?.data])

  const [showDynamicFieldsModal, hideDynamicFieldsModal] = useModalHook(() => {
    return (
      <Dialog
        className={css.addFieldsModal}
        isOpen
        onClose={hideDynamicFieldsModal}
        title={getString('pipeline.jiraCreateStep.addFields')}
      >
        <JiraDynamicFieldsSelector
          connectorRef={connectorRefFixedValue || ''}
          selectedProjectKey={projectKeyFixedValue || ''}
          selectedIssueTypeKey={issueTypeFixedValue || ''}
          projectOptions={projectOptions}
          addSelectedFields={(fieldsToBeAdded: JiraFieldNG[]) => {
            formik.setFieldValue(
              'spec.selectedFields',
              getSelectedFieldsToBeAddedInForm(
                fieldsToBeAdded,
                formik.values.spec.selectedFields,
                formik.values.spec.fields
              )
            )
            hideDynamicFieldsModal()
          }}
          provideFieldList={(fields: JiraCreateFieldType[]) => {
            formik.setFieldValue(
              'spec.fields',
              getKVFieldsToBeAddedInForm(fields, formik.values.spec.fields, formik.values.spec.selectedFields)
            )
            hideDynamicFieldsModal()
          }}
          onCancel={hideDynamicFieldsModal}
        />
      </Dialog>
    )
  }, [projectOptions, connectorRefFixedValue, formik.values.spec.selectedFields, formik.values.spec.fields])

  const setFieldOptions = () => {
    if (
      projectMetadata &&
      !isEmpty(issueTypeFieldList) &&
      connectorRefFixedValue &&
      projectKeyFixedValue &&
      issueTypeFixedValue
    ) {
      // This means we have concrete values of connector, project and issue type.
      // Open the field selector
      setFieldsSelector(JiraCreateFormFieldSelector.FIXED)
      setFieldsPopoverOpen(true)
    } else {
      setFieldsSelector(JiraCreateFormFieldSelector.EXPRESSION)
      showDynamicFieldsModal()
    }
  }

  const AddFieldsButton = () => (
    <Text
      onClick={() => setFieldOptions()}
      style={{ cursor: 'pointer', marginBottom: 'var(--spacing-medium)' }}
      intent="primary"
    >
      {getString('pipeline.jiraCreateStep.fieldSelectorAdd')}
    </Text>
  )

  return (
    <React.Fragment>
      <div className={cx(stepCss.formGroup, stepCss.md)}>
        <FormInput.InputWithIdentifier inputLabel={getString('name')} isIdentifierEditable={isNewStep} />
      </div>
      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField name="timeout" label={getString('pipelineSteps.timeoutLabel')} />
      </div>
      <Accordion activeId="step-1" className={stepCss.accordion}>
        <Accordion.Panel
          id="step-1"
          summary={getString('pipeline.jiraApprovalStep.connectToJira')}
          details={
            <div>
              <FormMultiTypeConnectorField
                name="spec.connectorRef"
                label={getString('pipeline.jiraApprovalStep.connectorRef')}
                className={css.connector}
                placeholder={getString('select')}
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                multiTypeProps={{ expressions }}
                type="Jira"
                enableConfigureOptions={false}
                selected={formik?.values?.spec.connectorRef as string}
                onChange={_unused => {
                  // Clear dependent fields
                  resetForm(formik, 'connectorRef')
                }}
              />
              <FormInput.MultiTypeInput
                selectItems={
                  fetchingProjects
                    ? [{ label: getString('pipeline.jiraApprovalStep.fetchingProjectsPlaceholder'), value: '' }]
                    : projectOptions
                }
                label={getString('pipeline.jiraApprovalStep.project')}
                name="spec.projectKey"
                placeholder={
                  fetchingProjects
                    ? getString('pipeline.jiraApprovalStep.fetchingProjectsPlaceholder')
                    : projectsFetchError?.message
                    ? projectsFetchError?.message
                    : getString('select')
                }
                className={css.md}
                disabled={fetchingProjects}
                multiTypeInputProps={{
                  onChange: _unused => {
                    // Clear dependent fields
                    resetForm(formik, 'projectKey')
                  }
                }}
              />
              <FormInput.MultiTypeInput
                selectItems={
                  fetchingProjectMetadata
                    ? [{ label: getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder'), value: '' }]
                    : setIssueTypeOptions(projectMetadata?.issuetypes)
                }
                label={getString('pipeline.jiraApprovalStep.issueType')}
                name="spec.issueType"
                placeholder={
                  fetchingProjectMetadata
                    ? getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder')
                    : projectMetadataFetchError?.message
                    ? projectMetadataFetchError?.message
                    : getString('select')
                }
                className={css.md}
                disabled={fetchingProjectMetadata}
                multiTypeInputProps={{
                  onChange: (_unused: any) => {
                    // Clear dependent fields
                    resetForm(formik, 'issueType')
                  }
                }}
              />
            </div>
          }
        />
        <Accordion.Panel
          id="step-2"
          summary={getString('pipeline.jiraCreateStep.fields')}
          details={
            <div>
              <FormInput.MultiTextInput
                label={getString('summary')}
                name="spec.summary"
                placeholder={getString('pipeline.jiraCreateStep.summaryPlaceholder')}
                className={css.md}
                multiTextInputProps={{
                  expressions
                }}
              />

              <FormMultiTypeTextAreaField
                name="spec.description"
                label={getString('common.description')}
                isOptional={true}
                className={cx(css.descriptionField, css.md)}
                multiTypeTextArea={{ enableConfigureOptions: false, expressions }}
                placeholder={getString('pipeline.enterDescription')}
              />

              {fetchingProjectMetadata ? (
                <div className={css.fetching}>{getString('pipeline.jiraApprovalStep.fetchingFields')}</div>
              ) : null}

              {!fetchingProjectMetadata &&
                formik.values.spec.selectedFields?.map((selectedField: JiraFieldNG, index: number) => {
                  if (
                    selectedField.schema.type === 'string' ||
                    selectedField.schema.type === 'date' ||
                    selectedField.schema.type === 'datetime' ||
                    selectedField.schema.type === 'number'
                  ) {
                    return (
                      <FormInput.MultiTextInput
                        label={selectedField.name}
                        name={`spec.selectedFields[${index}].value`}
                        placeholder={selectedField.name}
                        className={css.md}
                        multiTextInputProps={{
                          expressions
                        }}
                      />
                    )
                  } else if (
                    selectedField.allowedValues &&
                    selectedField.schema.type === 'option' &&
                    selectedField.schema.array
                  ) {
                    return (
                      <FormInput.MultiSelectTypeInput
                        selectItems={setAllowedValuesOptions(selectedField.allowedValues)}
                        label={selectedField.name}
                        name={`spec.selectedFields[${index}].value`}
                        placeholder={selectedField.name}
                        className={cx(css.multiSelect, css.md)}
                        multiSelectTypeInputProps={{
                          expressions
                        }}
                      />
                    )
                  } else if (selectedField.allowedValues && selectedField.schema.type === 'option') {
                    return (
                      <FormInput.MultiTypeInput
                        selectItems={setAllowedValuesOptions(selectedField.allowedValues)}
                        label={selectedField.name}
                        name={`spec.selectedFields[${index}].value`}
                        placeholder={selectedField.name}
                        className={cx(css.multiSelect, css.md)}
                        multiTypeInputProps={{ expressions }}
                      />
                    )
                  }
                })}

              {!fetchingProjectMetadata &&
              !isEmpty(formik.values.spec.fields) &&
              isEmpty(formik.values.spec.selectedFields) ? (
                <FieldArray
                  name="spec.fields"
                  render={({ remove }) => {
                    return (
                      <div>
                        <div className={css.headerRow}>
                          <String className={css.label} stringID="keyLabel" />
                          <String className={css.label} stringID="valueLabel" />
                        </div>
                        {formik.values.spec.fields?.map((_unused: JiraCreateFieldType, i: number) => (
                          <div className={css.headerRow} key={i}>
                            <FormInput.Text name={`spec.fields[${i}].name`} placeholder={getString('keyLabel')} />
                            <FormInput.MultiTextInput
                              name={`spec.fields[${i}].value`}
                              label=""
                              placeholder={getString('valueLabel')}
                              multiTextInputProps={{
                                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                                expressions
                              }}
                            />
                            <Button
                              minimal
                              icon="trash"
                              data-testid={`remove-fieldList-${i}`}
                              onClick={() => remove(i)}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
              ) : null}

              {fieldsSelector === JiraCreateFormFieldSelector.FIXED ? (
                <Popover
                  position={Position.LEFT_TOP}
                  usePortal={true}
                  isOpen={fieldsPopoverOpen}
                  content={
                    <div className={css.jiraFieldSelectorSection}>
                      <Text className={css.fieldsPopoverHeading}>{getString('pipeline.jiraCreateStep.addFields')}</Text>
                      <Text>{getString('pipeline.jiraCreateStep.selectFieldsHeading')}</Text>
                      <JiraFieldSelector
                        fields={issueTypeFieldList}
                        selectedFields={formik.values.spec.selectedFields || []}
                        addSelectedFields={(fieldsToBeAdded: JiraFieldNG[]) => {
                          setFieldsPopoverOpen(false)
                          formik.setFieldValue('spec.selectedFields', fieldsToBeAdded)
                        }}
                        onCancel={() => setFieldsPopoverOpen(false)}
                      />
                    </div>
                  }
                >
                  <AddFieldsButton />
                </Popover>
              ) : (
                <AddFieldsButton />
              )}
            </div>
          }
        />
      </Accordion>
    </React.Fragment>
  )
}

function JiraCreateStepMode(props: JiraCreateStepModeProps, formikRef: StepFormikFowardRef<JiraCreateData>) {
  const { onUpdate, isNewStep } = props
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<PipelinePathProps & AccountPathProps>
  >()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier
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
    <Formik<JiraCreateData>
      onSubmit={values => {
        onUpdate?.(processFormData(values))
      }}
      initialValues={props.initialValues}
      enableReinitialize={true}
      validationSchema={Yup.object().shape({
        name: Yup.string().required(getString('pipelineSteps.stepNameRequired')),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          connectorRef: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.connectorRef')),
          projectKey: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.project')),
          issueType: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.issueType')),
          summary: Yup.string().required(getString('pipeline.jiraCreateStep.validations.summary'))
        })
      })}
    >
      {(formik: FormikProps<JiraCreateData>) => {
        setFormikRef(formikRef, formik)
        return (
          <FormContent
            formik={formik}
            refetchProjects={refetchProjects}
            refetchProjectMetadata={refetchProjectMetadata}
            fetchingProjects={fetchingProjects}
            fetchingProjectMetadata={fetchingProjectMetadata}
            projectMetaResponse={projectMetaResponse}
            projectsResponse={projectsResponse}
            projectsFetchError={projectsFetchError}
            projectMetadataFetchError={projectMetadataFetchError}
            isNewStep={isNewStep}
          />
        )
      }}
    </Formik>
  )
}

const JiraCreateStepModeWithRef = React.forwardRef(JiraCreateStepMode)
export default JiraCreateStepModeWithRef
