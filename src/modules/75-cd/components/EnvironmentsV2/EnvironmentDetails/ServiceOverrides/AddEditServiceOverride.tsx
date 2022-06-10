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
import { parse } from 'yaml'

import {
  Button,
  Formik,
  Layout,
  FormInput,
  ButtonVariation,
  SelectOption,
  Text,
  ButtonSize,
  Container,
  VisualYamlToggle,
  VisualYamlSelectedView as SelectedView,
  useToaster
} from '@harness/uicore'

import { useStrings } from 'framework/strings'
import {
  NGServiceConfig,
  NGServiceOverrideConfig,
  NGVariable,
  ResponsePageServiceOverrideResponseDTO,
  ResponsePageServiceResponse,
  ServiceOverrideResponseDTO,
  useUpsertServiceOverride
} from 'services/cd-ng'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import type { EnvironmentPathProps, PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'

import type { AllNGVariables } from '@pipeline/utils/types'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { getVariableTypeOptions, VariableType } from './ServiceOverridesUtils'

export interface VariableState {
  variable: AllNGVariables
  serviceRef: string
}

interface VariableOverride {
  name?: string
  type?: 'String' | 'Number' | 'Secret'
  value?: string
}

interface AddEditServiceOverrideFormProps {
  serviceRef?: string
  serviceYaml?: SelectOption
  environmentRef?: string
  variableOverride?: VariableOverride
  variableOverrides?: VariableOverride[]
}

export interface AddEditServiceOverrideProps {
  selectedVariable: VariableState | null
  services: ResponsePageServiceResponse | null
  serviceOverrides?: ResponsePageServiceOverrideResponseDTO | null
  closeModal: (updateServiceOverride?: boolean) => void
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `serviceOverrides.yaml`,
  entityType: 'Service',
  width: '100%',
  height: 350,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export default function AddEditServiceOverride({
  selectedVariable,
  services,
  closeModal,
  serviceOverrides
}: AddEditServiceOverrideProps): React.ReactElement {
  const { accountId, orgIdentifier, projectIdentifier, environmentIdentifier } = useParams<
    PipelinePathProps & EnvironmentPathProps
  >()

  const [servicesAvailable, setServicesAvailable] = useState<SelectOption[]>([])
  const [variablesAvailable, setVariablesAvailable] = useState<SelectOption[]>([])
  const [isModified, setIsModified] = useState<boolean>(false)
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()

  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const formikRef = useRef<FormikProps<AddEditServiceOverrideFormProps | undefined>>()

  useEffect(() => {
    if (services) {
      if (selectedVariable?.serviceRef?.length) {
        const serviceToBeSelected = services?.data?.content?.filter(
          serviceObject => serviceObject.service?.identifier === selectedVariable.serviceRef
        )?.[0]

        const serviceAvailable = {
          label: defaultTo(serviceToBeSelected?.service?.name, ''),
          value: defaultTo(yamlParse(defaultTo(serviceToBeSelected?.service?.yaml, '{}')), '')
        } as SelectOption

        setServicesAvailable([serviceAvailable])
      } else {
        setServicesAvailable(
          defaultTo(
            services?.data?.content?.map(item => {
              try {
                return {
                  label: defaultTo(item?.service?.name, ''),
                  value: defaultTo(yamlParse(defaultTo(item.service?.yaml, '{}')), '')
                }
              } catch (e: any) {
                return {
                  label: defaultTo(item?.service?.name, ''),
                  value: ''
                }
              }
            }),
            []
          )
        )
      }
    }
  }, [])

  const handleServiceChange = (item: SelectOption) => {
    setVariablesAvailable(
      defaultTo(
        (item?.value as NGServiceConfig)?.service?.serviceDefinition?.spec?.variables?.map(variable => ({
          label: defaultTo(variable.name, ''),
          value: defaultTo((variable as AllNGVariables).value, ''),
          type: variable.type
        })),
        []
      )
    )

    formikRef.current?.setValues({
      ...formikRef.current.values,
      serviceRef: (item?.value as NGServiceConfig).service?.identifier,
      variableOverride: {
        name: '',
        value: '',
        type: 'String'
      }
    })
  }

  const handleVariableChange = (item: SelectOption) => {
    formikRef.current?.setValues({
      ...formikRef.current.values,
      variableOverride: {
        name: item.label,
        value: item.value as string,
        type: defaultTo((item as AllNGVariables).type, 'String')
      }
    })
  }

  const validate = (values: AddEditServiceOverrideFormProps) => {
    const { name, type, value } = formikRef.current?.values as any
    const { variableOverride: { name: newName, type: newType, value: newValue } = {} } = values

    if (name === newName && type === newType && value === newValue) {
      setIsModified(false)
    } else {
      setIsModified(true)
    }
  }

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = (parse(yaml) as NGServiceOverrideConfig).serviceOverrides

        if (yamlVisual) {
          formikRef.current?.setValues({
            ...yamlVisual,
            variableOverrides: null,
            variableOverride: yamlVisual.variableOverrides?.[defaultTo(yamlVisual.variableOverrides?.length, 1) - 1]
          } as any)
        }
      } else {
        if (!formikRef.current?.values?.serviceRef) {
          showError('Please select a service first')
          return
        }
      }

      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml]
  )

  const formVariableOverrideObject = (serviceOverride?: ServiceOverrideResponseDTO, variableOverride?: NGVariable) => {
    const parsedYaml = parse(defaultTo(serviceOverride?.yaml, '{}')) as NGServiceOverrideConfig
    const otherVariableOverrides = defaultTo(
      parsedYaml.serviceOverrides?.variableOverrides
        ?.map(override => ({ name: get(override, 'name'), type: get(override, 'type'), value: get(override, 'value') }))

        ?.filter(override => {
          return override.name !== variableOverride?.name
        }),
      []
    )

    return [...otherVariableOverrides, variableOverride]
  }

  const { mutate: upsertServiceOverride, loading: upsertServiceOverrideLoading } = useUpsertServiceOverride({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const onSubmit = async (values: AddEditServiceOverrideFormProps) => {
    try {
      const response = await upsertServiceOverride({
        environmentRef: environmentIdentifier,
        serviceRef: (values as any).serviceRef,
        orgIdentifier,
        projectIdentifier,
        yaml: yamlStringify({
          serviceOverrides: {
            environmentRef: environmentIdentifier,
            serviceRef: (values as any).serviceRef,
            variableOverrides:
              values.variableOverrides ||
              formVariableOverrideObject(
                serviceOverrides?.data?.content?.filter(
                  serviceOverride => serviceOverride.serviceRef === values.serviceRef
                )?.[0],
                values.variableOverride
              )
          }
        } as NGServiceOverrideConfig)
      })

      if (response.status === 'SUCCESS') {
        closeModal(true)
      } else {
        throw response
      }
    } catch (e: any) {
      showError(getRBACErrorMessage(e))
    }
  }

  return (
    <Formik<AddEditServiceOverrideFormProps>
      formName={'addEditServiceOverrideForm'}
      initialValues={{
        serviceRef: selectedVariable?.serviceRef,
        environmentRef: environmentIdentifier,
        variableOverride: {
          name: selectedVariable?.variable.name,
          type: selectedVariable?.variable.type,
          value: selectedVariable?.variable.value as string
        }
      }}
      onSubmit={
        /* istanbul ignore next */ values => {
          onSubmit?.({
            ...values
          })
        }
      }
      validate={validate}
    >
      {formikProps => {
        formikRef.current = formikProps as any
        return (
          <Container margin={{ left: 'small', right: 'small' }}>
            <Layout.Horizontal
              flex={{ justifyContent: 'flex-start' }}
              padding={{ top: 'medium', bottom: 'medium' }}
              width={'320px'}
            >
              <VisualYamlToggle
                selectedView={selectedView}
                onChange={nextMode => {
                  handleModeSwitch(nextMode)
                }}
              />
            </Layout.Horizontal>
            {selectedView === SelectedView.VISUAL ? (
              <Container>
                <FormInput.Select
                  name="serviceYaml"
                  items={servicesAvailable}
                  label={getString('service')}
                  placeholder={getString('common.selectName', { name: getString('service') })}
                  onChange={handleServiceChange}
                />
                <Text>{getString('cd.overrideType')}</Text>
                <Button
                  disabled
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.SECONDARY}
                  margin={{ top: 'small', bottom: 'medium' }}
                >
                  {getString('variableLabel')}
                </Button>
                <FormInput.Select
                  name="variableOverride.name"
                  selectProps={{
                    allowCreatingNewItems: true
                  }}
                  items={variablesAvailable}
                  label={getString('variableNameLabel')}
                  placeholder={getString('common.selectName', { name: getString('variableLabel') })}
                  onChange={handleVariableChange}
                />
                <FormInput.Select
                  name="variableOverride.type"
                  items={getVariableTypeOptions(getString)}
                  label={getString('typeLabel')}
                  placeholder={getString('common.selectName', { name: getString('service') })}
                />
                {formikProps?.values?.variableOverride?.type === VariableType.Secret ? (
                  <MultiTypeSecretInput name={`value`} label={getString('cd.overrideValue')} />
                ) : (
                  <FormInput.MultiTextInput
                    className="variableInput"
                    name={`variableOverride.value`}
                    label={getString('cd.overrideValue')}
                    multiTextInputProps={{
                      defaultValueToReset: '',
                      expressions,
                      textProps: {
                        type: formikProps?.values?.variableOverride?.type === VariableType.Number ? 'number' : 'text'
                      }
                    }}
                  />
                )}
              </Container>
            ) : (
              <YAMLBuilder
                {...yamlBuilderReadOnlyModeProps}
                existingJSON={{
                  serviceOverrides: {
                    environmentRef: environmentIdentifier,
                    serviceRef: formikProps.values.serviceRef,
                    variableOverrides: formVariableOverrideObject(
                      serviceOverrides?.data?.content?.filter(
                        serviceOverride => serviceOverride.serviceRef === formikProps.values.serviceRef
                      )?.[0],
                      formikProps.values.variableOverride
                    )
                  }
                }}
                bind={setYamlHandler}
                showSnippetSection={false}
              />
            )}

            <Layout.Horizontal spacing="medium" padding={{ top: 'medium' }}>
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('save')}
                onClick={
                  /* istanbul ignore next */ () => {
                    if (selectedView === SelectedView.YAML) {
                      const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), /* istanbul ignore next */ '')
                      onSubmit(parse(latestYaml)?.serviceOverrides)
                    } else {
                      formikProps.submitForm()
                    }
                  }
                }
                data-testid="addVariableSave"
                disabled={!isModified || upsertServiceOverrideLoading}
              />
              <Button
                variation={ButtonVariation.TERTIARY}
                text={getString('cancel')}
                onClick={() => closeModal()}
                data-testid="addVariableCancel"
                disabled={upsertServiceOverrideLoading}
              />
            </Layout.Horizontal>
          </Container>
        )
      }}
    </Formik>
  )
}
