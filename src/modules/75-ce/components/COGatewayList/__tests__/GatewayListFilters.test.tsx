/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getAllByText, getByText, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import { StringUtils } from '@common/exports'
import GatewayListFilters from '../GatewayListFilters'
import { activeUserMock, mockedConnector } from './data'

const mockedSelectedFilter = {
  name: 'CE AWS',
  identifier: 'CE_AWS',
  data: {
    cloud_account_id: ['mock-kubernetes-id'],
    created_by: ['123'],
    kind: ['k8s'],
    namespace: ['test_namespace'],
    service_provider: ['aws']
  }
}

const mockedFiltersResponse = {
  response: [mockedSelectedFilter]
}

const mockedNamespacesResponse = {
  response: {
    namespaces: ['test_namespace']
  }
}

const params = {
  accountId: 'TEST_ACC'
}

jest.mock('services/lw', () => ({
  useGetAllRuleFilters: jest.fn().mockImplementation(() => ({
    data: mockedFiltersResponse,
    refetch: jest.fn()
  })),
  useSaveRuleFilter: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useUpdateRuleFilter: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDeleteRuleFilter: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useGetRulesMetadata: jest.fn().mockImplementation(() => ({
    data: mockedNamespacesResponse
  }))
}))

jest.mock('services/cd-ng', () => ({
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() => Promise.resolve({ data: { content: [mockedConnector] } })),
    loading: false
  })),
  useGetAggregatedUsers: jest.fn(() => ({
    cancel: jest.fn(),
    loading: false,
    mutate: jest.fn().mockImplementation(() => activeUserMock)
  }))
}))

const findDrawerContainer = (): HTMLElement | null => document.querySelector('.bp3-drawer')

describe('Rules filter tests', () => {
  test('should be able to select the saved filters from dropdown', () => {
    const applyFilterFn = jest.fn()
    const { container } = render(
      <TestWrapper pathParams={params}>
        <GatewayListFilters appliedFilter={mockedSelectedFilter} applyFilter={applyFilterFn} />
      </TestWrapper>
    )

    const filterDropdown = container.querySelector('[data-testid="filter-select"]')
    fireEvent.click(filterDropdown!)
    const listItem = document.body.getElementsByClassName('DropDown--menuItem')[0]
    fireEvent.click(listItem)
    expect(applyFilterFn).toBeCalledWith(mockedSelectedFilter)
  })

  test('Should be able to select / create / update / delete filters', () => {
    const applyFilterFn = jest.fn()

    render(
      <TestWrapper pathParams={params}>
        <GatewayListFilters appliedFilter={mockedSelectedFilter} applyFilter={applyFilterFn} />
      </TestWrapper>
    )

    const filterBtn = document.getElementById('ngfilterbtn') as HTMLButtonElement
    fireEvent.click(filterBtn)
    const drawer = findDrawerContainer()
    expect(getByText(drawer!, 'Filter')).toBeDefined()

    fireEvent.click(getByText(drawer!, 'CE AWS'))

    fireEvent.click(getAllByText(drawer!, 'filters.newFilter')[1])

    fillAtForm([
      {
        container: drawer!,
        fieldId: 'name',
        type: InputTypes.TEXTFIELD,
        value: 'TestFilter3'
      }
    ])
    fireEvent.click(getByText(drawer!, 'save'))
    expect(drawer?.querySelectorAll('.bp3-drawer')).toBeDefined()
  })

  test('should be able to apply filter', async () => {
    const applyFilterFn = jest.fn()

    render(
      <TestWrapper pathParams={params}>
        <GatewayListFilters applyFilter={applyFilterFn} />
      </TestWrapper>
    )

    const filterBtn = document.getElementById('ngfilterbtn') as HTMLButtonElement
    fireEvent.click(filterBtn)
    const drawer = findDrawerContainer()
    expect(getByText(drawer!, 'Filter')).toBeDefined()

    const connectorSelector = document.querySelector('input[name="created_by"]')
    userEvent.click(connectorSelector!)
    await waitFor(() => {
      expect(screen.getByText('Rishabh')).toBeInTheDocument()
    })
    userEvent.click(screen.getAllByText('Rishabh')[0])
    const applyBtn = getByText(drawer!, 'filters.apply')
    act(() => {
      fireEvent.click(applyBtn)
    })
    await waitFor(() => {
      expect(applyFilterFn).toBeCalled()
    })
  })

  test('should be able to clear filters', async () => {
    const applyFilterFn = jest.fn()

    render(
      <TestWrapper pathParams={params}>
        <GatewayListFilters appliedFilter={mockedSelectedFilter} applyFilter={applyFilterFn} />
      </TestWrapper>
    )

    const filterBtn = document.getElementById('ngfilterbtn') as HTMLButtonElement
    fireEvent.click(filterBtn)
    const drawer = findDrawerContainer()
    expect(getByText(drawer!, 'Filter')).toBeDefined()

    const applyBtn = getByText(drawer!, 'filters.clearAll')
    act(() => {
      fireEvent.click(applyBtn)
    })
    await waitFor(() => {
      expect(applyFilterFn).toHaveBeenCalledWith({
        name: UNSAVED_FILTER,
        identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
        data: {}
      })
    })
  })
})
