/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { formatCount } from '@common/utils/utils'

describe('Test common/utils.ts', () => {
  test('Test formatCount method', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(1)).toBe('1')
    expect(formatCount(500)).toBe('500')
    expect(formatCount(999)).toBe('999')
    expect(formatCount(1000)).toBe('1k')
    expect(formatCount(1999)).toBe('2k')
    expect(formatCount(3400)).toBe('3k')
    expect(formatCount(3600)).toBe('4k')
    expect(formatCount(9999)).toBe('10k')
    expect(formatCount(99999)).toBe('100k')
    expect(formatCount(888888)).toBe('889k')
    expect(formatCount(999999)).toBe('1M')
    expect(formatCount(1000001)).toBe('1M')
    expect(formatCount(1200000)).toBe('1M')
    expect(formatCount(1999999)).toBe('2M')
    expect(formatCount(1600000)).toBe('2M')
  })
})
