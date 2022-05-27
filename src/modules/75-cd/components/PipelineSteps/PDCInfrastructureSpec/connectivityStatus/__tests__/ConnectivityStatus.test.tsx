/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { useValidateHosts } from 'services/cd-ng'
import ConnectivityStatus from '../ConnectivityStatus'
import mockData from './mockData'

const { failure, success, unknownType, failureWithErrorSummary } = mockData

const useValidateHostsMock = useValidateHosts as jest.MockedFunction<any>

jest.mock('services/cd-ng', () => ({
  useValidateHosts: jest.fn().mockImplementation(() => {
    return {
      cancel: jest.fn(),
      loading: false,
      mutate: jest.fn().mockImplementation(() => {
        return {
          status: 'SUCCESS',
          data: {}
        }
      })
    }
  }),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => {
    return {
      cancel: jest.fn(),
      loading: false,
      mutate: jest.fn().mockImplementation(() => {
        return {
          status: 'SUCCESS',
          data: { status: 'SUCCESS' }
        }
      })
    }
  })
}))

describe('connectivity status', () => {
  const setup = (data: any) =>
    render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <ConnectivityStatus {...data} />
      </TestWrapper>
    )

  test('success on click check hosts', async () => {
    const { getByText } = setup(failure)

    expect(getByText('failed')).toBeDefined()

    useValidateHostsMock.mockImplementation(() => {
      return {
        cancel: jest.fn(),
        loading: false,
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'SUCCESS',
            data: {}
          }
        })
      }
    })

    const testBtn = getByText('test')

    act(() => {
      fireEvent.click(testBtn)
    })

    expect(getByText('connectors.testInProgress')).toBeDefined()

    await waitFor(() => {
      expect(getByText('full-circle')).toBeDefined()
    })
  })

  test('fail on click check hosts', async () => {
    useValidateHostsMock.mockImplementation(() => {
      return {
        cancel: jest.fn(),
        loading: false,
        mutate: jest.fn().mockImplementation(() => {
          return {
            status: 'FAILURE',
            data: {}
          }
        })
      }
    })

    const { getByText } = setup(failure)
    const testBtn = getByText('test')

    act(() => {
      fireEvent.click(testBtn)
    })
    expect(getByText('connectors.testInProgress')).toBeDefined()

    await waitFor(() => {
      expect(getByText('warning-sign')).toBeDefined()
    })
  })

  test('throw error on click check hosts', async () => {
    useValidateHostsMock.mockImplementation(() => {
      return {
        cancel: jest.fn(),
        loading: false,
        mutate: jest.fn().mockImplementation(
          () =>
            new Promise((_resolve, reject) => {
              reject({
                data: {
                  responseMessages: [],
                  message: 'tooltip error',
                  errors: [{ code: 400, message: 'error message', reason: 'error reason' }]
                }
              })
            })
        )
      }
    })

    const { getByText } = setup(failure)

    const warningItem = getByText('warning-sign')

    act(() => {
      fireEvent.mouseOver(warningItem)
    })

    await waitFor(() => {
      expect(getByText('noDetails')).toBeDefined()
    })

    const testBtn = getByText('test')

    act(() => {
      fireEvent.click(testBtn)
    })
    expect(getByText('connectors.testInProgress')).toBeDefined()

    await waitFor(() => {
      expect(getByText('failed')).toBeDefined()
    })
  })

  test('throw error with no message on click check hosts', async () => {
    useValidateHostsMock.mockImplementation(() => {
      return {
        cancel: jest.fn(),
        loading: false,
        mutate: jest.fn().mockImplementation(
          () =>
            new Promise((_resolve, reject) => {
              reject({ message: 'error' })
            })
        )
      }
    })

    const { getByText } = setup(failure)

    const warningItem = getByText('warning-sign')

    act(() => {
      fireEvent.mouseOver(warningItem)
    })

    await waitFor(() => {
      expect(getByText('noDetails')).toBeDefined()
    })

    const testBtn = getByText('test')

    act(() => {
      fireEvent.click(testBtn)
    })
    expect(getByText('connectors.testInProgress')).toBeDefined()

    await waitFor(() => {
      expect(getByText('warning-sign')).toBeDefined()
    })
  })

  test('success render should match snapshot', async () => {
    const { getByText } = setup(success)

    await waitFor(() => {
      expect(getByText('success')).toBeDefined()
    })
  })

  test('unknown render should match snapshot', async () => {
    const { container } = setup(unknownType)

    expect(container).toMatchSnapshot()
  })

  test('click on failed message', async () => {
    const { getByText } = setup(failure)
    const warningItem = getByText('warning-sign')

    act(() => {
      fireEvent.mouseOver(warningItem)
    })

    await waitFor(() => {
      expect(getByText('noDetails')).toBeDefined()
    })

    const tooltipItem = getByText('noDetails')

    act(() => {
      fireEvent.click(tooltipItem)
    })

    await waitFor(() => {
      expect(getByText('noDetails')).toBeDefined()
    })
  })

  test('click on failed message with errorSummary', async () => {
    const { getByText } = setup(failureWithErrorSummary)

    const warningItem = getByText('warning-sign')

    act(() => {
      fireEvent.mouseOver(warningItem)
    })

    await waitFor(() => {
      expect(getByText('ErrorSummaryStatus')).toBeDefined()
    })

    const tooltipItem = getByText('ErrorSummaryStatus')

    act(() => {
      fireEvent.click(tooltipItem)
    })

    await waitFor(() => {
      expect(getByText('ErrorSummaryStatus')).toBeDefined()
    })
  })
})
