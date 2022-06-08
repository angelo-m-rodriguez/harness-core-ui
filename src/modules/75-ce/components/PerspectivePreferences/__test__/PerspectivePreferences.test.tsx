/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getAllByText, getByLabelText, render } from '@testing-library/react'
import { omit } from 'lodash-es'

import { TestWrapper } from '@common/utils/testUtils'
import type { CEView } from 'services/ce'

import PerspectivePreferences from '../PerspectivePreferences'

const perspectiveData = {
  uuid: 'uuid_1',
  name: 'viewPreferencesTest',
  accountId: 'account_id',
  folderId: 'folder_id',
  viewVersion: 'v1',
  viewTimeRange: {
    viewTimeRangeType: 'LAST_7',
    startTime: 0,
    endTime: 0
  },
  viewRules: [
    {
      viewConditions: [
        {
          type: 'VIEW_ID_CONDITION',
          viewField: {
            fieldId: 'clusterType',
            fieldName: 'Cluster Type',
            identifier: 'CLUSTER',
            identifierName: null
          },
          viewOperator: 'IN',
          values: ['Mock Value']
        }
      ]
    }
  ],
  dataSources: ['CLUSTER'],
  viewPreferences: {
    includeOthers: true,
    includeUnallocatedCost: true
  },
  viewType: 'CUSTOMER',
  viewState: 'COMPLETED',
  totalCost: 0,
  createdAt: 1654425970314,
  lastUpdatedAt: 1654679887173
}

const payload = {
  viewVersion: 'v1',
  viewTimeRange: {
    viewTimeRangeType: 'LAST_7'
  },
  viewType: 'CUSTOMER',
  viewVisualization: {
    groupBy: {
      fieldId: 'product',
      fieldName: 'Product',
      identifier: 'COMMON',
      identifierName: 'COMMON'
    },
    chartType: 'STACKED_LINE_CHART'
  },
  name: 'viewPreferencesTest',
  viewRules: [
    {
      viewConditions: [
        {
          type: 'VIEW_ID_CONDITION',
          viewField: {
            fieldId: 'clusterType',
            fieldName: 'Cluster Type',
            identifier: 'CLUSTER',
            identifierName: null
          },
          viewOperator: 'IN',
          values: ['Mock Value']
        }
      ]
    }
  ],
  viewState: 'DRAFT',
  uuid: 'uuid_1',
  folderId: 'folder_id'
}

jest.mock('services/ce', () => {
  return {
    useUpdatePerspective: jest.fn().mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {}
        }
      }
    }))
  }
})

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('Tests for PerspectivePreferences Component', () => {
  test('Should be able to render PerspectivePreferences / Datasource - CLUSTER', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <PerspectivePreferences
          onPrevButtonClick={jest.fn()}
          perspectiveData={perspectiveData as CEView}
          updatePayload={payload as CEView}
        />
      </TestWrapper>
    )

    expect(getAllByText(container, 'preferences')).toBeDefined()
    expect(getByLabelText(container, 'ce.perspectives.createPerspective.preferences.includeOthers')).toBeDefined()
    expect(getByLabelText(container, 'ce.perspectives.createPerspective.preferences.includeUnallocated')).toBeDefined()
  })

  test('Should be able to render PerspectivePreferences / Datasource - [CLUSTER, AWS]', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <PerspectivePreferences
          onPrevButtonClick={jest.fn()}
          perspectiveData={{ ...perspectiveData, dataSources: ['CLUSTER', 'AWS'] } as CEView}
          updatePayload={payload as CEView}
        />
      </TestWrapper>
    )

    const includeUnallocatedCheckbox = container.querySelectorAll('input[type="checkbox"]')[1]
    expect(includeUnallocatedCheckbox).toBeDisabled()
  })

  test('Should be able to set preferences', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <PerspectivePreferences
          onPrevButtonClick={jest.fn()}
          perspectiveData={perspectiveData as CEView}
          updatePayload={payload as CEView}
        />
      </TestWrapper>
    )

    const includeOthersCheckbox = container.querySelectorAll('input[type="checkbox"]')[0]
    const includeUnallocatedCheckbox = container.querySelectorAll('input[type="checkbox"]')[1]

    fireEvent.click(includeOthersCheckbox)
    expect(includeOthersCheckbox).not.toBeChecked()

    fireEvent.click(includeUnallocatedCheckbox)
    expect(includeUnallocatedCheckbox).not.toBeChecked()
  })

  test('Should be able to render No Preferences / No Datasources', () => {
    const noPreferenceData = omit(perspectiveData, 'viewPreferences')

    const { container } = render(
      <TestWrapper pathParams={params}>
        <PerspectivePreferences
          onPrevButtonClick={jest.fn()}
          perspectiveData={{ ...noPreferenceData, dataSources: [] } as CEView}
          updatePayload={payload as CEView}
        />
      </TestWrapper>
    )

    const includeOthersCheckbox = container.querySelectorAll('input[type="checkbox"]')[0]
    const includeUnallocatedCheckbox = container.querySelectorAll('input[type="checkbox"]')[1]

    expect(includeOthersCheckbox).not.toBeChecked()
    expect(includeUnallocatedCheckbox).not.toBeChecked()
  })
})
