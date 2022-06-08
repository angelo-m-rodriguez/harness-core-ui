/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { queryByText, render, fireEvent, getByText, waitFor, getAllByText } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'

import type { CcmMetaData } from 'services/ce/services'
import CCMMetaDataResponse from '@ce/pages/anomalies-overview/__test__/CCMMetaDataResponse.json'
import AnomaliesFilter from '../AnomaliesFilter'
import SavedFilterData from './SavedFilterData.json'
import FilterValues from './FilterValues.json'
import { getAnomalyFilterPropertiesFromForm, getAnomalyFormValuesFromFilterProperties } from '../FilterDrawer/utils'

jest.mock('services/ce', () => ({
  useAnomalyFilterValues: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: FilterValues.data
      }
    }
  })),
  useGetFilterList: jest
    .fn()
    .mockImplementationOnce(() => {
      return {
        data: {},
        refetch: jest.fn(),
        loading: false
      }
    })
    .mockImplementation(() => {
      return {
        data: SavedFilterData,
        refetch: jest.fn(),
        loading: false
      }
    }),
  usePostFilter: jest.fn().mockImplementation(() => {
    return {
      mutate: jest.fn()
    }
  }),
  useUpdateFilter: jest.fn().mockImplementation(() => {
    return {
      mutate: jest.fn()
    }
  }),
  useDeleteFilter: jest.fn().mockImplementation(() => {
    return {
      mutate: jest.fn()
    }
  })
}))

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

const defaultProps = {
  timeRange: {
    to: '2022-10-02',
    from: '2022-10-02'
  },
  setTimeRange: jest.fn(),
  applyFilters: jest.fn(),
  ccmMetaData: CCMMetaDataResponse.data.ccmMetaData as CcmMetaData
}

const findDrawerContainer = (): HTMLElement | null => document.querySelector('.bp3-drawer')

describe('Test Cases for AnomaliesFilter Component', () => {
  test('Should be able to render the AnomaliesFilter Component / No saved filter', async () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <AnomaliesFilter {...defaultProps} />
      </TestWrapper>
    )

    expect(queryByText(container, 'common.filters.noFilterSaved')).toBeDefined()
  })

  test('Should be able to select a saved filter', async () => {
    const applyFiltersMock = jest.fn()

    const { container } = render(
      <TestWrapper pathParams={params}>
        <AnomaliesFilter {...defaultProps} applyFilters={applyFiltersMock} />
      </TestWrapper>
    )

    const filterDropdown = container.querySelector('[data-testid="filter-select"]')
    fireEvent.click(filterDropdown!)
    const listItem = document.body.getElementsByClassName('DropDown--menuItem')[0]
    fireEvent.click(listItem)
    expect(applyFiltersMock).toBeCalledWith(SavedFilterData.data.content[0].filterProperties)
  })

  test('Should be able to select / create / update / delete filters', () => {
    const applyFiltersMock = jest.fn()

    const { container } = render(
      <TestWrapper pathParams={params}>
        <AnomaliesFilter {...defaultProps} applyFilters={applyFiltersMock} />
      </TestWrapper>
    )

    const filterBtn = container.getElementsByTagName('button')[0]
    fireEvent.click(filterBtn)
    const drawer = findDrawerContainer()
    expect(getByText(drawer!, 'Filter')).toBeDefined()

    fireEvent.click(getByText(drawer!, 'Filter2'))
    expect(getAllByText(drawer!, 'Filter2').length).toBe(2)

    fireEvent.click(getByText(drawer!, 'filters.newFilter'))

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

  test('Should be able to  open filter drawer / fill filter form / clear form / apply filters', () => {
    const applyFiltersMock = jest.fn()

    const { container } = render(
      <TestWrapper pathParams={params}>
        <AnomaliesFilter {...defaultProps} applyFilters={applyFiltersMock} />
      </TestWrapper>
    )

    const filterBtn = container.getElementsByTagName('button')[0]
    fireEvent.click(filterBtn)
    const drawer = findDrawerContainer()
    expect(getByText(drawer!, 'Filter')).toBeDefined()

    fireEvent.click(drawer?.querySelectorAll('[data-icon="chevron-down"]')[0]!) // Expand Cluster Filters Card
    fireEvent.click(drawer?.querySelectorAll('[data-icon="chevron-down"]')[0]!) // Expand GCP Filters Card
    fireEvent.click(drawer?.querySelectorAll('[data-icon="chevron-down"]')[0]!) // Expand AWS Filters Card

    fillAtForm([
      {
        container: drawer!,
        fieldId: 'minActualAmount',
        type: InputTypes.TEXTFIELD,
        value: '50'
      }
    ])

    fireEvent.click(getByText(drawer!, 'filters.clearAll'))
    expect(drawer?.querySelector('input[value="50"]')).toBeNull()

    fillAtForm([
      {
        container: drawer!,
        fieldId: 'minActualAmount',
        type: InputTypes.TEXTFIELD,
        value: '100'
      },
      {
        container: drawer!,
        fieldId: 'minAnomalousSpend',
        type: InputTypes.TEXTFIELD,
        value: '200'
      },
      {
        container: drawer!,
        fieldId: 'k8sClusterNames',
        type: InputTypes.MULTISELECT,
        multiSelectValues: ['Cluster Name 1']
      },
      {
        container: drawer!,
        fieldId: 'awsAccounts',
        type: InputTypes.MULTISELECT,
        multiSelectValues: ['3']
      }
    ])

    fireEvent.click(getByText(drawer!, 'filters.apply'))

    waitFor(() => {
      expect(drawer).toBeNull()
    })
  })
})

const mockFilterProperties = {
  awsAccounts: ['mock1'],
  awsServices: ['mock1'],
  awsUsageTypes: ['mock1'],
  gcpProducts: ['mock1'],
  gcpProjects: ['mock1'],
  gcpSKUDescriptions: ['mock1'],
  k8sClusterNames: ['mock1'],
  k8sNamespaces: ['mock1'],
  k8sWorkloadNames: ['mock1'],
  minActualAmount: 100,
  minAnomalousSpend: 200
}

const mockFormValues = {
  awsAccounts: [{ label: 'mock1', value: 'mock1' }],
  awsServices: [{ label: 'mock1', value: 'mock1' }],
  awsUsageTypes: [{ label: 'mock1', value: 'mock1' }],
  gcpProducts: [{ label: 'mock1', value: 'mock1' }],
  gcpProjects: [{ label: 'mock1', value: 'mock1' }],
  gcpSKUDescriptions: [{ label: 'mock1', value: 'mock1' }],
  k8sClusterNames: [{ label: 'mock1', value: 'mock1' }],
  k8sNamespaces: [{ label: 'mock1', value: 'mock1' }],
  k8sWorkloadNames: [{ label: 'mock1', value: 'mock1' }],
  minActualAmount: 100,
  minAnomalousSpend: 200
}

describe('Test Cases for Filter Drawer Utils', () => {
  test('Test Cases for Utils', () => {
    expect(getAnomalyFormValuesFromFilterProperties(mockFilterProperties)).toMatchObject(mockFormValues)
    expect(getAnomalyFilterPropertiesFromForm(mockFormValues)).toMatchObject({
      ...mockFilterProperties,
      filterType: 'Anomaly'
    })
  })
})
