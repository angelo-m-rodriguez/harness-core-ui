/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption } from '@harness/uicore'
import { omit } from 'lodash-es'
import type { AnomalyFilterProperties } from 'services/ce'
import type { AnomaliesFilterFormType } from './FilterDrawer'

const getMultiSelectOptions = (values: string[]): MultiSelectOption[] =>
  values.map(item => ({ label: item, value: item }))

const getValueFromOption = (values: MultiSelectOption[]): string[] => values.map(item => item.value.toString())

export const getAnomalyFormValuesFromFilterProperties = (
  filterProperties: AnomalyFilterProperties
): AnomaliesFilterFormType => {
  const formValues: AnomaliesFilterFormType = {}

  Object.entries(omit(filterProperties, 'filterType')).forEach(([key, value]) => {
    if (value) {
      if (key === 'minActualAmount' || key === 'minAnomalousSpend') {
        formValues[key] = +value
      } else {
        ;(formValues as any)[key] = getMultiSelectOptions(value as string[])
      }
    }
  })

  return formValues
}

export const getAnomalyFilterPropertiesFromForm = (formData: AnomaliesFilterFormType): AnomalyFilterProperties => {
  const filterProperties: AnomalyFilterProperties = { filterType: 'Anomaly' }

  Object.entries(formData).forEach(([key, value]) => {
    if (key === 'minActualAmount' || key === 'minAnomalousSpend') {
      filterProperties[key] = +value
    } else {
      ;(filterProperties as any)[key] = getValueFromOption(value)
    }
  })

  return filterProperties
}
