/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { debounce } from 'lodash-es'
import { Formik, FieldArray, FormikProps } from 'formik'
import { v4 as uuid } from 'uuid'
import {
  Button,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  ButtonSize,
  ButtonVariation,
  Text
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import * as Yup from 'yup'

import { String, useStrings } from 'framework/strings'
import type { UseStringsReturn } from 'framework/strings'
import { TextInputWithCopyBtn } from '@common/components/TextInputWithCopyBtn/TextInputWithCopyBtn'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { NGVariable } from 'services/cd-ng'

import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import type { AllNGVariables } from '@pipeline/utils/types'
import { getVariablesValidationField } from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/validation'
import type { CustomVariableEditableProps, CustomVariablesData } from './CustomVariableEditable'
import { VariableType, labelStringMap } from './CustomVariableUtils'
import AddEditCustomVariable, { VariableState } from './AddEditCustomVariable'
import css from './CustomVariables.module.scss'

const getValidationSchema = (getString: UseStringsReturn['getString']): Yup.Schema<unknown> =>
  Yup.object().shape({
    ...getVariablesValidationField(getString)
  })

export function CustomVariablesEditableStage(props: CustomVariableEditableProps): React.ReactElement {
  const {
    initialValues,
    onUpdate,
    domId,
    className,
    yamlProperties,
    enableValidation,
    readonly,
    formName,
    tabName = 'OVERVIEW',
    allowableTypes
  } = props
  const uids = React.useRef<string[]>([])
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()

  const [selectedVariable, setSelectedVariable] = React.useState<VariableState | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdate = React.useCallback(
    debounce((data: CustomVariablesData) => onUpdate?.(data), 500),
    [onUpdate]
  )

  function addNew(): void {
    setSelectedVariable({
      variable: { name: '', type: 'String', value: '' },
      index: -1
    })
  }

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    enableValidation && subscribeForm({ tab: tabName, form: formikRef })
    return () => {
      if (enableValidation) {
        unSubscribeForm({ tab: tabName, form: formikRef })
      }
    }
  }, [enableValidation, subscribeForm, unSubscribeForm, tabName])

  React.useEffect(() => {
    formikRef.current?.setValues({ ...initialValues })
  }, [initialValues])

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={data => onUpdate?.(data)}
      validate={debouncedUpdate}
      validationSchema={enableValidation ? getValidationSchema(getString) : undefined}
    >
      {formik => {
        const { values, setFieldValue } = formik
        window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: tabName }))
        formikRef.current = formik as FormikProps<unknown> | null
        return (
          <FieldArray name="variables">
            {({ remove, push, replace }) => {
              function handleAdd(variable: NGVariable): void {
                uids.current.push(uuid())
                push(variable)
              }

              function handleUpdate(index: number, variable: AllNGVariables): void {
                variable.value = ''
                replace(index, variable)
              }

              function handleRemove(index: number): void {
                uids.current.splice(index, 1)
                remove(index)
              }

              return (
                <div className={cx(css.customVariablesStage, className)} id={domId}>
                  <AddEditCustomVariable
                    selectedVariable={selectedVariable}
                    setSelectedVariable={setSelectedVariable}
                    addNewVariable={handleAdd}
                    updateVariable={handleUpdate}
                    existingVariables={values.variables}
                    formName={formName}
                  />
                  {values.variables?.length > 0 ? (
                    <div className={cx(css.tableRow, css.headerRow)}>
                      <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('name')}</Text>
                      <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('typeLabel')}</Text>
                      <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('valueLabel')}</Text>
                    </div>
                  ) : null}
                  {values.variables.map?.((variable, index) => {
                    // generated uuid if they are not present
                    if (!uids.current[index]) {
                      uids.current[index] = uuid()
                    }
                    const key = uids.current[index]
                    const yamlData = yamlProperties?.[index] || {}

                    return (
                      <div key={key} className={css.tableRow}>
                        <TextInputWithCopyBtn
                          name={`variables[${index}].name`}
                          label=""
                          disabled={true}
                          localName={yamlData.localName}
                          fullName={yamlData.fqn}
                        />
                        <String
                          className={css.valueString}
                          stringID={labelStringMap[variable.type as VariableType]}
                          data-testid={`variables[${index}].type`}
                        />
                        <div className={css.valueColumn} data-type={getMultiTypeFromValue(variable.value as string)}>
                          {variable.type === VariableType.Secret ? (
                            <MultiTypeSecretInput name={`variables[${index}].value`} label="" disabled={readonly} />
                          ) : (
                            <FormInput.MultiTextInput
                              className="variableInput"
                              name={`variables[${index}].value`}
                              label=""
                              disabled={readonly}
                              multiTextInputProps={{
                                defaultValueToReset: '',
                                expressions,
                                textProps: {
                                  disabled: !initialValues.canAddVariable || readonly,
                                  type: variable.type === VariableType.Number ? 'number' : 'text'
                                },
                                allowableTypes
                              }}
                            />
                          )}
                          {getMultiTypeFromValue(variable.value as string) === MultiTypeInputType.RUNTIME ? (
                            <ConfigureOptions
                              value={variable.value as string}
                              defaultValue={variable.default}
                              type={variable.type || /* istanbul ignore next */ 'String'}
                              variableName={variable.name || /* istanbul ignore next */ ''}
                              onChange={(value, defaultValue) => {
                                setFieldValue(`variables[${index}].value`, value)
                                setFieldValue(`variables[${index}].default`, defaultValue)
                              }}
                              isReadonly={readonly}
                            />
                          ) : null}
                          <div className={css.actionButtons}>
                            {initialValues.canAddVariable && !readonly ? (
                              <React.Fragment>
                                <Button
                                  icon="Edit"
                                  tooltip={<String className={css.tooltip} stringID="common.editVariableType" />}
                                  data-testid={`edit-variable-${index}`}
                                  onClick={() => setSelectedVariable({ variable, index })}
                                  minimal
                                />
                                <Button
                                  icon="main-trash"
                                  data-testid={`delete-variable-${index}`}
                                  tooltip={<String className={css.tooltip} stringID="common.removeThisVariable" />}
                                  onClick={() => handleRemove(index)}
                                  minimal
                                />
                              </React.Fragment>
                            ) : /* istanbul ignore next */ null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {values.canAddVariable && (
                    <Button
                      className={css.addVariable}
                      disabled={readonly}
                      size={ButtonSize.SMALL}
                      variation={ButtonVariation.LINK}
                      onClick={addNew}
                      text={'+ ' + getString('common.addVariable')}
                    />
                  )}
                </div>
              )
            }}
          </FieldArray>
        )
      }}
    </Formik>
  )
}
