/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect, FormikContextType } from 'formik'
import {
  FormikTooltipContext,
  DataTooltipInterface,
  MultiTypeInputType,
  HarnessDocTooltip,
  Container
} from '@wings-software/uicore'
import { get, compact } from 'lodash-es'
import { FormGroup, IFormGroupProps, Intent } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { errorCheck } from '@common/utils/formikHelpers'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { ExpressionsListInput } from '@common/components/ExpressionsListInput/ExpressionsListInput'
import { DelegateSelectors, DelegateSelectorsProps } from '@common/components/DelegateSelectors/DelegateSelectors'

import css from './MultiTypeDelegateSelector.module.scss'

export interface MultiTypeDelegateSelectorProps extends IFormGroupProps {
  name: string
  label?: string
  expressions?: string[]
  allowableTypes?: MultiTypeInputType[]
  useExecutionTimeInput?: boolean
  tooltipProps?: DataTooltipInterface
  inputProps: Omit<DelegateSelectorsProps, 'onChange'>
}

export interface ConnectedMultiTypeDelegateSelectorProps extends MultiTypeDelegateSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikContextType<any>
}

export function MultiTypeDelegateSelector(props: ConnectedMultiTypeDelegateSelectorProps): React.ReactElement {
  const {
    formik,
    allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
    label,
    name,
    expressions = [],
    inputProps,
    useExecutionTimeInput,
    ...restProps
  } = props

  const value = get(formik.values, name)
  const hasError = errorCheck(name, formik)

  const { getString } = useStrings()

  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? get(formik.errors, name) : null,
    disabled,
    ...rest
  } = restProps

  const handleDelegateSelectorFixedValueChange = React.useCallback((tags: string[]) => {
    formik.setFieldValue(name, compact(tags))
  }, [])

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  return (
    <FormGroup
      {...rest}
      labelFor={name}
      label={label ? <HarnessDocTooltip tooltipId={dataTooltipId} labelText={label} /> : label}
      intent={intent}
      helperText={helperText}
    >
      <Container className={css.fieldSelectorContainer}>
        <MultiTypeFieldSelector
          name={name}
          label={getString('common.defineDelegateSelector')}
          defaultValueToReset={['']}
          skipRenderValueInExpressionLabel
          allowedTypes={allowableTypes}
          useExecutionTimeInput={useExecutionTimeInput}
          supportListOfExpressions={true}
          disableMultiSelectBtn={disabled}
          expressionRender={() => (
            <ExpressionsListInput name={name} value={value} readOnly={disabled} expressions={expressions} />
          )}
          style={{ flexGrow: 1, marginBottom: 0 }}
        >
          <DelegateSelectors
            {...inputProps}
            wrapperClassName={css.wrapper}
            selectedItems={value}
            readonly={disabled}
            onTagInputChange={handleDelegateSelectorFixedValueChange}
          />
        </MultiTypeFieldSelector>
      </Container>
    </FormGroup>
  )
}

export default connect<MultiTypeDelegateSelectorProps>(MultiTypeDelegateSelector)
