/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Text,
  Button,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  useNestedAccordion,
  ButtonVariation,
  ButtonSize
} from '@wings-software/uicore'
import { Formik, FieldArray } from 'formik'
import { v4 as uuid } from 'uuid'
import cx from 'classnames'
import { debounce, escape } from 'lodash-es'

import { String } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { TextInputWithCopyBtn } from '@common/components/TextInputWithCopyBtn/TextInputWithCopyBtn'
import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import type { NGVariable } from 'services/cd-ng'
import type { YamlProperties } from 'services/pipeline-ng'
import type { AllNGVariables } from '@pipeline/utils/types'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import {
  getTextWithSearchMarkers,
  usePipelineVariables
} from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import AddEditCustomVariable from './AddEditCustomVariable'
import type { VariableState } from './AddEditCustomVariable'
import { VariableType } from './CustomVariableUtils'
import css from './CustomVariables.module.scss'

export interface CustomVariablesData {
  variables: AllNGVariables[]
  isPropagating?: boolean
  canAddVariable?: boolean
}

export interface CustomVariableEditableExtraProps {
  variableNamePrefix?: string
  domId?: string
  tabName?: string
  formName?: string
  heading?: React.ReactNode
  className?: string
  yamlProperties?: YamlProperties[]
  showHeaders?: boolean
  enableValidation?: boolean
  path?: string
  hideExecutionTimeField?: boolean
}

export interface CustomVariableEditableProps extends CustomVariableEditableExtraProps {
  initialValues: CustomVariablesData
  onUpdate?: (data: CustomVariablesData) => void
  stepViewType?: StepViewType
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
}

export function CustomVariableEditable(props: CustomVariableEditableProps): React.ReactElement {
  const {
    initialValues,
    onUpdate,
    domId,
    heading,
    className,
    yamlProperties,
    readonly,
    path,
    formName,
    hideExecutionTimeField,
    allowableTypes
  } = props
  const uids = React.useRef<string[]>([])

  const [hoveredVariable, setHoveredVariable] = useState<Record<string, boolean>>({})
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
  const { expressions } = useVariablesExpression()

  const { searchText, searchIndex, searchResults = [] } = usePipelineVariables()
  const searchedEntity = searchResults[searchIndex || 0] || {}
  const updatedPath = path?.replace('pipeline.', '')
  const tableRef = React.useRef()
  const { openNestedPath } = useNestedAccordion()
  const { NG_EXECUTION_INPUT } = useFeatureFlags()

  React.useLayoutEffect(() => {
    if (tableRef.current) {
      const { testid: accordianId = '', open } =
        (tableRef?.current as any)?.closest?.('.Accordion--panel')?.dataset || {}

      if (open === 'false') {
        openNestedPath(accordianId?.replace('-panel', ''))
        setTimeout(() => {
          document?.querySelector('span.selected-search-text')?.scrollIntoView({ behavior: 'smooth' })
        }, 500)
      } else {
        const highlightedNode =
          (tableRef?.current as any)?.querySelector('span.selected-search-text') ||
          (tableRef?.current as any)?.querySelector('div.selected-search-text')

        highlightedNode?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [searchIndex, openNestedPath, searchText])
  return (
    <Formik initialValues={initialValues} onSubmit={data => onUpdate?.(data)} validate={debouncedUpdate}>
      {({ values, setFieldValue }) => (
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
              <div className={cx(css.customVariables, className)} id={domId} ref={tableRef as any}>
                <AddEditCustomVariable
                  addNewVariable={handleAdd}
                  updateVariable={handleUpdate}
                  selectedVariable={selectedVariable}
                  setSelectedVariable={setSelectedVariable}
                  existingVariables={values.variables}
                  formName={formName}
                />
                {values.canAddVariable ? (
                  <div className={css.headerRow}>
                    {heading ? heading : <div />}
                    <Button
                      className="add-variable"
                      variation={ButtonVariation.LINK}
                      icon="plus"
                      onClick={addNew}
                      size={ButtonSize.SMALL}
                      disabled={readonly}
                    >
                      <String stringID="common.addVariable" />
                    </Button>
                  </div>
                ) : /* istanbul ignore next */ null}
                {props.showHeaders && values.variables.length > 0 ? (
                  <section className={css.subHeader}>
                    <String stringID="variableLabel" />
                    <String stringID="valueLabel" />
                  </section>
                ) : /* istanbul ignore next */ null}
                {values.variables.map?.((variable, index) => {
                  // generated uuid if they are not present
                  if (!uids.current[index]) {
                    uids.current[index] = uuid()
                  }
                  const key = uids.current[index]
                  const yamlData = yamlProperties?.[index]
                  const hasSameMetaPath = searchedEntity.path === `${updatedPath}[${index}].value`
                  const searchedEntityType = searchedEntity.type || null

                  const isValidValueMatch = `${variable?.value}`
                    ?.toLowerCase()
                    ?.includes(searchText?.toLowerCase() || '')

                  return (
                    <div
                      key={key}
                      className={cx(
                        css.variableListTable,
                        'variable-list-row',
                        hoveredVariable[index] ? css.hoveredRow : ''
                      )}
                      onMouseLeave={() => setHoveredVariable({ [index]: false })}
                    >
                      {hoveredVariable[index] ? (
                        <TextInputWithCopyBtn
                          name={`variables[${index}].name`}
                          label=""
                          disabled={readonly}
                          localName={yamlData?.localName}
                          fullName={yamlData?.fqn}
                          outerClassName={css.copyTextRow}
                          textInputClassName={css.copyTextInput}
                          popoverWrapperClassName={css.copyTextPopoverWrapper}
                        />
                      ) : (
                        <Text
                          className={cx(css.variableNameCell)}
                          lineClamp={1}
                          onMouseOver={() => {
                            setHoveredVariable({ [index]: true })
                          }}
                        >
                          <span
                            className={cx({
                              [css.selectedSearchTextValueRow]: searchedEntityType === 'key' && hasSameMetaPath,
                              'selected-search-text': searchedEntityType === 'key' && hasSameMetaPath
                            })}
                            dangerouslySetInnerHTML={{
                              __html: getTextWithSearchMarkers({
                                searchText: escape(searchText),
                                txt: escape(variable.name)
                              })
                            }}
                          />
                        </Text>
                      )}
                      <div
                        className={cx(css.valueRow, {
                          [css.selectedSearchTextValueRow]: searchText?.length && isValidValueMatch,
                          'selected-search-text': searchedEntityType === 'value' && hasSameMetaPath
                        })}
                      >
                        <div>
                          {variable.type === VariableType.Secret ? (
                            <MultiTypeSecretInput
                              small
                              name={`variables[${index}].value`}
                              label=""
                              disabled={readonly}
                            />
                          ) : (
                            <FormInput.MultiTextInput
                              className="variableInput"
                              name={`variables[${index}].value`}
                              label=""
                              disabled={readonly}
                              multiTextInputProps={{
                                mini: true,
                                defaultValueToReset: '',
                                expressions,
                                width: 264,
                                btnClassName:
                                  getMultiTypeFromValue(variable.value as string) === MultiTypeInputType.RUNTIME
                                    ? css.runtimeInputButton
                                    : '',
                                textProps: {
                                  disabled: !initialValues.canAddVariable || readonly,
                                  type: variable.type === VariableType.Number ? 'number' : 'text'
                                },
                                allowableTypes
                              }}
                              data-testid="variables-test"
                            />
                          )}
                        </div>
                        <div className={css.actionButtons}>
                          {getMultiTypeFromValue(variable.value as string) === MultiTypeInputType.RUNTIME && (
                            <div className={cx(css.configureButton)}>
                              <ConfigureOptions
                                value={variable.value as string}
                                defaultValue={variable.default}
                                type={variable.type || /* istanbul ignore next */ 'String'}
                                variableName={variable.name || /* istanbul ignore next */ ''}
                                hideExecutionTimeField={hideExecutionTimeField}
                                onChange={(value, defaultValue) => {
                                  setFieldValue(`variables[${index}].value`, value)
                                  setFieldValue(
                                    `variables[${index}].default`,
                                    NG_EXECUTION_INPUT ? undefined : defaultValue
                                  )
                                }}
                                isReadonly={readonly}
                              />
                            </div>
                          )}

                          <div>
                            {initialValues.canAddVariable && (
                              <Button
                                variation={ButtonVariation.ICON}
                                iconProps={{ size: 18 }} //color: '#6B6D85' }}
                                withoutCurrentColor
                                icon="Edit"
                                className={css.buttonsActions}
                                tooltip={<String className={css.tooltip} stringID="common.editVariable" />}
                                data-testid={`edit-variable-${index}`}
                                disabled={readonly}
                                tooltipProps={{ isDark: true }}
                                onClick={() => {
                                  setSelectedVariable({ variable, index })
                                }}
                              />
                            )}
                          </div>
                          <div>
                            {initialValues.canAddVariable && (
                              <Button
                                variation={ButtonVariation.ICON}
                                iconProps={{ size: 16, color: '#6B6D85' }}
                                withoutCurrentColor
                                icon="main-trash"
                                className={css.buttonsActions}
                                data-testid={`delete-variable-${index}`}
                                tooltip={<String className={css.tooltip} stringID="common.removeThisVariable" />}
                                tooltipProps={{ isDark: true }}
                                disabled={readonly}
                                onClick={() => handleRemove(index)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }}
        </FieldArray>
      )}
    </Formik>
  )
}
