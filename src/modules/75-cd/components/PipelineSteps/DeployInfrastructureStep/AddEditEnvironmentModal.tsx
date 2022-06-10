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
  FormikForm,
  Label,
  Layout,
  ThumbnailSelect,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  getErrorInfoFromErrorObject,
  Container
} from '@harness/uicore'
import * as Yup from 'yup'
import { defaultTo, omit, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Classes } from '@blueprintjs/core'
import { parse } from 'yaml'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import {
  EnvironmentRequestDTO,
  EnvironmentResponseDTO,
  useUpsertEnvironmentV2,
  useCreateEnvironmentV2,
  useGetYamlSchema
} from 'services/cd-ng'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { NameIdDescriptionTags, PageSpinner } from '@common/components'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/exports'

import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, EnvironmentActions, ExitModalActions } from '@common/constants/TrackingConstants'
import css from './DeployInfrastructureStep.module.scss'

export interface AddEditEnvironmentModalProps {
  isEdit: boolean
  isEnvironment: boolean
  data: EnvironmentResponseDTO
  envIdentifier?: string
  onCreateOrUpdate(data: EnvironmentRequestDTO): void
  closeModal?: () => void
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environment.yaml`,
  entityType: 'Environment',
  width: '100%',
  height: 220,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}
// SONAR recommendation
const flexStart = 'flex-start'

const cleanData = (values: EnvironmentResponseDTO): EnvironmentRequestDTO => {
  const newDescription = values.description?.toString().trim()
  const newId = values.identifier?.toString().trim()
  const newName = values.name?.toString().trim()
  const newType = values.type?.toString().trim()
  return {
    name: newName,
    identifier: newId,
    orgIdentifier: values.orgIdentifier,
    projectIdentifier: values.projectIdentifier,
    description: newDescription,
    tags: values.tags,
    type: newType as 'PreProduction' | 'Production'
  }
}

export const AddEditEnvironmentModal: React.FC<AddEditEnvironmentModalProps> = ({
  isEdit,
  data,
  isEnvironment,
  onCreateOrUpdate,
  closeModal
}): JSX.Element => {
  const { getString } = useStrings()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const { loading: createLoading, mutate: createEnvironment } = useCreateEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { loading: updateLoading, mutate: updateEnvironment } = useUpsertEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { showSuccess, showError, clear } = useToaster()
  const { trackEvent } = useTelemetry()

  React.useEffect(() => {
    !isEdit &&
      trackEvent(EnvironmentActions.StartCreateEnvironment, {
        category: Category.ENVIRONMENT
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = React.useCallback(
    async (value: Required<EnvironmentRequestDTO>) => {
      try {
        const values = cleanData(value)
        if (!values.name) {
          showError(getString('fieldRequired', { field: 'Environment' }))
        } else if (!values.identifier) {
          showError(getString('common.validation.fieldIsRequired', { name: 'Identifier' }))
        } else if (!(isEqual(values.type, 'PreProduction') || isEqual(values.type, 'Production'))) {
          showError(getString('cd.typeError'))
        } else if (isEdit && id !== values.identifier) {
          showError(getString('cd.editIdError', { id: id }))
        } else if (isEdit && !isEnvironment) {
          const response = await updateEnvironment({
            ...omit(values, 'accountId', 'deleted'),
            orgIdentifier,
            projectIdentifier
          })
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.environmentUpdated'))
            onCreateOrUpdate(values)
          }
        } else {
          const response = await createEnvironment({ ...values, orgIdentifier, projectIdentifier })
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.environmentCreated'))
            onCreateOrUpdate(values)
          }
        }
      } catch (e) {
        showError(getErrorInfoFromErrorObject(e, true))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCreateOrUpdate, orgIdentifier, projectIdentifier, isEdit, isEnvironment]
  )
  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const typeList: { label: string; value: string }[] = [
    {
      label: getString('production'),
      value: 'Production'
    },
    {
      label: getString('cd.preProduction'),
      value: 'PreProduction'
    }
  ]
  const formikRef = React.useRef<FormikProps<EnvironmentResponseDTO>>()
  const id = data.identifier
  const { data: environmentSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Environment',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })
  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const envSetYamlVisual = parse(yaml).environment as EnvironmentResponseDTO
        if (envSetYamlVisual) {
          formikRef.current?.setValues({
            ...omit(cleanData(envSetYamlVisual) as EnvironmentResponseDTO)
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, data]
  )
  if (createLoading || updateLoading) {
    return <PageSpinner />
  }
  return (
    <>
      <Container className={css.yamlToggleEnv}>
        <Layout.Horizontal flex={{ justifyContent: flexStart }} padding={{ top: 'small' }}>
          <VisualYamlToggle
            selectedView={selectedView}
            onChange={nextMode => {
              handleModeSwitch(nextMode)
            }}
          />
        </Layout.Horizontal>
      </Container>
      <Layout.Vertical>
        <Formik<Required<EnvironmentResponseDTO>>
          initialValues={data as Required<EnvironmentResponseDTO>}
          formName="deployInfrastructure"
          onSubmit={values => {
            onSubmit(values)
            !isEdit &&
              trackEvent(EnvironmentActions.SaveCreateEnvironment, {
                category: Category.ENVIRONMENT
              })
          }}
          validationSchema={Yup.object().shape({
            name: NameSchema({ requiredErrorMsg: getString?.('fieldRequired', { field: 'Environment' }) }),
            type: Yup.string().required(getString?.('fieldRequired', { field: 'Type' })),
            identifier: IdentifierSchema()
          })}
        >
          {formikProps => {
            formikRef.current = formikProps as FormikProps<EnvironmentResponseDTO> | undefined
            return (
              <>
                {selectedView === SelectedView.VISUAL ? (
                  <FormikForm>
                    <NameIdDescriptionTags
                      formikProps={formikProps}
                      identifierProps={{
                        inputLabel: getString('name'),
                        inputGroupProps: {
                          inputGroup: {
                            inputRef: ref => (inputRef.current = ref)
                          }
                        },
                        isIdentifierEditable: !isEdit
                      }}
                    />
                    <Layout.Vertical spacing={'small'} style={{ marginBottom: 'var(--spacing-medium)' }}>
                      <Label className={cx(Classes.LABEL, css.label)}>{getString('envType')}</Label>
                      <ThumbnailSelect className={css.thumbnailSelect} name={'type'} items={typeList} />
                    </Layout.Vertical>
                    <Layout.Horizontal spacing="small" padding={{ top: 'xlarge' }}>
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type={'submit'}
                        text={getString('save')}
                        data-id="environment-save"
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        text={getString('cancel')}
                        onClick={() => {
                          !isEdit &&
                            trackEvent(ExitModalActions.ExitByCancel, {
                              category: Category.ENVIRONMENT
                            })
                          closeModal?.()
                        }}
                      />
                    </Layout.Horizontal>
                  </FormikForm>
                ) : (
                  <Container>
                    <YAMLBuilder
                      {...yamlBuilderReadOnlyModeProps}
                      existingJSON={{
                        environment: {
                          ...omit(formikProps?.values),
                          description: defaultTo(formikProps.values.description, ''),
                          tags: defaultTo(formikProps.values.tags, {}),
                          type: defaultTo(formikProps.values.type, '')
                        }
                      }}
                      schema={environmentSchema?.data}
                      bind={setYamlHandler}
                      showSnippetSection={false}
                    />

                    <Layout.Horizontal spacing="small" padding={{ top: 'large' }}>
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type="submit"
                        text={getString('save')}
                        onClick={() => {
                          const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')
                          const errorMsg = yamlHandler?.getYAMLValidationErrorMap()
                          if (errorMsg?.size) {
                            showError(errorMsg.entries().next().value[1])
                          } else {
                            onSubmit(parse(latestYaml)?.environment)
                          }
                        }}
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        onClick={() => {
                          !isEdit &&
                            trackEvent(ExitModalActions.ExitByCancel, {
                              category: Category.ENVIRONMENT
                            })
                          closeModal?.()
                        }}
                        text={getString('cancel')}
                      />
                    </Layout.Horizontal>
                  </Container>
                )}
              </>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </>
  )
}
