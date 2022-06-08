/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { parseInput } from '../ConfigureOptionsUtils'

describe('ConfigureOptionsUtils tests', () => {
  describe('parseInput tests', () => {
    describe('works with single fn', () => {
      test('handles invalid Input', () => {
        expect(parseInput('<+pipeline.foo>')).toEqual(null)
      })
      test('works with executionInput', () => {
        expect(parseInput('<+input>.executionInput()')).toEqual({
          allowedValues: null,
          executionInput: true,
          regex: null
        })
      })

      test('works with regex', () => {
        expect(parseInput('<+input>.regex(^123$)')).toEqual({
          allowedValues: null,
          executionInput: false,
          regex: '^123$'
        })

        expect(parseInput('<+input>.regex(^(123)*$)')).toEqual({
          allowedValues: null,
          executionInput: false,
          regex: '^(123)*$'
        })
      })

      test('works with allowedValues - simple', () => {
        expect(parseInput('<+input>.allowedValues(1,2,3)')).toEqual({
          allowedValues: { values: ['1', '2', '3'], jexlExpression: null },
          executionInput: false,
          regex: null
        })
      })

      test('works with allowedValues - jexl', () => {
        expect(parseInput('<+input>.allowedValues(jexl(${env.type} == “prod” ? aws1, aws2 : aws3, aws4))')).toEqual({
          allowedValues: {
            values: null,
            jexlExpression: '${env.type} == “prod” ? aws1, aws2 : aws3, aws4'
          },
          executionInput: false,
          regex: null
        })
      })
    })

    test('works with multiple fns', () => {
      expect(parseInput('<+input>.executionInput().allowedValues(1,2,3)')).toEqual({
        allowedValues: { values: ['1', '2', '3'], jexlExpression: null },
        executionInput: true,
        regex: null
      })

      expect(parseInput('<+input>.allowedValues(1,2,3).executionInput()')).toEqual({
        allowedValues: { values: ['1', '2', '3'], jexlExpression: null },
        executionInput: true,
        regex: null
      })

      expect(parseInput('<+input>.regex(^abc$).executionInput()')).toEqual({
        allowedValues: null,
        executionInput: true,
        regex: '^abc$'
      })

      expect(parseInput('<+input>.executionInput().regex(^(abc)+$)')).toEqual({
        allowedValues: null,
        executionInput: true,
        regex: '^(abc)+$'
      })
    })
  })
})
