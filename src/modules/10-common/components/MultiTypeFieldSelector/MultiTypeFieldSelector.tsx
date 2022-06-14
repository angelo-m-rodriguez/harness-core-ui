/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { CSSProperties, ReactChild } from 'react'
import {
  MultiTypeInputType,
  getMultiTypeFromValue,
  RUNTIME_INPUT_VALUE,
  FormError,
  FormikTooltipContext,
  DataTooltipInterface,
  HarnessDocTooltip,
  FormInput,
  EXECUTION_TIME_INPUT_VALUE
} from '@wings-software/uicore'
import { IFormGroupProps, Intent, FormGroup } from '@blueprintjs/core'
import { FormikContextType, connect } from 'formik'
import { get } from 'lodash-es'
import { errorCheck } from '@common/utils/formikHelpers'
import MultiTypeSelectorButton from '../MultiTypeSelectorButton/MultiTypeSelectorButton'

import css from './MultiTypeFieldSelctor.module.scss'

export interface MultiTypeFieldSelectorProps extends Omit<IFormGroupProps, 'label' | 'placeholder'> {
  children: Exclude<React.ReactNode, null | undefined>
  name: string
  label: string | ReactChild
  defaultValueToReset?: unknown
  style?: CSSProperties
  disableTypeSelection?: boolean
  skipRenderValueInExpressionLabel?: boolean
  expressionRender?(): React.ReactNode
  allowedTypes?: MultiTypeInputType[]
  useExecutionTimeInput?: boolean
  isOptional?: boolean
  optionalLabel?: string
  tooltipProps?: DataTooltipInterface
  disableMultiSelectBtn?: boolean
  onTypeChange?: (type: MultiTypeInputType) => void
  hideError?: boolean
  supportListOfExpressions?: boolean
}

export interface ConnectedMultiTypeFieldSelectorProps extends MultiTypeFieldSelectorProps {
  formik: FormikContextType<any>
}

export function MultiTypeFieldSelector(props: ConnectedMultiTypeFieldSelectorProps): React.ReactElement | null {
  const {
    formik,
    label,
    name,
    children,
    defaultValueToReset,
    disableTypeSelection,
    allowedTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
    expressionRender,
    skipRenderValueInExpressionLabel,
    isOptional,
    disableMultiSelectBtn,
    hideError,
    optionalLabel = '(optional)',
    onTypeChange,
    supportListOfExpressions,
    useExecutionTimeInput,
    ...restProps
  } = props
  const error = get(formik?.errors, name)
  const hasError = errorCheck(name, formik) && typeof error === 'string'
  const showError = hasError && !hideError
  const labelText = !isOptional ? label : `${label} ${optionalLabel}`
  const {
    intent = showError ? Intent.DANGER : Intent.NONE,
    helperText = showError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const value: string = get(formik?.values, name, '')

  const [type, setType] = React.useState(getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions))

  function handleChange(newType: MultiTypeInputType): void {
    setType(newType)
    onTypeChange?.(newType)

    if (newType === type) {
      return
    }

    const runtimeValue = useExecutionTimeInput ? EXECUTION_TIME_INPUT_VALUE : RUNTIME_INPUT_VALUE
    formik.setFieldValue(name, newType === MultiTypeInputType.RUNTIME ? runtimeValue : defaultValueToReset)
  }

  if (
    type === MultiTypeInputType.RUNTIME &&
    getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions) !== MultiTypeInputType.RUNTIME
  ) {
    return null
  }

  return (
    <FormGroup
      {...rest}
      className={type === MultiTypeInputType.RUNTIME ? css.formGroup : ''}
      labelFor={name}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
      label={
        <div className={css.formLabel}>
          <HarnessDocTooltip tooltipId={dataTooltipId} labelText={labelText} />
          {disableTypeSelection ? null : (
            <MultiTypeSelectorButton
              allowedTypes={allowedTypes}
              type={type}
              onChange={handleChange}
              disabled={disableMultiSelectBtn}
            />
          )}
        </div>
      }
    >
      {disableTypeSelection || type === MultiTypeInputType.FIXED ? (
        children
      ) : type === MultiTypeInputType.EXPRESSION && typeof expressionRender === 'function' ? (
        expressionRender()
      ) : type === MultiTypeInputType.RUNTIME && typeof value === 'string' ? (
        <FormInput.Text className={css.runtimeDisabled} name={name} disabled label="" />
      ) : null}
    </FormGroup>
  )
}

export default connect<MultiTypeFieldSelectorProps>(MultiTypeFieldSelector)
