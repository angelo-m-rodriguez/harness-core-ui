/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil } from 'lodash-es'
import type { FormikProps } from 'formik'
import cx from 'classnames'

import {
  ButtonSize,
  ButtonVariation,
  Dialog,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  SelectOption,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import { InfrastructureResponse, InfrastructureResponseDTO, useGetInfrastructureList } from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import RbacButton from '@rbac/components/Button/Button'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import { InfrastructureModal } from '@cd/components/EnvironmentsV2/EnvironmentDetails/InfrastructureDefinition/InfrastructureModal'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { isEditInfrastructure, PipelineInfrastructureV2 } from '../utils'

import css from './DeployInfrastructures.module.scss'

interface DeployInfrastructuresProps {
  formikRef: React.MutableRefObject<FormikProps<unknown> | null>
  readonly?: boolean
  initialValues?: PipelineInfrastructureV2
  environmentIdentifier: string
  allowableTypes: MultiTypeInputType[]
}

export default function DeployInfrastructures({
  formikRef,
  readonly,
  initialValues,
  environmentIdentifier,
  allowableTypes
}: DeployInfrastructuresProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue((formikRef.current as any)?.values?.infrastructureRef)
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
      environmentIdentifier
    }
  })

  const [infrastructures, setInfrastructures] = useState<InfrastructureResponseDTO[]>()
  const [infrastructuresSelectOptions, setInfrastructuresSelectOptions] = useState<SelectOption[]>()
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | undefined>()

  useEffect(() => {
    if (!infrastructuresLoading && !get(infrastructuresResponse, 'data.empty')) {
      setInfrastructures(
        defaultTo(
          get(infrastructuresResponse, 'data.content', [])?.map((infrastructureObj: InfrastructureResponse) => ({
            ...infrastructureObj.infrastructure
          })),
          []
        )
      )
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
      (initialValues as any)?.infrastructureRef
    ) {
      if (getMultiTypeFromValue((initialValues as any)?.infrastructureRef) === MultiTypeInputType.FIXED) {
        const doesExist =
          infrastructuresSelectOptions.filter(
            infra => infra.value === ((initialValues as any)?.infrastructureRef as unknown as string)
          ).length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('infrastructureRef', '')
          } else {
            const options = [...infrastructuresSelectOptions]
            options.push({
              label: (initialValues as any)?.infrastructureRef,
              value: (initialValues as any)?.infrastructureRef
            })
            setInfrastructuresSelectOptions(options)
          }
        }
      }
    }
  }, [infrastructuresSelectOptions])

  useEffect(() => {
    if (!isNil(infrastructuresError)) {
      showError(getRBACErrorMessage(infrastructuresError))
    }
  }, [infrastructuresError])

  const updateInfrastructuresList = (value: InfrastructureResponseDTO) => {
    formikRef.current?.setValues({
      ...(formikRef.current as any).values,
      infrastructureRef: { value: value.identifier, label: value.name }
    })

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
    hideInfrastructuresModal()
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
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <InfrastructureModal
          hideModal={hideInfrastructuresModal}
          refetch={updateInfrastructuresList}
          envIdentifier={environmentIdentifier}
          infrastructureToEdit={selectedInfrastructure}
          setInfrastructureToEdit={setSelectedInfrastructure}
        />
      </Dialog>
    ),
    [formikRef.current, selectedInfrastructure, setSelectedInfrastructure]
  )

  return (
    <>
      <FormInput.MultiTypeInput
        label={getString('cd.pipelineSteps.environmentTab.specifyYourInfrastructure')}
        tooltipProps={{ dataTooltipId: 'specifyYourInfrastructure' }}
        name="infrastructureRef"
        useValue
        disabled={readonly || (infrastructureRefType === MultiTypeInputType.FIXED && infrastructuresLoading)}
        placeholder={
          infrastructuresLoading
            ? getString('loading')
            : getString('cd.pipelineSteps.environmentTab.selectInfrastructure')
        }
        multiTypeInputProps={{
          onTypeChange: setInfrastructureRefType,
          width: 280,
          onChange: item => {
            if ((item as SelectOption).value !== (formikRef.current?.values as any)?.infrastructureRef) {
              formikRef.current?.setFieldValue('infrastructureDefinitions', [(item as SelectOption)?.value])
              setSelectedInfrastructure(
                infrastructures?.filter(infra => infra.identifier === (item as SelectOption)?.value)?.[0].yaml
              )
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
        <RbacButton
          margin={{ bottom: 'small' }}
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
          disabled={readonly}
          onClick={showInfrastructuresModal}
          permission={{
            resource: {
              resourceType: ResourceType.ENVIRONMENT
            },
            permission: PermissionIdentifier.EDIT_ENVIRONMENT
          }}
          text={
            isEditInfrastructure(formikRef.current?.values)
              ? getString('common.editName', { name: getString('infrastructureText') })
              : getString('common.plusNewName', { name: getString('infrastructureText') })
          }
          id={isEditInfrastructure(formikRef.current?.values) ? 'edit-infrastructure' : 'add-new-infrastructure'}
        />
      )}
    </>
  )
}
