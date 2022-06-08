/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import type { FormikContextType } from 'formik'
import { defaultTo } from 'lodash-es'
import { useParams } from 'react-router-dom'

import { Container, FormInput, Layout, SelectOption } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  ConnectorReferenceField,
  ConnectorSelectedValue
} from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import RepositorySelect from '@common/components/RepositorySelect/RepositorySelect'
import RepoBranchSelectV2 from '@common/components/RepoBranchSelectV2/RepoBranchSelectV2'
import type { ResponseMessage } from 'services/cd-ng'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import css from './GitSyncForm.module.scss'

interface GitSyncFormProps<T> {
  identifier?: string
  formikProps: FormikContextType<T>
  isEdit: boolean
  defaultValue?: any
  modalErrorHandler?: any
  handleSubmit: () => void
  closeModal?: () => void
  showRemoteTypeSelection?: boolean
  disableFields?: {
    [key: string]: boolean
  }
}

export interface GitSyncFormFields {
  identifier?: string
  remoteType?: string
  connectorRef?: ConnectorSelectedValue
  repo?: string
  branch?: string
  filePath?: string
}

const getConnectorIdentifierWithScope = (scope: Scope, identifier: string): string => {
  return scope === Scope.ORG || scope === Scope.ACCOUNT ? `${scope}.${identifier}` : identifier
}

export function GitSyncForm(props: GitSyncFormProps<GitSyncFormFields>): React.ReactElement {
  const { formikProps, isEdit, showRemoteTypeSelection = true, disableFields = {} } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { branch, connectorRef, repoName } = useQueryParams<GitQueryParams>()
  const { updateQueryParams } = useUpdateQueryParams()
  const { getString } = useStrings()
  const [errorResponse, setErrorResponse] = useState<ResponseMessage[]>([])

  useEffect(() => {
    !isEdit &&
      formikProps?.values?.identifier &&
      formikProps.setFieldValue('filePath', `.harness/${formikProps.values.identifier}.yaml`)
  }, [formikProps?.values?.identifier, isEdit])

  useEffect(() => {
    setErrorResponse([])
  }, [formikProps.values.connectorRef])

  return (
    <Container padding={{ top: 'large' }} className={css.gitSyncForm}>
      {showRemoteTypeSelection && (
        <FormInput.RadioGroup
          name="remoteType"
          radioGroup={{ inline: true }}
          items={[
            { label: 'Use Existing Yaml', value: 'import', disabled: true },
            { label: 'Create New Yaml', value: 'create', disabled: isEdit }
          ]}
          onChange={elm => {
            formikProps.setFieldValue(
              'filePath',
              (elm.target as HTMLInputElement).value === 'import'
                ? ''
                : `.harness/${formikProps?.values?.identifier}.yaml`
            )
          }}
        />
      )}

      <Layout.Horizontal>
        <Layout.Vertical>
          <ConnectorReferenceField
            name="connectorRef"
            width={350}
            type={['Github', 'Bitbucket']}
            selected={formikProps.values.connectorRef || connectorRef}
            error={formikProps.submitCount > 0 ? formikProps?.errors?.connectorRef : undefined}
            label={'Select Git Connector'}
            placeholder={`- ${getString('select')} -`}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            onChange={(value, scope) => {
              const connectorRefWithScope = getConnectorIdentifierWithScope(scope, value?.identifier)

              formikProps.setFieldValue('connectorRef', {
                label: defaultTo(value.name, ''),
                value: connectorRefWithScope,
                scope: scope,
                live: value?.status?.status === 'SUCCESS',
                connector: value
              })
              formikProps.setFieldValue?.('repo', '')
              formikProps.setFieldValue?.('branch', '')
              updateQueryParams({ connectorRef: connectorRefWithScope, repoName: [] as any, branch: [] as any })
            }}
            disabled={isEdit || disableFields.connectorRef}
          />

          <RepositorySelect
            formikProps={formikProps}
            connectorRef={formikProps.values.connectorRef?.value || connectorRef}
            onChange={(selected: SelectOption) => {
              if (errorResponse?.length === 0) {
                formikProps.setFieldValue?.('branch', '')
                updateQueryParams({ repoName: selected.value as string, branch: [] as any })
              }
            }}
            selectedValue={formikProps?.values?.repo || repoName}
            disabled={isEdit || disableFields.repoName}
            setErrorResponse={setErrorResponse}
          />
          <RepoBranchSelectV2
            connectorIdentifierRef={formikProps.values.connectorRef?.value || connectorRef}
            repoName={formikProps?.values?.repo}
            onChange={(selected: SelectOption) => {
              if (errorResponse?.length === 0) {
                updateQueryParams({ branch: selected.value as string })
              }
            }}
            selectedValue={formikProps.values.branch || branch}
            disabled={isEdit || disableFields.branch}
            setErrorResponse={setErrorResponse}
          />
          <FormInput.Text
            name="filePath"
            label={'Yaml Path'}
            placeholder={'Enter Yaml path'}
            disabled={isEdit || disableFields.filePath}
          />
        </Layout.Vertical>
        {errorResponse?.length > 0 && (
          <Layout.Vertical style={{ flexShrink: 1 }} padding={{ left: 'xlarge' }}>
            <ErrorHandler responseMessages={errorResponse} />
          </Layout.Vertical>
        )}
      </Layout.Horizontal>
    </Container>
  )
}
