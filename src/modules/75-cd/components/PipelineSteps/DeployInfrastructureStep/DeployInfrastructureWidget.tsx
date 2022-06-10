/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  Dialog,
  Layout,
  MultiTypeInputType,
  SelectOption
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import * as Yup from 'yup'
import { defaultTo, isEmpty, isNil, noop } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import {
  EnvironmentResponseDTO,
  InfrastructureResponseDTO,
  PipelineInfrastructure,
  useGetEnvironmentListV2,
  useGetInfrastructureList
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { useMutateAsGet } from '@common/hooks'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { getEnvironmentRefSchema } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import { InfrastructureModal } from '@cd/components/EnvironmentsV2/EnvironmentDetails/InfrastructureDefinition/InfrastructureModal'
import { DeployInfrastructureProps, DeployInfrastructureState, isEditEnvironment, isEditInfrastructure } from './utils'
import { AddEditEnvironmentModal } from './AddEditEnvironmentModal'

import css from './DeployInfrastructureStep.module.scss'
import infraCss from '../../EnvironmentsV2/EnvironmentDetails/InfrastructureDefinition/InfrastructureDefinition.module.scss'

// SONAR recommendation
const flexStart = 'flex-start'

export function DeployInfrastructureWidget({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes
}: DeployInfrastructureProps): JSX.Element {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const [state, setState] = useState<DeployInfrastructureState>({
    isEdit: false,
    isEnvironment: false,
    data: { name: '', identifier: '' }
  })

  const formikRef = useRef<FormikProps<unknown> | null>(null)

  const { subscribeForm, unSubscribeForm } = useContext(StageErrorContext)
  useEffect(() => {
    subscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
  }, [])

  const [environmentRefType, setEnvironmentRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue((formikRef?.current as any)?.values?.environmentRef)
  )

  const {
    data: environmentsResponse,
    loading: environmentsLoading,
    error: environmentsError
  } = useMutateAsGet(useGetEnvironmentListV2, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    body: {
      filterType: 'Environment'
    }
  })

  const [environments, setEnvironments] = useState<EnvironmentResponseDTO[]>()
  const [environmentsSelectOptions, setEnvironmentsSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (!environmentsLoading && !environmentsResponse?.data?.empty) {
      const enivronmentsList: EnvironmentResponseDTO[] = []
      if (environmentsResponse?.data?.content) {
        environmentsResponse.data.content.forEach(environmentObj => {
          enivronmentsList.push({ ...environmentObj.environment })
        })
      }
      setEnvironments(enivronmentsList)
    }
  }, [environmentsLoading, environmentsResponse])

  useEffect(() => {
    if (!isNil(environments)) {
      setEnvironmentsSelectOptions(
        environments.map(environment => {
          return { label: defaultTo(environment.name, ''), value: defaultTo(environment.identifier, '') }
        })
      )
    }
  }, [environments])

  useEffect(() => {
    if (!isEmpty(environmentsSelectOptions) && !isNil(environmentsSelectOptions) && initialValues.environmentRef) {
      if (getMultiTypeFromValue(initialValues.environmentRef) === MultiTypeInputType.FIXED) {
        const doesExist = environmentsSelectOptions.filter(env => env.value === initialValues.environmentRef).length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('environmentRef', '')
          } else {
            const options = [...environmentsSelectOptions]
            options.push({
              label: initialValues.environmentRef,
              value: initialValues.environmentRef
            })
            setEnvironmentsSelectOptions(options)
          }
        }
      }
    }
  }, [environmentsSelectOptions])

  if (!isNil(environmentsError)) {
    showError(getRBACErrorMessage(environmentsError), undefined, 'cd.env.list.error')
  }

  const updateEnvironmentsList = (value: EnvironmentResponseDTO) => {
    formikRef.current?.setValues({ environmentRef: value.identifier, ...(state.isEnvironment && { environment: {} }) })
    if (!isNil(environments) && !isEmpty(environments)) {
      const newEnvironmentsList = [...environments]
      const existingIndex = newEnvironmentsList.findIndex(item => item.identifier === value.identifier)
      if (existingIndex >= 0) {
        newEnvironmentsList.splice(existingIndex, 1, value)
      } else {
        newEnvironmentsList.unshift(value)
      }
      setEnvironments(newEnvironmentsList)
    }
    onClose()
  }

  const [showEnvironmentModal, hideEnvironmentModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={onClose}
        title={state.isEdit ? getString('editEnvironment') : getString('newEnvironment')}
      >
        <AddEditEnvironmentModal
          data={{
            name: defaultTo(state.data?.name, ''),
            identifier: defaultTo(state.data?.identifier, ''),
            orgIdentifier,
            projectIdentifier,
            ...state.data
          }}
          isEnvironment={state.isEnvironment}
          isEdit={state.isEdit}
          onCreateOrUpdate={updateEnvironmentsList}
          closeModal={onClose}
        />
      </Dialog>
    ),
    [state]
  )

  const onClose = useCallback(() => {
    setState({ isEdit: false, isEnvironment: false })
    hideEnvironmentModal()
  }, [hideEnvironmentModal])

  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT,
      resourceIdentifier: environments ? (environments[0]?.identifier as string) : ''
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

  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue((formikRef?.current as any)?.values?.infrastructureRef)
  )

  const {
    data: infrastructuresResponse,
    loading: infrastructuresLoading,
    error: infrastructuresError
  } = useGetInfrastructureList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: (formikRef?.current as any)?.values?.environmentRef
    },
    lazy:
      !(formikRef?.current as any)?.values?.environmentRef &&
      getMultiTypeFromValue((formikRef?.current as any)?.environmentRef) !== MultiTypeInputType.RUNTIME
  })

  const [infrastructures, setInfrastructures] = useState<InfrastructureResponseDTO[]>()
  const [infrastructuresSelectOptions, setInfrastructuresSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (!infrastructuresLoading && !infrastructuresResponse?.data?.empty) {
      const infrastructuresList: InfrastructureResponseDTO[] = []
      if (infrastructuresResponse?.data?.content) {
        infrastructuresResponse.data.content.forEach(environmentObj => {
          infrastructuresList.push({ ...environmentObj.infrastructure })
        })
      }
      setInfrastructures(infrastructuresList)
    }
  }, [infrastructuresLoading, infrastructuresResponse])

  useEffect(() => {
    if (!isNil(infrastructures)) {
      setInfrastructuresSelectOptions(
        infrastructures.map(infrastructure => {
          return { label: defaultTo(infrastructure.name, ''), value: defaultTo(infrastructure.identifier, '') }
        })
      )
    }
  }, [infrastructures])

  useEffect(() => {
    if (
      !isEmpty(infrastructuresSelectOptions) &&
      !isNil(infrastructuresSelectOptions) &&
      (initialValues as any).infrastructureRef
    ) {
      if (getMultiTypeFromValue((initialValues as any).infrastructureRef) === MultiTypeInputType.FIXED) {
        const doesExist =
          infrastructuresSelectOptions.filter(
            infra => infra.value === ((initialValues as any).infrastructureRef as unknown as string)
          ).length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('infrastructureRef', '')
          } else {
            const options = [...infrastructuresSelectOptions]
            options.push({
              label: (initialValues as any).infrastructureRef,
              value: (initialValues as any).infrastructureRef
            })
            setInfrastructuresSelectOptions(options)
          }
        }
      }
    }
  }, [infrastructuresSelectOptions])

  if (!isNil(infrastructuresError)) {
    showError(getRBACErrorMessage(infrastructuresError), undefined, 'cd.env.list.error')
  }

  const updateInfrastructuresList = (value: InfrastructureResponseDTO) => {
    formikRef.current?.setValues({ environmentRef: value.identifier, ...(state.isEnvironment && { environment: {} }) })
    if (!isNil(infrastructures) && !isEmpty(infrastructures)) {
      const newInfrastructureList = [...infrastructures]
      const existingIndex = newInfrastructureList.findIndex(item => item.identifier === value.identifier)
      if (existingIndex >= 0) {
        newInfrastructureList.splice(existingIndex, 1, value)
      } else {
        newInfrastructureList.unshift(value)
      }
      setInfrastructures(newInfrastructureList)
    }
    onInfraModalClose()
  }

  const [showInfrastructuresModal, hideInfrastructuresModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        isCloseButtonShown
        canEscapeKeyClose
        canOutsideClickClose
        enforceFocus={false}
        onClose={hideInfrastructuresModal}
        title={getString('cd.infrastructure.createNew')}
        className={cx('padded-dialog', infraCss.dialogStyles)}
      >
        <InfrastructureModal
          hideModal={hideInfrastructuresModal}
          refetch={updateInfrastructuresList}
          envIdentifier={(formikRef.current as any)?.values.environmentRef}
          // infrastructureToEdit={infrastructureToEdit}
          // setInfrastructureToEdit={setInfrastructureToEdit}
        />
      </Dialog>
    ),
    [state, formikRef.current]
  )

  const onInfraModalClose = useCallback(() => {
    setState({ isEdit: false, isEnvironment: false })
    hideInfrastructuresModal()
  }, [hideInfrastructuresModal])

  return (
    <>
      <Formik<PipelineInfrastructure>
        formName="deployInfrastructureStepForm"
        onSubmit={noop}
        validate={values => {
          onUpdate?.({
            environmentRef: values.environmentRef,
            infrastructureRef: (values as any).infrastructureRef
          } as any)
        }}
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          environmentRef: getEnvironmentRefSchema(getString)
        })}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.ENVIRONMENT }))
          formikRef.current = formik as FormikProps<unknown> | null
          const { values, setFieldValue } = formik
          return (
            <FormikForm>
              <Layout.Horizontal
                className={css.formRow}
                spacing="medium"
                flex={{ alignItems: flexStart, justifyContent: flexStart }}
              >
                <FormInput.MultiTypeInput
                  label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
                  tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
                  name="environmentRef"
                  useValue
                  disabled={readonly || (environmentRefType === MultiTypeInputType.FIXED && environmentsLoading)}
                  placeholder={
                    environmentsLoading
                      ? getString('loading')
                      : getString('cd.pipelineSteps.environmentTab.selectEnvironment')
                  }
                  multiTypeInputProps={{
                    onTypeChange: setEnvironmentRefType,
                    width: 280,
                    onChange: item => {
                      if (values.environmentRef && (item as SelectOption).value !== values.environmentRef) {
                        setFieldValue('environmentRef', (item as SelectOption)?.value)
                      }
                    },
                    selectProps: {
                      addClearBtn: !readonly,
                      items: defaultTo(environmentsSelectOptions, [])
                    },
                    expressions,
                    allowableTypes
                  }}
                  selectItems={defaultTo(environmentsSelectOptions, [])}
                />
                {environmentRefType === MultiTypeInputType.FIXED && (
                  <Button
                    size={ButtonSize.SMALL}
                    variation={ButtonVariation.LINK}
                    disabled={readonly || (isEditEnvironment(values) ? !canEdit : !canCreate)}
                    onClick={() => {
                      const isEdit = isEditEnvironment(values)
                      if (isEdit) {
                        if (values.environment?.identifier) {
                          setState({
                            isEdit,
                            formik,
                            isEnvironment: true,
                            data: values.environment
                          })
                        } else {
                          setState({
                            isEdit,
                            formik,
                            isEnvironment: false,
                            data: environments?.find(env => env.identifier === values.environmentRef)
                          })
                        }
                      } else {
                        setState({
                          isEdit: false,
                          isEnvironment: false,
                          formik
                        })
                      }
                      showEnvironmentModal()
                    }}
                    text={
                      isEditEnvironment(values)
                        ? getString('editEnvironment')
                        : getString('cd.pipelineSteps.environmentTab.plusNewEnvironment')
                    }
                    id={isEditEnvironment(values) ? 'edit-environment' : 'add-new-environment'}
                  />
                )}
                {Boolean(values.environmentRef) &&
                  getMultiTypeFromValue(values.environmentRef) === MultiTypeInputType.FIXED && (
                    <>
                      <FormInput.MultiTypeInput
                        label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructure')}
                        tooltipProps={{ dataTooltipId: 'specifyYourInfrastructure' }}
                        name="infrastructureRef"
                        useValue
                        disabled={
                          readonly || (infrastructureRefType === MultiTypeInputType.FIXED && infrastructuresLoading)
                        }
                        placeholder={
                          infrastructuresLoading
                            ? getString('loading')
                            : getString('cd.pipelineSteps.environmentTab.selectInfrastructure')
                        }
                        multiTypeInputProps={{
                          onTypeChange: setInfrastructureRefType,
                          width: 280,
                          onChange: item => {
                            if (
                              (values as any).infrastructureRef &&
                              (item as SelectOption).value !== (values as any).infrastructureRef
                            ) {
                              setFieldValue('infrastructureDefinitions', [(item as SelectOption)?.value])
                            }
                          },
                          selectProps: {
                            addClearBtn: !readonly,
                            items: defaultTo(infrastructuresSelectOptions, [])
                          },
                          expressions,
                          allowableTypes
                        }}
                        selectItems={defaultTo(infrastructuresSelectOptions, [])}
                      />
                      {infrastructureRefType === MultiTypeInputType.FIXED && (
                        <Button
                          size={ButtonSize.SMALL}
                          variation={ButtonVariation.LINK}
                          disabled={readonly || (isEditEnvironment(values) ? !canEdit : !canCreate)}
                          onClick={() => {
                            const isEdit = isEditEnvironment(values)
                            if (isEdit) {
                              //   if (values.environment?.identifier) {
                              //     setState({
                              //       isEdit,
                              //       formik,
                              //       isEnvironment: true,
                              //       data: values.environment
                              //     })
                              //   } else {
                              //     setState({
                              //       isEdit,
                              //       formik,
                              //       isEnvironment: false,
                              //       data: environments?.find(env => env.identifier === values.environmentRef)
                              //     })
                              //   }
                              // } else {
                              //   setState({
                              //     isEdit: false,
                              //     isEnvironment: false,
                              //     formik
                              //   })
                            }
                            showInfrastructuresModal()
                          }}
                          text={
                            isEditInfrastructure(values)
                              ? getString('common.editName', { name: getString('infrastructureText') })
                              : getString('common.plusNewName', { name: getString('infrastructureText') })
                          }
                          id={isEditInfrastructure(values) ? 'edit-infrastructure' : 'add-new-infrastructure'}
                        />
                      )}
                    </>
                  )}
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </>
  )
}
