/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty } from 'lodash-es'
import * as Yup from 'yup'
import { EXECUTION_TIME_INPUT_VALUE, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { StringKeys } from 'framework/strings'

export enum Validation {
  None = 'None',
  AllowedValues = 'AllowedValues',
  Regex = 'Regex'
}

export interface FormValues {
  isRequired?: boolean
  defaultValue?: string | number
  allowedValues: string[]
  regExValues: string
  validation: Validation
  isAdvanced: boolean
  advancedValue: string
  isExecutionInput?: boolean
}

export interface ValidationSchemaReturnType {
  validation: Yup.StringSchema<string>
  regExValues: Yup.StringSchema<string | undefined>
  defaultValue: Yup.StringSchema<string | undefined>
  isAdvanced: Yup.BooleanSchema<boolean | undefined>
  advancedValue: Yup.StringSchema<string | undefined>
  allowedValues: Yup.NotRequiredArraySchema<string | undefined>
}

export const ValidationSchema = (
  getString: (key: StringKeys, vars?: Record<string, any>) => string
): ValidationSchemaReturnType => {
  return {
    validation: Yup.string().required(),
    regExValues: Yup.string().when('validation', {
      is: Validation.Regex,
      then: Yup.string()
        .trim()
        .test({
          test(val: string): boolean | Yup.ValidationError {
            if (isEmpty(val)) {
              return this.createError({
                message: getString('common.configureOptions.validationErrors.regExIsRequired')
              })
            }
            let isValid = true
            try {
              val?.length > 0 && new RegExp(val)
            } catch (_e) {
              isValid = false
            }
            if (!isValid) {
              return this.createError({
                message: getString('common.configureOptions.validationErrors.regExNotValid')
              })
            }
            return true
          }
        })
    }),
    defaultValue: Yup.string()
      .trim()
      .when('validation', {
        is: Validation.Regex,
        then: Yup.string()
          .trim()
          .test({
            test(val: string): boolean | Yup.ValidationError {
              if (!isEmpty(this.parent.regExValues) && val?.length > 0 && !this.parent.isAdvanced) {
                try {
                  const reg = new RegExp(this.parent.regExValues)
                  if (!reg.test(val)) {
                    return this.createError({
                      message: getString('common.configureOptions.validationErrors.defaultRegExValid')
                    })
                  }
                } catch (_e) {
                  // Do nothing
                }
              }
              return true
            }
          })
      })
      .when('validation', {
        is: Validation.AllowedValues,
        then: Yup.string()
          .trim()
          .test({
            test(val: string): boolean | Yup.ValidationError {
              if (
                this.parent.allowedValues?.length > 0 &&
                !isEmpty(val) &&
                this.parent.allowedValues.indexOf(val) === -1
              ) {
                return this.createError({
                  message: getString('common.configureOptions.validationErrors.defaultAllowedValid')
                })
              }
              return true
            }
          })
      }),
    isAdvanced: Yup.boolean(),
    advancedValue: Yup.string().when(['validation', 'isAdvanced'], {
      is: (validation: Validation, isAdv: boolean) => validation === Validation.AllowedValues && isAdv,
      then: Yup.string().required(getString('common.configureOptions.validationErrors.jexlExpressionRequired'))
    }),
    allowedValues: Yup.array(Yup.string()).when(['validation', 'isAdvanced'], {
      is: (validation: Validation, isAdv: boolean) => validation === Validation.AllowedValues && !isAdv,
      then: Yup.array(Yup.string()).min(1, getString('common.configureOptions.validationErrors.minOneAllowedValue'))
    })
  }
}

export enum InpuSetFunction {
  ALLOWED_VALUES = 'allowedValues',
  EXECUTION_INPUT = 'executionInput',
  REGEX = 'regex'
}

export interface InpuSetFunctionMatcher {
  name: InpuSetFunction
  hasParameters: boolean
}

export function getInputExpressionRegExp(): RegExp {
  const functionNames = Object.values(InpuSetFunction).join('|')

  return new RegExp(`^<\\+input>(?:(\\.(${functionNames})\\((.*?)\\))*)$`, 'g')
}

export const JEXL_REGEXP = /jexl\((.*?)\)/
export const JEXL = 'jexl'

export interface ParsedInput {
  [InpuSetFunction.ALLOWED_VALUES]: {
    values: string[] | null
    jexlExpression: string | null
  } | null
  [InpuSetFunction.EXECUTION_INPUT]: boolean
  [InpuSetFunction.REGEX]: string | null
}

export function parseInput(input: string): ParsedInput | null {
  const INPUT_EXPRESSION_REG_EXP = getInputExpressionRegExp()

  const match = input.match(INPUT_EXPRESSION_REG_EXP)

  if (!match) {
    return null
  }

  const fnNames = Object.values(InpuSetFunction)
  const splitRegExp = new RegExp(`\\.(?=${fnNames.join('|')})`)
  // split the string based on functions
  const splitData = input.split(splitRegExp).slice(1)

  const parsedInput: ParsedInput = {
    [InpuSetFunction.ALLOWED_VALUES]: null,
    [InpuSetFunction.EXECUTION_INPUT]: false,
    [InpuSetFunction.REGEX]: null
  }

  splitData.forEach(fn => {
    /* istanbul ignore else */
    if (fn.startsWith(InpuSetFunction.EXECUTION_INPUT)) {
      parsedInput[InpuSetFunction.EXECUTION_INPUT] = true
    } else if (fn.startsWith(InpuSetFunction.ALLOWED_VALUES)) {
      // slice the function name along with surrounding parenthesis
      const fnArgs = fn.slice(InpuSetFunction.ALLOWED_VALUES.length + 1).slice(0, -1)
      // check for JEXL expression
      const jexlMatch = fnArgs.match(JEXL_REGEXP)

      parsedInput[InpuSetFunction.ALLOWED_VALUES] = {
        values: jexlMatch ? null : fnArgs.split(','),
        jexlExpression: jexlMatch ? jexlMatch[1] : null
      }
    } else if (fn.startsWith(InpuSetFunction.REGEX)) {
      // slice the function name along with surrounding parenthesis
      const fnArgs = fn.slice(InpuSetFunction.REGEX.length + 1).slice(0, -1)

      parsedInput[InpuSetFunction.REGEX] = fnArgs
    }
  })

  return parsedInput
}

export const getInputStr = (data: FormValues): string => {
  let inputStr = RUNTIME_INPUT_VALUE

  if (data.isExecutionInput) {
    inputStr = EXECUTION_TIME_INPUT_VALUE
  }

  if (
    data.validation === Validation.AllowedValues &&
    (data.allowedValues?.length > 0 || data.advancedValue.length > 0)
  ) {
    if (data.isAdvanced) {
      inputStr += `.${InpuSetFunction.ALLOWED_VALUES}(${JEXL}(${data.advancedValue}))`
    } else {
      inputStr += `.${InpuSetFunction.ALLOWED_VALUES}(${data.allowedValues.join(',')})`
    }
  } /* istanbul ignore else */ else if (data.validation === Validation.Regex && data.regExValues?.length > 0) {
    inputStr += `.${InpuSetFunction.REGEX}(${data.regExValues})`
  }
  return inputStr
}
