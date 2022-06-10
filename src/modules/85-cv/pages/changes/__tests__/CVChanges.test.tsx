/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, findAllByRole, findByText, fireEvent, render, waitFor } from '@testing-library/react'
import { Container } from '@wings-software/uicore'
import * as cvService from 'services/cv'
import { TestWrapper } from '@common/utils/testUtils'
import { RiskValues } from '@cv/utils/CommonUtils'
import { mockedHealthScoreData } from '@cv/pages/monitored-service/components/ServiceHealth/__tests__/ServiceHealth.mock'
import { changeSummaryWithPositiveChange } from '@cv/pages/monitored-service/CVMonitoredService/__test__/CVMonitoredService.mock'
import Button from '@rbac/components/Button/Button'

import { mockData } from './data-mocks/ChangeEventListMock'
import { CVChanges } from '../CVChanges'

const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
})
const WrapperComponent = (): React.ReactElement => {
  const updateTime = new Date(1636428309233)
  return (
    <TestWrapper>
      <CVChanges updateTime={updateTime} />
    </TestWrapper>
  )
}

const fetchHealthScore = jest.fn()

jest.mock('highcharts-react-official', () => () => <></>)

jest.mock('@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment', () => ({
  useGetHarnessServices: () => ({
    serviceOptions: [
      { label: 'service1', value: 'service1' },
      { label: 'AppDService101', value: 'AppDService101' }
    ]
  }),
  HarnessServiceAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addService"
          onClick={() => props.serviceProps.onNewCreated({ name: 'newService', identifier: 'newService' })}
        />
      </Container>
    )
  },
  HarnessEnvironmentAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addEnv"
          onClick={() => props.environmentProps.onNewCreated({ name: 'newEnv', identifier: 'newEnv' })}
        />
      </Container>
    )
  },
  useGetHarnessEnvironments: () => {
    return {
      environmentOptions: [
        { label: 'env1', value: 'env1' },
        { label: 'AppDTestEnv1', value: 'AppDTestEnv1' }
      ]
    }
  }
}))
jest.mock('services/cv', () => ({
  useSaveMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useUpdateMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetMonitoredServiceScoresFromServiceAndEnvironment: jest.fn().mockImplementation(() => ({
    data: { currentHealthScore: { riskStatus: RiskValues.HEALTHY, healthScore: 100 } },
    loading: false,
    error: null,
    refetch: jest.fn()
  })),
  useGetMonitoredServiceOverAllHealthScore: jest.fn().mockImplementation(() => {
    return { data: mockedHealthScoreData, refetch: fetchHealthScore, error: null, loading: false }
  }),
  useGetServiceDependencyGraph: jest.fn().mockImplementation(() => {
    return {
      data: {},
      refetch: jest.fn(),
      error: null,
      loading: false
    }
  }),
  useGetAnomaliesSummary: jest.fn().mockImplementation(() => {
    return {
      data: {},
      refetch: jest.fn(),
      error: null,
      loading: false
    }
  }),
  useChangeEventSummary: jest.fn().mockImplementation(() => {
    return {
      data: { resource: { ...changeSummaryWithPositiveChange } },
      refetch: jest.fn(),
      error: null,
      loading: false
    }
  }),
  useChangeEventList: jest
    .fn()
    .mockImplementation(
      ({ queryParams: { serviceIdentifiers, envIdentifiers, changeSourceTypes, changeCategories } }) => {
        const contents = mockData.resource.content.filter(
          content =>
            serviceIdentifiers.includes(content.serviceIdentifier) &&
            envIdentifiers.includes(content.envIdentifier) &&
            changeCategories.includes(content.category) &&
            changeSourceTypes.includes(content.type)
        )
        return {
          data: {
            ...mockData,
            resource: {
              ...mockData.resource,
              totalItems: contents.length,
              content: contents
            }
          },
          refetch: mockFetch,
          error: null,
          loading: false
        }
      }
    ),
  useChangeEventTimeline: jest.fn().mockImplementation(() => {
    return {
      data: {},
      refetch: jest.fn(),
      error: null,
      loading: false,
      cancel: jest.fn()
    }
  }),
  useGetMonitoredServiceChangeTimeline: jest.fn().mockImplementation(() => {
    return {
      data: {
        resource: {
          categoryTimeline: {
            Deployment: [],
            Infrastructure: [],
            Alert: []
          }
        }
      },
      refetch: jest.fn(),
      error: null,
      loading: false,
      cancel: jest.fn()
    }
  })
}))

describe('Unit tests for CVChanges', () => {
  test('Verify if all the fields are rendered correctly CVChanges with correct document title', async () => {
    const { container, getByText } = render(<WrapperComponent />)
    expect(container).toMatchSnapshot()
    expect(getByText('services: all')).toBeDefined()
    expect(getByText('environments: all')).toBeDefined()
    expect(getByText('cv.cvChanges.sourceFilterDefault: all')).toBeDefined()
    expect(getByText('cv.cvChanges.changeTypeFilterDefault: all')).toBeDefined()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(document.title).toBe('cv.srmTitle | changes | harness')
  })

  test('change a time period', async () => {
    const { container } = render(<WrapperComponent />)
    const timePeriodDropdown = container.querySelector('input[name="timePeriod"]') as HTMLInputElement
    const selectCaret = container
      .querySelector(`[name="timePeriod"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(selectCaret!)
    })
    const typeToSelect = await findByText(container, 'cv.monitoredServices.serviceHealth.last4Hrs')
    act(() => {
      fireEvent.click(typeToSelect)
    })
    expect(timePeriodDropdown.value).toBe('cv.monitoredServices.serviceHealth.last4Hrs')
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(5)
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  test('change services filter', async () => {
    const { container, getByTestId } = render(<WrapperComponent />)

    const servicesDropdown = getByTestId('serviceFilter') as HTMLInputElement

    await waitFor(() => {
      fireEvent.click(servicesDropdown!)
    })

    const typeToSelect = await findByText(container, 'service1')

    expect(typeToSelect).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect)
    })
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(3)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  test('change environments filter', async () => {
    const { container, getByTestId } = render(<WrapperComponent />)

    const servicesDropdown = getByTestId('envFilter') as HTMLInputElement

    await waitFor(() => {
      fireEvent.click(servicesDropdown!)
    })

    const typeToSelect = await findByText(container, 'env1')

    expect(typeToSelect).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect)
    })
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(3)
  })

  test('change source filter', async () => {
    const { container, getByTestId } = render(<WrapperComponent />)

    const sourcesDropdown = getByTestId('sourceFilter') as HTMLInputElement

    await waitFor(() => {
      fireEvent.click(sourcesDropdown!)
    })

    const typeToSelect = await findByText(container, 'common.pagerDuty')

    expect(typeToSelect).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect)
    })
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(2)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  test('change changeType filter', async () => {
    const { container, getByTestId } = render(<WrapperComponent />)

    const changeTypeDropdown = getByTestId('changeTypeFilter') as HTMLInputElement

    await waitFor(() => {
      fireEvent.click(changeTypeDropdown!)
    })

    const typeToSelectType = await findByText(container, 'deploymentText')

    expect(typeToSelectType).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelectType)
    })
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(3)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  test('clear Filter', async () => {
    const { container, getByTestId, getByText } = render(<WrapperComponent />)

    const changeTypeDropdown = getByTestId('changeTypeFilter') as HTMLInputElement

    await waitFor(() => {
      fireEvent.click(changeTypeDropdown!)
    })

    const typeChangeFilter = await findByText(container, 'deploymentText')

    expect(typeChangeFilter).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeChangeFilter)
    })

    expect(findByText(container, 'cv.cvChanges.changeTypeFilterDefault')).toBeDefined()
    const typeToSelectType = await findByText(container, 'cv.cvChanges.clearFilters')

    expect(typeToSelectType).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelectType)
    })

    expect(getByText('services: all')).toBeDefined()
    expect(getByText('environments: all')).toBeDefined()
    expect(getByText('cv.cvChanges.sourceFilterDefault: all')).toBeDefined()
    expect(getByText('cv.cvChanges.changeTypeFilterDefault: all')).toBeDefined()
  })

  test('delete filter', async () => {
    const { container, getByTestId } = render(<WrapperComponent />)

    const servicesDropdown = getByTestId('serviceFilter') as HTMLInputElement
    await waitFor(() => {
      fireEvent.click(servicesDropdown!)
    })
    const typeToSelect1 = await findByText(container, 'service1')
    expect(typeToSelect1).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect1)
    })

    const servicesDropdown1 = getByTestId('serviceFilter') as HTMLInputElement
    await waitFor(() => {
      fireEvent.click(servicesDropdown1!)
    })
    const typeToSelect2 = await findByText(container, 'AppDService101')
    expect(typeToSelect2).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect2)
    })
    const tRows1 = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows1.length).toBe(5)

    const servicesDropdown2 = getByTestId('serviceFilter') as HTMLInputElement
    await waitFor(() => {
      fireEvent.click(servicesDropdown2!)
    })
    const typeToSelect3 = await findByText(container, 'AppDService101')
    expect(typeToSelect3).toBeInTheDocument()
    act(() => {
      fireEvent.click(typeToSelect3)
    })
    const tRows2 = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows2.length).toBe(3)
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  test('it should call useChangeEventTimeline with monitoredServiceIdentifiers', async () => {
    const refetch = jest.fn()
    jest.spyOn(cvService, 'useChangeEventTimeline').mockReturnValue({ data: {}, refetch, cancel: jest.fn() } as any)

    render(<WrapperComponent />)

    await waitFor(() => {
      expect(refetch).toHaveBeenLastCalledWith({
        queryParams: expect.objectContaining({
          changeCategories: ['Deployment', 'Infrastructure', 'Alert'],
          changeSourceTypes: ['HarnessCDNextGen', 'HarnessCD', 'K8sCluster', 'PagerDuty'],
          envIdentifiers: ['env1', 'AppDTestEnv1'],
          serviceIdentifiers: ['service1', 'AppDService101']
        }),
        queryParamStringifyOptions: {
          arrayFormat: 'repeat'
        }
      })
    })
  })
})
