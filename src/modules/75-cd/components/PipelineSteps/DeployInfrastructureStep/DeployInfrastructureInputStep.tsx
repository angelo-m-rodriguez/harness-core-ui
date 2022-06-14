/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  getMultiTypeFromValue,
  Dialog,
  Layout,
  MultiTypeInputType,
  SelectOption
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { connect, FormikProps } from 'formik'
import { EnvironmentResponseDTO, NGEnvironmentConfig, useGetEnvironmentAccessList } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import ExperimentalInput from '../K8sServiceSpec/K8sServiceSpecForms/ExperimentalInput'
import { AddEditEnvironmentModal } from './AddEditEnvironmentModal'
import type { DeployInfrastructureProps, PipelineInfrastructureV2 } from './utils'
import css from './DeployInfrastructureStep.module.scss'

export interface DeployInfrastructureData extends Omit<PipelineInfrastructureV2, 'environmentRef'> {
  environmentRef?: string
}

interface DeployInfrastructureState {
  isEdit: boolean
  isEnvironment: boolean
  formik?: FormikProps<DeployInfrastructureData>
  data?: EnvironmentResponseDTO
}

function isEditEnvironment(data: DeployInfrastructureData): boolean {
  if (getMultiTypeFromValue(data.environmentRef) !== MultiTypeInputType.RUNTIME && !isEmpty(data.environmentRef)) {
    return true
  } else if (data.environment && !isEmpty(data.environment.identifier)) {
    return true
  }
  return false
}

function DeployInfrastructureInputStepInternal({
  inputSetData,
  initialValues,
  formik,
  allowableTypes
}: DeployInfrastructureProps & { formik?: any }) {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [state, setState] = React.useState<DeployInfrastructureState>({
    isEdit: false,
    isEnvironment: false,
    data: { name: '', identifier: '' }
  })
  const { expressions } = useVariablesExpression()
  const {
    data: environmentsResponse,
    error,
    refetch
  } = useGetEnvironmentAccessList({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    lazy: true
  })
  const [environments, setEnvironments] = React.useState<SelectOption[]>([])

  React.useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={onClose}
        isCloseButtonShown
        title={state.isEdit ? getString('editEnvironment') : getString('newEnvironment')}
        className={'padded-dialog'}
      >
        <AddEditEnvironmentModal
          data={{} as NGEnvironmentConfig}
          // TODO: Put back commented out code after testing
          // data={{
          //   name: defaultTo(state.data?.name, ''),
          //   identifier: defaultTo(state.data?.identifier, ''),
          //   orgIdentifier,
          //   projectIdentifier,
          //   ...state.data
          // }}
          isEdit={state.isEdit}
          onCreateOrUpdate={values => {
            refetch()
            formik?.setFieldValue(
              `${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}environmentRef`,
              values.identifier
            )
            onClose.call(null)
          }}
          closeModal={onClose}
        />
      </Dialog>
    ),
    [state]
  )
  const onClose = React.useCallback(() => {
    setState({ isEdit: false, isEnvironment: false })
    hideModal()
  }, [hideModal])

  React.useEffect(() => {
    if (environmentsResponse?.data?.length) {
      setEnvironments(
        environmentsResponse.data.map(env => ({
          label: env.environment?.name || env.environment?.identifier || '',
          value: env.environment?.identifier || ''
        }))
      )
    }
  }, [environmentsResponse, environmentsResponse?.data?.length])
  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT,
      resourceIdentifier: environments[0]?.value as string
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT],
    options: {
      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
    }
  })

  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT]
  })
  if (error?.message) {
    showError(getRBACErrorMessage(error), undefined, 'cd.env.list.error')
  }
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.environmentRef) === MultiTypeInputType.RUNTIME && (
        <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
          <ExperimentalInput
            label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
            tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}environmentRef`}
            placeholder={getString('cd.pipelineSteps.environmentTab.selectEnvironment')}
            selectItems={environments}
            useValue
            multiTypeInputProps={{
              allowableTypes,
              selectProps: {
                addClearBtn: !inputSetData?.readonly,
                items: environments
              },
              expressions
            }}
            disabled={inputSetData?.readonly}
            className={css.inputWidth}
            formik={formik}
          />
          {getMultiTypeFromValue(initialValues?.environmentRef) === MultiTypeInputType.FIXED && (
            <Button
              size={ButtonSize.SMALL}
              variation={ButtonVariation.LINK}
              disabled={inputSetData?.readonly || (isEditEnvironment(initialValues) ? !canEdit : !canCreate)}
              onClick={() => {
                const isEdit = isEditEnvironment(initialValues)
                if (isEdit) {
                  setState({
                    isEdit,
                    isEnvironment: false,
                    data: environmentsResponse?.data?.filter(
                      env => env.environment?.identifier === initialValues.environmentRef
                    )?.[0]?.environment as EnvironmentResponseDTO
                  })
                }
                showModal()
              }}
              text={
                isEditEnvironment(initialValues)
                  ? getString('editEnvironment')
                  : getString('cd.pipelineSteps.environmentTab.plusNewEnvironment')
              }
            />
          )}
        </Layout.Horizontal>
      )}
    </>
  )
}
const DeployInfrastructureInputStep = connect(DeployInfrastructureInputStepInternal)

export default DeployInfrastructureInputStep
