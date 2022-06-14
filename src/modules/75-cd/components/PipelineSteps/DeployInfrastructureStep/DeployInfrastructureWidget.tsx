/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil, noop } from 'lodash-es'
import type { FormikProps } from 'formik'
import * as Yup from 'yup'
import { parse } from 'yaml'

import {
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  SelectOption,
  Dialog,
  ButtonSize,
  ButtonVariation,
  SplitButton,
  SplitButtonOption
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import {
  EnvironmentGroupResponse,
  EnvironmentGroupResponseDTO,
  EnvironmentResponse,
  EnvironmentResponseDTO,
  useGetEnvironmentGroupList,
  useGetEnvironmentListV2
} from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { useMutateAsGet } from '@common/hooks'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

import { getEnvironmentRefSchema } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import CreateEnvironmentGroupModal from '@cd/components/EnvironmentGroups/CreateEnvironmentGroupModal'

import { DeployInfrastructureProps, isEditEnvironment, PipelineInfrastructureV2 } from './utils'
import { AddEditEnvironmentModal } from './AddEditEnvironmentModal'
import DeployInfrastructures from './DeployInfrastructures/DeployInfrastructures'
import DeployClusters from './DeployClusters/DeployClusters'
import DeployEnvironmentInEnvGroup from './DeployEnvironmentInEnvGroup/DeployEnvironmentInEnvGroup'

import css from './DeployInfrastructureStep.module.scss'

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
  const [environmentOrEnvGroupRefType, setEnvironmentOrEnvGroupRefType] = useState<MultiTypeInputType>(
    MultiTypeInputType.FIXED
  )

  const formikRef = useRef<FormikProps<unknown> | null>(null)

  const { subscribeForm, unSubscribeForm } = useContext(StageErrorContext)
  useEffect(() => {
    subscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.ENVIRONMENT, form: formikRef })
  }, [])

  const {
    state: {
      selectionState: { selectedStageId }
    },
    getStageFromPipeline
  } = usePipelineContext()
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

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
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentResponseDTO>()
  const [environmentsSelectOptions, setEnvironmentsSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (!environmentsLoading && !get(environmentsResponse, 'data.empty')) {
      setEnvironments(
        defaultTo(
          get(environmentsResponse, 'data.content', [])?.map((environmentObj: EnvironmentResponse) => ({
            ...environmentObj.environment
          })),
          []
        )
      )
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
            formikRef.current?.setFieldValue('environmentOrEnvGroupRef', '')
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

  useEffect(() => {
    if (!isNil(environmentsError)) {
      showError(getRBACErrorMessage(environmentsError))
    }
  }, [environmentsError])

  const updateEnvironmentsList = (value: EnvironmentResponseDTO) => {
    formikRef.current?.setValues({ environmentOrEnvGroupRef: { value: value.identifier, label: value.name } })
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
    hideEnvironmentModal()
  }

  const [showEnvironmentModal, hideEnvironmentModal] = useModalHook(() => {
    const environmentValues = parse(defaultTo(selectedEnvironment?.yaml, '{}'))
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={hideEnvironmentModal}
        title={isEditEnvironment(environmentValues) ? getString('editEnvironment') : getString('newEnvironment')}
        className={css.dialogStyles}
      >
        <AddEditEnvironmentModal
          data={{
            ...environmentValues
          }}
          onCreateOrUpdate={updateEnvironmentsList}
          closeModal={hideEnvironmentModal}
          isEdit={Boolean(selectedEnvironment)}
        />
      </Dialog>
    )
  }, [environments, updateEnvironmentsList])

  const {
    data: environmentGroupsResponse,
    loading: environmentGroupsLoading,
    error: environmentGroupsError
  } = useMutateAsGet(useGetEnvironmentGroupList, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    body: {
      filterType: 'EnvironmentGroup'
    }
  })

  const [environmentGroups, setEnvironmentGroups] = useState<EnvironmentGroupResponseDTO[]>()
  const [selectedEnvironmentGroup, setSelectedEnvironmentGroup] = useState<EnvironmentGroupResponseDTO>()
  const [environmentGroupsSelectOptions, setEnvironmentGroupsSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (!environmentGroupsLoading && !get(environmentGroupsResponse, 'data.empty')) {
      setEnvironmentGroups(
        defaultTo(
          get(environmentGroupsResponse, 'data.content', [])?.map((environmentObj: EnvironmentGroupResponse) => ({
            ...environmentObj.envGroup
          })),
          []
        )
      )
    }
  }, [environmentGroupsLoading, environmentGroupsResponse])

  useEffect(() => {
    if (!isNil(environmentGroups)) {
      setEnvironmentGroupsSelectOptions(
        environmentGroups.map(environmentGroup => {
          return { label: defaultTo(environmentGroup.name, ''), value: defaultTo(environmentGroup.identifier, '') }
        })
      )
    }
  }, [environmentGroups])

  useEffect(() => {
    if (
      !isEmpty(environmentGroupsSelectOptions) &&
      !isNil(environmentGroupsSelectOptions) &&
      initialValues.environmentGroup?.envGroupRef
    ) {
      if (getMultiTypeFromValue(initialValues.environmentGroup.envGroupRef) === MultiTypeInputType.FIXED) {
        const doesExist =
          environmentGroupsSelectOptions.filter(env => env.value === initialValues.environmentGroup.envGroupRef)
            .length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('environmentGroup.envGroupRef', '')
          } else {
            const options = [...environmentGroupsSelectOptions]
            options.push({
              label: initialValues.environmentGroup.envGroupRef,
              value: initialValues.environmentGroup.envGroupRef
            })
            setEnvironmentGroupsSelectOptions(options)
          }
        }
      }
    }
  }, [environmentGroupsSelectOptions])

  useEffect(() => {
    if (!isNil(environmentGroupsError)) {
      showError(getRBACErrorMessage(environmentGroupsError))
    }
  }, [environmentGroupsError])

  const [showEnvironmentGroupModal, hideEnvironmentGroupModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={hideEnvironmentGroupModal}
        // title={isEdit ? getString('common.environmentGroup.edit') : getString('common.environmentGroup.createNew')}
        className={css.dialogStyles}
      >
        <CreateEnvironmentGroupModal
          // data={defaultTo({}, {}) as any}
          // onCreateOrUpdate={updateEnvironmentGroupsList}
          closeModal={hideEnvironmentGroupModal}
          // isEdit={isEdit}
        />
      </Dialog>
    ),
    [environments, updateEnvironmentsList]
  )

  // const updateEnvironmentGroupsList = (value: EnvironmentResponseDTO) => {
  //   formikRef.current?.setValues({ environmentOrEnvGroupRef: { value: value.identifier, label: value.name } })
  //   if (!isNil(environments) && !isEmpty(environments)) {
  //     const newEnvironmentsList = [...environments]
  //     const existingIndex = newEnvironmentsList.findIndex(item => item.identifier === value.identifier)
  //     if (existingIndex >= 0) {
  //       newEnvironmentsList.splice(existingIndex, 1, value)
  //     } else {
  //       newEnvironmentsList.unshift(value)
  //     }
  //     setEnvironments(newEnvironmentsList)
  //   }
  //   hideEnvironmentGroupModal()
  // }

  return (
    <Formik<PipelineInfrastructureV2>
      formName="deployInfrastructureStepForm"
      onSubmit={noop}
      validate={(values: PipelineInfrastructureV2) => {
        const commonConfig = {
          deployToAll: defaultTo(values.deployToAll, false),
          ...(!stage?.stage?.spec?.gitOpsEnabled && {
            infrastructureDefinitions: (values as any).infrastructureDefinitions?.map((infra: string) => ({
              ref: infra
            }))
          }),
          ...(stage?.stage?.spec?.gitOpsEnabled && {
            gitOpsClusters: (values as any).gitOpsClusters?.map((infra: string) => ({
              ref: infra
            }))
          })
        }
        if (values.environmentRef2) {
          onUpdate?.({
            environmentGroup: {
              envGroupRef: values.environmentOrEnvGroupRef?.value,
              envGroupConfig: [
                {
                  environmentRef: values.environmentRef2?.value,
                  ...commonConfig
                }
              ]
            }
          })
        } else {
          onUpdate?.({
            environment: {
              environmentRef: values.environmentOrEnvGroupRef?.value,
              ...commonConfig
            }
          } as any)
        }
      }}
      initialValues={initialValues}
      validationSchema={Yup.object().shape({
        environmentOrEnvGroupRef: getEnvironmentRefSchema(getString)
      })}
    >
      {formik => {
        window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.ENVIRONMENT }))
        formikRef.current = formik as FormikProps<unknown> | null

        const { values, setFieldValue } = formik
        return (
          <>
            <Layout.Horizontal
              className={css.formRow}
              spacing="medium"
              flex={{ alignItems: 'flex-end', justifyContent: flexStart }}
              margin={{ bottom: 'large' }}
            >
              <FormInput.SelectWithSubmenuTypeInput
                label={getString('cd.pipelineSteps.environmentTab.specifyEnvironmentOrGroup')}
                name="environmentOrEnvGroupRef"
                disabled={environmentsLoading || environmentGroupsLoading}
                selectWithSubmenuTypeInputProps={{
                  items:
                    environmentsLoading || environmentGroupsLoading
                      ? [{ value: '', label: 'Loading...', submenuItems: [] }]
                      : [
                          {
                            label: getString('environment'),
                            value: getString('environment'),
                            submenuItems: defaultTo(environmentsSelectOptions, []),
                            hasSubItems: true
                          },
                          {
                            label: getString('common.environmentGroup.label'),
                            value: getString('common.environmentGroup.label'),
                            submenuItems: defaultTo(environmentGroupsSelectOptions, []),
                            hasSubItems: true
                          }
                        ],
                  onChange: (
                    primaryOption?: SelectOption,
                    secondaryOption?: SelectOption,
                    type?: MultiTypeInputType
                  ) => {
                    if (primaryOption?.value === getString('environment')) {
                      setFieldValue('environmentOrEnvGroupRef', secondaryOption)
                      setFieldValue('environmentGroup.envGroupRef', '')
                      setSelectedEnvironment(
                        environments?.find(environment => environment.identifier === secondaryOption?.value)
                      )
                      setSelectedEnvironmentGroup(undefined)
                    } else if (primaryOption?.value === getString('common.environmentGroup.label')) {
                      setFieldValue('environmentOrEnvGroupRef', secondaryOption)
                      setFieldValue('environmentGroup.envGroupRef', secondaryOption?.value)
                      setSelectedEnvironment(undefined)
                      setSelectedEnvironmentGroup(
                        environmentGroups?.find(
                          environmentGroup => environmentGroup.identifier === secondaryOption?.value
                        )
                      )
                    } else {
                      setFieldValue('environmentOrEnvGroupRef', primaryOption)
                    }
                    setEnvironmentOrEnvGroupRefType(defaultTo(type, MultiTypeInputType.FIXED))
                  }
                }}
              />
              {environmentOrEnvGroupRefType === MultiTypeInputType.FIXED && (
                <SplitButton
                  margin={{ bottom: 'small' }}
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.LINK}
                  text={
                    isEditEnvironment(values)
                      ? getString('editEnvironment')
                      : getString('cd.pipelineSteps.environmentTab.plusNewEnvironment')
                  }
                  id={isEditEnvironment(values) ? 'edit-environment' : 'add-new-environment'}
                  onClick={showEnvironmentModal}
                >
                  <SplitButtonOption
                    text={getString('common.environmentGroup.new')}
                    onClick={showEnvironmentGroupModal}
                  />
                </SplitButton>
              )}
              {Boolean(values.environmentGroup?.envGroupRef) &&
                selectedEnvironmentGroup &&
                environmentOrEnvGroupRefType === MultiTypeInputType.FIXED && (
                  <DeployEnvironmentInEnvGroup
                    selectedEnvironmentGroup={selectedEnvironmentGroup}
                    setSelectedEnvironment={setSelectedEnvironment}
                    formikRef={formikRef}
                    initialValues={initialValues}
                    allowableTypes={allowableTypes}
                    readonly={readonly}
                  />
                )}
              {(Boolean(values.environmentOrEnvGroupRef) || Boolean(values.environmentRef2)) &&
              environmentOrEnvGroupRefType === MultiTypeInputType.FIXED &&
              selectedEnvironment?.identifier ? (
                stage?.stage?.spec?.gitOpsEnabled ? (
                  <DeployClusters
                    environmentIdentifier={selectedEnvironment?.identifier}
                    formikRef={formikRef}
                    initialValues={initialValues}
                    allowableTypes={allowableTypes}
                  />
                ) : (
                  <DeployInfrastructures
                    environmentIdentifier={selectedEnvironment?.identifier}
                    formikRef={formikRef}
                    initialValues={initialValues}
                    allowableTypes={allowableTypes}
                  />
                )
              ) : null}
            </Layout.Horizontal>

            <FormInput.CheckBox name={'deployToAll'} label={getString('cd.pipelineSteps.environmentTab.deployToAll')} />
          </>
        )
      }}
    </Formik>
  )
}
