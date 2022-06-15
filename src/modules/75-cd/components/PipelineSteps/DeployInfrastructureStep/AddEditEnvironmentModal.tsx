/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { defaultTo, get } from 'lodash-es'
import * as Yup from 'yup'
import { parse } from 'yaml'

import {
  Button,
  ButtonVariation,
  Formik,
  FormikForm,
  Layout,
  VisualYamlSelectedView as SelectedView,
  getErrorInfoFromErrorObject,
  Container
} from '@harness/uicore'
import { Color } from '@harness/design-system'

import { useStrings } from 'framework/strings'
import {
  EnvironmentRequestDTO,
  useUpsertEnvironmentV2,
  NGEnvironmentInfoConfig,
  NGEnvironmentConfig
} from 'services/cd-ng'

import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { useToaster } from '@common/exports'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'

import EnvironmentConfiguration from '@cd/components/EnvironmentsV2/EnvironmentDetails/EnvironmentConfiguration/EnvironmentConfiguration'

export interface AddEditEnvironmentModalProps {
  data: NGEnvironmentConfig
  onCreateOrUpdate(data: EnvironmentRequestDTO): void
  closeModal?: () => void
  isEdit: boolean
}

export const AddEditEnvironmentModal: React.FC<AddEditEnvironmentModalProps> = ({
  data,
  onCreateOrUpdate,
  closeModal,
  isEdit
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showSuccess, showError, clear } = useToaster()

  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)

  const { loading: upsertLoading, mutate: upsertEnvironment } = useUpsertEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
    // requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formikRef = useRef<FormikProps<NGEnvironmentInfoConfig>>()

  const onSubmit = useCallback(
    async (values: NGEnvironmentInfoConfig) => {
      try {
        const bodyWithoutYaml = {
          name: values.name,
          description: values.description,
          identifier: values.identifier,
          orgIdentifier: values.orgIdentifier,
          projectIdentifier: values.projectIdentifier,
          tags: values.tags,
          type: defaultTo(values.type, 'Production')
        }

        const response = await upsertEnvironment({
          ...bodyWithoutYaml,
          yaml: yamlStringify({ environment: values })
        })

        if (response.status === 'SUCCESS') {
          clear()
          showSuccess(getString(isEdit ? 'cd.environmentUpdated' : 'cd.environmentCreated'))
          onCreateOrUpdate(values)
        }
      } catch (e: any) {
        showError(getErrorInfoFromErrorObject(e, true))
      }
    },
    [onCreateOrUpdate, orgIdentifier, projectIdentifier]
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { name, identifier, description, tags, type, variables } = get(
    data,
    'environment',
    {} as NGEnvironmentInfoConfig
  )

  return (
    <Formik<NGEnvironmentInfoConfig>
      initialValues={
        {
          name: defaultTo(name, ''),
          identifier: defaultTo(identifier, ''),
          description: defaultTo(description, ''),
          tags: defaultTo(tags, {}),
          type: defaultTo(type, ''),
          orgIdentifier: defaultTo(orgIdentifier, ''),
          projectIdentifier: defaultTo(projectIdentifier, ''),
          variables
        } as NGEnvironmentInfoConfig
      }
      formName="editEnvironment"
      onSubmit={
        /* istanbul ignore next */ values => {
          onSubmit?.({ ...values })
        }
      }
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('fieldRequired', { field: 'Name' }) }),
        identifier: IdentifierSchema(),
        type: Yup.string().required().oneOf(['Production', 'PreProduction'])
      })}
      validateOnChange
    >
      {formikProps => {
        formikRef.current = formikProps
        return (
          <>
            <FormikForm>
              <Container
                background={Color.FORM_BG}
                padding={{ top: 'large', right: 'medium', bottom: 'large', left: 'medium' }}
              >
                <EnvironmentConfiguration
                  formikProps={formikProps}
                  selectedView={selectedView}
                  setSelectedView={setSelectedView}
                  yamlHandler={yamlHandler}
                  setYamlHandler={setYamlHandler}
                  isModified={false}
                  data={{ data: data } as any}
                  isEdit={isEdit}
                />
              </Container>
            </FormikForm>
            <Layout.Horizontal
              spacing="medium"
              flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
              margin={{ top: 'large' }}
            >
              <Button
                variation={ButtonVariation.PRIMARY}
                type={'submit'}
                text={getString('save')}
                data-id="environment-edit"
                onClick={
                  /* istanbul ignore next */ () => {
                    if (selectedView === SelectedView.YAML) {
                      const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), /* istanbul ignore next */ '')
                      onSubmit(parse(latestYaml)?.environment)
                    } else {
                      formikProps.submitForm()
                    }
                  }
                }
                loading={upsertLoading}
              />
              <Button
                variation={ButtonVariation.TERTIARY}
                text={getString('cancel')}
                onClick={closeModal}
                loading={upsertLoading}
              />
            </Layout.Horizontal>
          </>
        )
      }}
    </Formik>
  )
}
