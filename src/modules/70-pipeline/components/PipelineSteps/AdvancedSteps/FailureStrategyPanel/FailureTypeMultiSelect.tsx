/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormGroup, Menu, Intent, Checkbox } from '@blueprintjs/core'
import { MultiSelect as BPMultiSelect, ItemRenderer } from '@blueprintjs/select'
import { connect, FormikContextType } from 'formik'
import { get } from 'lodash-es'

import { errorCheck } from '@common/utils/formikHelpers'
import { useStrings } from 'framework/strings'
import type { StringKeys } from 'framework/strings'
import { FailureErrorType, ErrorType } from '@pipeline/utils/FailureStrategyUtils'
import type { StageType } from '@pipeline/utils/stageHelpers'

import { errorTypesForStages } from './StrategySelection/StrategyConfig'
import css from './FailureStrategyPanel.module.scss'

interface Option {
  label: string
  value: FailureErrorType
}

const stringsMap: Record<FailureErrorType, StringKeys> = {
  AllErrors: 'common.allErrors',
  Unknown: 'pipeline.failureStrategies.errorTypeLabels.Unknown',
  Authentication: 'pipeline.failureStrategies.errorTypeLabels.Authentication',
  Authorization: 'pipeline.failureStrategies.errorTypeLabels.Authorization',
  Connectivity: 'common.connectivityErrors',
  DelegateProvisioning: 'pipeline.failureStrategies.errorTypeLabels.DelegateProvisioning',
  Timeout: 'pipeline.failureStrategies.errorTypeLabels.Timeout',
  Verification: 'pipeline.failureStrategies.errorTypeLabels.Verification',
  PolicyEvaluationFailure: 'pipeline.failureStrategies.errorTypeLabels.PolicyEvaluationFailure'
}

const MultiSelect = BPMultiSelect.ofType<Option>()

const itemRenderer: ItemRenderer<Option> = (item, itemProps) => {
  return <Menu.Item key={item.value} onClick={itemProps.handleClick} text={item.label} />
}

const tagRenderer = (item: Option): string => {
  /* istanbul ignore next */
  return item?.label
}

export interface FailureTypeMultiSelectProps {
  label: string
  name: string
  filterTypes?: FailureErrorType[]
  stageType: StageType
  disabled?: boolean
}

export interface ConnectedFailureTypeMultiSelectProps extends FailureTypeMultiSelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikContextType<any>
}

export function FailureTypeMultiSelect(props: ConnectedFailureTypeMultiSelectProps): React.ReactElement {
  const { name, label, formik, stageType, filterTypes, disabled } = props
  const { getString } = useStrings()

  const hasError = errorCheck(name, formik)
  const intent = hasError ? Intent.DANGER : Intent.NONE
  const helperText = hasError ? get(formik?.errors, name) : null
  const selectedValues: FailureErrorType[] = get(formik.values, name) || []

  // remove 'AllErrors' from selected values as we don't want to show it inside the multislect component
  const filteredValues = selectedValues.filter(val => val !== ErrorType.AllErrors)
  const selectedValuesSet = new Set<FailureErrorType>(filteredValues)
  const hasAllErrors = selectedValues.includes(ErrorType.AllErrors)

  const options: Option[] = (() => {
    const filterTypesSet = new Set(filterTypes || /* istanbul ignore next */ [])
    const errorTypes = errorTypesForStages[stageType]

    // remove already selected values and "AllErrors" from options
    return errorTypes
      .filter(e => !filterTypesSet.has(e) && e !== ErrorType.AllErrors)
      .map(e => ({ value: e, label: getString(stringsMap[e]) }))
  })()

  function handleItemSelect(item: Option): void {
    formik.setFieldValue(name, [...selectedValues, item.value])
    formik.setFieldTouched(name, true)
  }

  // list of options to show
  function itemListPredicate(query: string, listItems: Option[]): Option[] {
    return listItems.filter(item => {
      if (selectedValuesSet.has(item.value)) {
        return false
      }

      if (query) {
        return item.value.trim().toLowerCase().startsWith(query.trim().toLowerCase())
      }

      return true
    })
  }

  // selected options to show
  const selectedOptions: Option[] = filteredValues.map((key: FailureErrorType) => ({
    value: key,
    label: getString(stringsMap[key])
  }))

  // when x is clicked on an option
  function onRemove(value: string): void {
    const newItems = selectedOptions.filter(item => item.label !== value).map(item => item.value)
    formik.setFieldValue(name, newItems)
    formik.setFieldTouched(name, true)
  }

  // handler for AllErrors checkbox
  function handleAllErrorsChanges(e: React.ChangeEvent<HTMLInputElement>): void {
    const { checked } = e.target

    formik.setFieldValue(name, checked ? [ErrorType.AllErrors] : [])
    formik.setFieldTouched(name, true)
  }

  return (
    <FormGroup label={label} labelFor={name} helperText={helperText} intent={intent} className={css.failureSelect}>
      <div className={css.selectWrapper}>
        <MultiSelect
          className={css.errorSelect}
          selectedItems={selectedOptions}
          itemListPredicate={itemListPredicate}
          onItemSelect={handleItemSelect}
          items={options}
          fill
          popoverProps={{ minimal: true }}
          itemRenderer={itemRenderer}
          tagRenderer={tagRenderer}
          placeholder={getString('pipeline.failureTypetext')}
          tagInputProps={{
            onRemove,
            tagProps: { className: css.tag },
            inputProps: { name },
            disabled: disabled || hasAllErrors
          }}
          itemsEqual="value"
          resetOnSelect
        />
        <Checkbox
          name={name}
          disabled={disabled}
          value={ErrorType.AllErrors}
          checked={hasAllErrors}
          label={getString(stringsMap.AllErrors)}
          onChange={handleAllErrorsChanges}
        />
      </div>
    </FormGroup>
  )
}

export default connect<FailureTypeMultiSelectProps>(FailureTypeMultiSelect)
