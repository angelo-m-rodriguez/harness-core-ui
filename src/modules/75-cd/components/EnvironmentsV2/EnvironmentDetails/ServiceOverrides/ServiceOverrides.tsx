/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isNil } from 'lodash-es'
import cx from 'classnames'
import { parse } from 'yaml'

import {
  FormInput,
  getMultiTypeFromValue,
  ButtonSize,
  ButtonVariation,
  Text,
  Layout,
  Card,
  Container,
  Dialog,
  useToaster
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { FontVariation, Color } from '@harness/design-system'

import {
  deleteServiceOverridePromise,
  NGServiceOverrideConfig,
  NGVariable,
  upsertServiceOverridePromise,
  useGetServiceList,
  useGetServiceOverridesList
} from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'

import { TextInputWithCopyBtn } from '@common/components/TextInputWithCopyBtn/TextInputWithCopyBtn'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import type { EnvironmentPathProps, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'

import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { VariableType, labelStringMap } from './ServiceOverridesUtils'
import AddEditServiceOverride, { VariableState } from './AddEditServiceOverride'

import css from './ServiceOverrides.module.scss'

export function ServiceOverrides(): React.ReactElement {
  const { accountId, orgIdentifier, projectIdentifier, environmentIdentifier } = useParams<
    PipelinePathProps & EnvironmentPathProps
  >()
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()
  const [selectedVariable, setSelectedVariable] = useState<VariableState | null>(null)
  const [isEdit, setIsEdit] = useState<boolean>(false)

  const { data: services, loading: servicesLoading } = useGetServiceList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const {
    data: serviceOverrides,
    loading: serviceOverridesLoading,
    refetch: refetchServiceOverrides
  } = useGetServiceOverridesList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    if (!servicesLoading && services?.data?.empty === false) {
      refetchServiceOverrides()
    }
  }, [servicesLoading, services])

  const createNewOverride = () => {
    setIsEdit(false)
    setSelectedVariable({
      serviceRef: '',
      variable: { name: '', type: 'String', value: '' }
    })
    showModal()
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideModal}
        className={cx(css.dialogStyles, 'padded-dialog')}
        title={getString(isEdit ? 'common.editName' : 'common.addName', { name: getString('common.override') })}
      >
        <AddEditServiceOverride
          selectedVariable={selectedVariable}
          closeModal={closeModal}
          services={services}
          serviceOverrides={serviceOverrides}
        />
      </Dialog>
    ),
    [selectedVariable, services, isEdit, serviceOverrides]
  )

  const closeModal = (updateServiceOverride?: boolean) => {
    hideModal()
    setSelectedVariable(null)
    if (updateServiceOverride) {
      refetchServiceOverrides()
    }
  }

  const handleDeleteOverride = async (variableOverrides: NGVariable[], index: number, serviceRef?: string) => {
    const variablesCount = variableOverrides.length
    if (variablesCount === 1) {
      try {
        const response = await deleteServiceOverridePromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            environmentIdentifier,
            serviceIdentifier: serviceRef
          },
          body: null as any
        })
        if (response.status === 'SUCCESS') {
          showSuccess('Successfully deleted service override')
          refetchServiceOverrides()
        } else {
          throw response
        }
      } catch (e: any) {
        showError(getRBACErrorMessage(e))
      }
    } else {
      try {
        const parsedYaml = parse(
          defaultTo(
            serviceOverrides?.data?.content?.filter(override => override.serviceRef === serviceRef)?.[0].yaml,
            '{}'
          )
        ) as NGServiceOverrideConfig
        const response = await upsertServiceOverridePromise({
          queryParams: {
            accountIdentifier: accountId
          },
          body: {
            orgIdentifier,
            projectIdentifier,
            environmentRef: environmentIdentifier,
            serviceRef,
            yaml: yamlStringify({
              ...parsedYaml,
              serviceOverrides: {
                ...parsedYaml.serviceOverrides,
                variableOverrides: variableOverrides.splice(index, index + 1).map(override => ({
                  name: get(override, 'name'),
                  type: get(override, 'type'),
                  value: get(override, 'value')
                }))
              }
            })
          }
        })

        if (response.status === 'SUCCESS') {
          showSuccess('Successfully deleted variable from service override')
          refetchServiceOverrides()
        } else {
          throw response
        }
      } catch (e: any) {
        showError(getRBACErrorMessage(e))
      }
    }
  }

  return servicesLoading || serviceOverridesLoading ? (
    <ContainerSpinner />
  ) : (
    <Container padding={{ left: 'medium', right: 'medium' }}>
      <Card className={css.serviceOverridesContainer}>
        <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
          <Text color={Color.GREY_700} margin={{ bottom: 'small' }} font={{ weight: 'bold' }}>
            {getString('cd.serviceOverrides')}
          </Text>
          <RbacButton
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            onClick={createNewOverride}
            text={getString('common.plusNewName', { name: getString('common.override') })}
            permission={{
              resource: {
                resourceType: ResourceType.ENVIRONMENT
              },
              permission: PermissionIdentifier.EDIT_ENVIRONMENT
            }}
          />
        </Layout.Horizontal>
        <Text>{getString('cd.serviceOverridesHelperText')}</Text>

        {serviceOverrides?.data?.content?.map((serviceOverride, overrideIndex) => {
          const { serviceOverrides: { serviceRef, variableOverrides } = {} } = parse(
            defaultTo(serviceOverride.yaml, '{}')
          ) as NGServiceOverrideConfig
          return (
            <Container key={serviceRef} margin={{ top: 'medium', bottom: 'medium' }}>
              <Text
                color={Color.BLACK}
                font={{ variation: FontVariation.UPPERCASED, weight: 'bold' }}
                margin={{ bottom: 'small' }}
              >
                {services?.data?.content?.filter(serviceObject => serviceRef === serviceObject.service?.identifier)?.[0]
                  ?.service?.name || serviceRef}
              </Text>
              <Card style={{ width: '100%' }}>
                {!isNil(variableOverrides) && variableOverrides.length > 0 && (
                  <div className={cx(css.tableRow, css.headerRow)}>
                    <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
                      {getString('cd.configurationVariable')}
                    </Text>
                    <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('typeLabel')}</Text>
                    <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('cd.overrideValue')}</Text>
                  </div>
                )}
                {variableOverrides?.map?.((variable: any, index: any) => {
                  return (
                    <div key={`${serviceRef}-${variable.name}`} className={css.tableRow}>
                      <TextInputWithCopyBtn
                        name={`serviceOverrides[${overrideIndex}]variables[${index}].name`}
                        label=""
                        disabled={true}
                        staticDisplayValue={variable.name}
                      />
                      <String
                        className={css.valueString}
                        stringID={labelStringMap[variable.type as VariableType]}
                        data-testid={`serviceOverrides[${overrideIndex}]variables[${index}].type`}
                      />
                      <div className={css.valueColumn} data-type={getMultiTypeFromValue(variable.value as string)}>
                        {variable.type === VariableType.Secret ? (
                          <MultiTypeSecretInput
                            name={`serviceOverrides[${overrideIndex}]variables[${index}].value`}
                            label=""
                            disabled={true}
                          />
                        ) : (
                          <FormInput.MultiTextInput
                            className="variableInput"
                            name={`serviceOverrides[${overrideIndex}]variables[${index}].value`}
                            label=""
                            disabled={true}
                            multiTextInputProps={{
                              defaultValueToReset: '',
                              expressions,
                              textProps: {
                                type: variable.type === VariableType.Number ? 'number' : 'text'
                              },
                              value: variable.value
                            }}
                          />
                        )}
                        <div className={css.actionButtons}>
                          <React.Fragment>
                            <RbacButton
                              icon="Edit"
                              tooltip={<String className={css.tooltip} stringID="common.editVariableType" />}
                              data-testid={`edit-variable-${index}`}
                              onClick={() => {
                                setSelectedVariable({
                                  variable,
                                  serviceRef: defaultTo(serviceRef, '')
                                })
                                setIsEdit(true)
                                showModal()
                              }}
                              minimal
                              permission={{
                                resource: {
                                  resourceType: ResourceType.ENVIRONMENT
                                },
                                permission: PermissionIdentifier.EDIT_ENVIRONMENT
                              }}
                            />
                            <RbacButton
                              icon="main-trash"
                              data-testid={`delete-variable-${index}`}
                              tooltip={<String className={css.tooltip} stringID="common.removeThisVariable" />}
                              onClick={() => handleDeleteOverride(variableOverrides, index, serviceRef)}
                              minimal
                              permission={{
                                resource: {
                                  resourceType: ResourceType.ENVIRONMENT
                                },
                                permission: PermissionIdentifier.EDIT_ENVIRONMENT
                              }}
                            />
                          </React.Fragment>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <RbacButton
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.LINK}
                  onClick={() => {
                    setSelectedVariable({
                      variable: { name: '', type: 'String', value: '' },
                      serviceRef: defaultTo(serviceRef, '')
                    })
                    setIsEdit(false)
                    showModal()
                  }}
                  text={getString('common.plusAddName', { name: getString('common.override') })}
                  permission={{
                    resource: {
                      resourceType: ResourceType.ENVIRONMENT
                    },
                    permission: PermissionIdentifier.EDIT_ENVIRONMENT
                  }}
                />
              </Card>
            </Container>
          )
        })}
      </Card>
    </Container>
  )
}
