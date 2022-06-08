/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { fireEvent, queryByAttribute, waitFor, queryByText } from '@testing-library/react'
import { find } from 'lodash-es'

export enum InputTypes {
  CHECKBOX = 'CHECKBOX',
  RADIOS = 'RADIOS',
  TEXTFIELD = 'TEXTFIELD',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  TEXTAREA = 'TEXTAREA'
}
interface FormInputValues {
  container: HTMLElement
  type: InputTypes
  fieldId: string
  value?: string | boolean
  multiSelectValues?: string[] // string[] for multi SELECT
}

export const setFieldValue = async ({ container, type, fieldId, value }: FormInputValues): Promise<boolean> => {
  switch (type) {
    case InputTypes.TEXTAREA: {
      if (!value) {
        throw new Error(`A value is needed to fill ${fieldId}`)
      }
      const input = queryByAttribute('name', container, fieldId as string)
      expect(input).toBeTruthy()
      if (input) fireEvent.change(input, { target: { value: value } })
      break
    }
    case InputTypes.SELECT: {
      if (!value) {
        throw new Error(`A value is needed to fill ${fieldId}`)
      }
      const selectCaret = document.body
        .querySelector(`[name="${fieldId}"] + [class*="bp3-input-action"]`)
        ?.querySelector('[data-icon="chevron-down"]')

      expect(selectCaret).toBeTruthy()
      if (selectCaret) {
        fireEvent.click(selectCaret)
        const options = document.querySelectorAll('[class*="menuItem"]')
        const targetIndex = Object.values(options || {}).findIndex(option => find(option, ['key', value]))

        if (targetIndex) {
          fireEvent.click(options[targetIndex])
          await waitFor(() =>
            expect(queryByAttribute('name', container, fieldId as string)?.getAttribute('value'))?.toEqual(value)
          )
        }
      }
      break
    }
    case InputTypes.TEXTFIELD: {
      if (!value && value !== '') {
        throw new Error(`A value is needed to fill ${fieldId}`)
      }
      const input = queryByAttribute('name', container, fieldId as string)
      expect(input).toBeTruthy()
      if (input) fireEvent.change(input, { target: { value: value } })
      break
    }
    case InputTypes.RADIOS: {
      const input = container.querySelector(`[name*="${fieldId}"][value*="${value}"]`)
      expect(input).toBeTruthy()
      if (input) fireEvent.click(input)
      break
    }
    case InputTypes.CHECKBOX: {
      const input = queryByAttribute('name', container, fieldId as string)
      expect(input).toBeTruthy()
      if (input) fireEvent.click(input)
      break
    }
    default:
      break
  }
  return true
}

export const fillAtForm = async (formInput: FormInputValues[]): Promise<void> => {
  formInput.map(input => {
    setFieldValue(input)
  })
}

export const clickSubmit = (container: HTMLElement): void => {
  const target = container.querySelector('button[type="submit"]')
  expect(target).toBeDefined()
  if (target) fireEvent.click(target)
}

export const clickBack = (container: HTMLElement): void => {
  const target = queryByText(container, 'Back')
  expect(target).toBeDefined()
  if (target) fireEvent.click(target)
}
