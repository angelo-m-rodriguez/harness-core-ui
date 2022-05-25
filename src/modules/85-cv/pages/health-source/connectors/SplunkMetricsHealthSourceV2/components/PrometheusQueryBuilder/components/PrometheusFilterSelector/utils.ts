/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption } from '@wings-software/uicore'

export function updateLabelOfSelectedFilter(
  selectedValue: string,
  item: MultiSelectOption,
  items: MultiSelectOption[]
): MultiSelectOption {
  const currentItem = items.find(listItem => listItem.value === item.value)
  if (currentItem) {
    const splitString = (currentItem.label as string).split(':')[0]
    return { ...currentItem, label: `${splitString}:${selectedValue}` }
  }

  return item
}

export function updateMultiSelectOption(
  newOption: MultiSelectOption,
  currentList: MultiSelectOption[]
): MultiSelectOption[] {
  if (!currentList?.length) {
    return []
  }

  const newOptionIndex = currentList.findIndex(listItem => listItem.value === newOption.value)
  if (newOptionIndex > -1) {
    currentList[newOptionIndex] = newOption
  }

  return Array.from(currentList)
}
