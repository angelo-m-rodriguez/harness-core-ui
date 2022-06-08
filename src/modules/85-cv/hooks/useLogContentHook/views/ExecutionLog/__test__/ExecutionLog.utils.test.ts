/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { convertLogDataToLogLineData } from '../ExecutionLog.utils'

describe('Utils', () => {
  test('convertLogDataToLogLineData - default/INFO', () => {
    const logData = {
      text: { logLevel: 'INFO', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    }

    expect(convertLogDataToLogLineData(logData)).toEqual({
      text: { logLevel: 'INFO', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    })
  })

  test('convertLogDataToLogLineData - WARN', () => {
    const logData = {
      text: { logLevel: 'WARN', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    }

    expect(convertLogDataToLogLineData(logData)).toEqual({
      text: {
        logLevel: 'WARN',
        createdAt: '3/16/2022 8:23:10 AM',
        log: '\u001b[1;33m\u001b[40mLearning engine task status: SUCCESS\u001b[0m'
      },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    })
  })

  test('convertLogDataToLogLineData - ERROR', () => {
    const logData = {
      text: { logLevel: 'ERROR', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    }

    expect(convertLogDataToLogLineData(logData)).toEqual({
      text: {
        logLevel: '\u001b[1;31m\u001b[40mERROR\u001b[0m',
        createdAt: '3/16/2022 8:23:10 AM',
        log: '\u001b[1;31m\u001b[40mLearning engine task status: SUCCESS\u001b[0m'
      },
      searchIndices: { logLevel: [0], createdAt: [1], log: [2] }
    })
  })

  test('convertLogDataToLogLineData - default/INFO - without searchIndices', () => {
    const logData = {
      text: { logLevel: 'INFO', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' }
    }

    expect(convertLogDataToLogLineData(logData)).toEqual({
      text: { logLevel: 'INFO', createdAt: '3/16/2022 8:23:10 AM', log: 'Learning engine task status: SUCCESS' }
    })
  })
})
