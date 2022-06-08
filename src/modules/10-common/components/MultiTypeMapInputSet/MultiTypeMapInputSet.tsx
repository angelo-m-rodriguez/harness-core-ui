/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import cx from 'classnames'
import {
  Text,
  TextInput,
  MultiTextInput,
  Button,
  getMultiTypeFromValue,
  MultiTypeInputType,
  MultiTextInputProps,
  RUNTIME_INPUT_VALUE
} from '@wings-software/uicore'
import { Intent, FontVariation } from '@harness/design-system'
import { connect, FormikContextType } from 'formik'
import { get, isEmpty, isEqual } from 'lodash-es'
import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector, {
  MultiTypeFieldSelectorProps
} from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import css from './MultiTypeMapInputSet.module.scss'

export type MapType = { [key: string]: string }
export type MultiTypeMapType = MapType | string

export type MapUIType = { id: string; key: string; value: string }[]
export type MultiTypeUIMapType = MapUIType | string

interface MultiTypeMapConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface MultiTypeMapProps {
  name: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  valueMultiTextInputProps?: Omit<MultiTextInputProps, 'name'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeMapConfigureOptionsProps
  formik?: FormikContextType<any>
  style?: React.CSSProperties
  cardStyle?: React.CSSProperties
  disabled?: boolean
  keyLabel?: string
  valueLabel?: string
  appearance?: 'default' | 'minimal'
  restrictToSingleEntry?: boolean
}

function generateNewValue(): { id: string; key: string; value: string } {
  return { id: uuid('', nameSpace()), key: '', value: '' }
}

export const MultiTypeMapInputSet = (props: MultiTypeMapProps): React.ReactElement => {
  const {
    name,
    multiTypeFieldSelectorProps,
    valueMultiTextInputProps = {},
    enableConfigureOptions = true,
    configureOptionsProps,
    cardStyle,
    formik,
    disabled,
    appearance = 'default',
    restrictToSingleEntry,
    ...restProps
  } = props

  const formikFieldValues = useMemo(() => {
    return get(formik?.values, name, '')
  }, [formik?.values, name])

  const [value, setValue] = React.useState<MapUIType>(() => {
    let initialValue = formikFieldValues
    if (initialValue === RUNTIME_INPUT_VALUE) {
      initialValue = []
    }
    const initialValueInCorrectFormat = Object.keys(initialValue || {}).map(key => ({
      id: uuid('', nameSpace()),
      key: key,
      value: initialValue[key]
    }))

    // Adding a default value
    if (Array.isArray(initialValueInCorrectFormat) && initialValueInCorrectFormat.length === 0) {
      initialValueInCorrectFormat.push(generateNewValue())
    }

    return initialValueInCorrectFormat as MapUIType
  })

  const { getString } = useStrings()

  const error = get(formik?.errors, name, '')
  const touched = get(formik?.touched, name)
  const hasSubmitted = get(formik, 'submitCount', 0) > 0

  const addValue = (): void => {
    setValue(currentValue => [...currentValue, generateNewValue()])
  }

  const removeValue = (index: number): void => {
    setValue(currentValue => {
      const newCurrentValue = [...currentValue]
      newCurrentValue.splice(index, 1)
      return newCurrentValue
    })
  }

  const changeValue = (index: number, key: 'key' | 'value', newValue: string): void => {
    formik?.setFieldTouched(name, true)
    setValue(currentValue => {
      const newCurrentValue = [...currentValue]
      newCurrentValue[index][key] = newValue
      return newCurrentValue
    })
  }

  React.useEffect(() => {
    let initialValue = formikFieldValues
    if (initialValue === RUNTIME_INPUT_VALUE) {
      initialValue = []
    }
    const valueWithoutEmptyItems = value.filter(item => !!item.value)

    if (isEmpty(valueWithoutEmptyItems) && initialValue) {
      const initialValueInCorrectFormat = Object.keys(initialValue || {}).map(key => ({
        id: uuid('', nameSpace()),
        key: key,
        value: initialValue[key]
      }))

      // Adding a default value
      if (Array.isArray(initialValueInCorrectFormat) && initialValueInCorrectFormat.length === 0) {
        initialValueInCorrectFormat.push(generateNewValue())
      }

      setValue(initialValueInCorrectFormat)
    }
  }, [formik?.values, name])

  React.useEffect(() => {
    const valueInCorrectFormat: MapType = {}
    if (Array.isArray(value)) {
      value.forEach(mapValue => {
        if (mapValue.key) {
          valueInCorrectFormat[mapValue.key] = mapValue.value
        }
      })
    }

    if (formikFieldValues !== RUNTIME_INPUT_VALUE) {
      if (isEmpty(valueInCorrectFormat)) {
        formik?.setFieldValue(name, undefined)
      } else if (!isEqual(formikFieldValues, valueInCorrectFormat)) {
        formik?.setFieldValue(name, valueInCorrectFormat)
      }
    } else if (!isEmpty(valueInCorrectFormat) && !isEqual(formikFieldValues, valueInCorrectFormat)) {
      formik?.setFieldValue(name, valueInCorrectFormat)
    }
  }, [name, value, formik?.setFieldValue])

  return (
    <div className={cx(css.group, css.withoutSpacing, appearance === 'minimal' ? css.minimalCard : '')} {...restProps}>
      <MultiTypeFieldSelector
        name={name}
        defaultValueToReset={[{ id: uuid('', nameSpace()), key: '', value: '' }]}
        style={{ flexGrow: 1, marginBottom: 0 }}
        {...multiTypeFieldSelectorProps}
        disableTypeSelection={multiTypeFieldSelectorProps.disableTypeSelection || disabled}
      >
        <>
          {value.map(({ id, key, value: valueValue }, index: number) => {
            const keyError = get(error, `[${index}].key`)
            // const valueError = get(error, `[${index}].value`)

            return (
              <div className={cx(css.group, css.withoutAligning)} key={id}>
                <div>
                  {index === 0 && (
                    <Text margin={{ bottom: 'xsmall' }} font={{ variation: FontVariation.FORM_LABEL }}>
                      {props.keyLabel || getString('keyLabel')}
                    </Text>
                  )}
                  <TextInput
                    name={`${name}[${index}].key`}
                    value={key}
                    intent={(touched || hasSubmitted) && error ? Intent.DANGER : Intent.NONE}
                    errorText={(touched || hasSubmitted) && keyError ? keyError : undefined}
                    disabled={disabled}
                    onChange={e => changeValue(index, 'key', (e.currentTarget as HTMLInputElement).value)}
                    data-testid={`key-${name}-[${index}]`}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <Text margin={{ bottom: 'xsmall' }} font={{ variation: FontVariation.FORM_LABEL }}>
                      {props.valueLabel || getString('valueLabel')}
                    </Text>
                  )}
                  <div className={cx(css.group, css.withoutAligning, css.withoutSpacing)}>
                    <MultiTextInput
                      name=""
                      textProps={{ name: `${name}[${index}].value` }}
                      value={valueValue}
                      intent={(touched || hasSubmitted) && error ? Intent.DANGER : Intent.NONE}
                      disabled={disabled}
                      onChange={v => changeValue(index, 'value', v as any)}
                      data-testid={`value-${name}-[${index}]`}
                      allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
                      {...valueMultiTextInputProps}
                      style={{ flexShrink: 1 }}
                    />
                    {!disabled && (
                      <Button
                        icon="main-trash"
                        iconProps={{ size: 20 }}
                        minimal
                        data-testid={`remove-${name}-[${index}]`}
                        onClick={() => removeValue(index)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {(restrictToSingleEntry && Array.isArray(value) && value?.length === 1) || disabled ? null : (
            <Button
              intent="primary"
              minimal
              text={getString('plusAdd')}
              data-testid={`add-${name}`}
              onClick={addValue}
              style={{ padding: 0 }}
            />
          )}
        </>
      </MultiTypeFieldSelector>
      {enableConfigureOptions &&
        typeof value === 'string' &&
        getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 2 }}
            value={value}
            type={getString('map')}
            variableName={name}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={val => formik?.setFieldValue(name, val)}
            {...configureOptionsProps}
            isReadonly={props.disabled}
          />
        )}
    </div>
  )
}

export default connect(MultiTypeMapInputSet)
