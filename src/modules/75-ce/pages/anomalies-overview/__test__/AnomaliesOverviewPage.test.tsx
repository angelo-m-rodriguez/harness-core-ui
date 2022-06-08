/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'
import { TestWrapper } from '@common/utils/testUtils'
import { FetchCcmMetaDataDocument, FetchPerspectiveListDocument } from 'services/ce/services'
import * as FeatureFlag from '@common/hooks/useFeatureFlag'
import AnomaliesOverviewPage from '../AnomaliesOverviewPage'
import CCMMetaDataResponse from './CCMMetaDataResponse.json'
import PerspectiveList from './PerspectiveList.json'
import AnomalyData from './AnomalyData.json'

jest.mock('@ce/components/CEChart/CEChart', () => 'mock')

jest.mock('services/ce', () => ({
  useAnomalyFilterValues: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: []
      }
    }
  })),
  useListAnomalies: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: AnomalyData
      }
    }
  })),
  useReportAnomalyFeedback: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetAnomalyWidgetsData: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useGetFilterList: jest.fn().mockImplementation(() => {
    return {
      data: [],
      refetch: jest.fn(),
      loading: false
    }
  })
}))

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test case for anomalies detection overview page', () => {
  test('should be able to render the overview dashboard', async () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(true)

    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchCcmMetaDataDocument) {
          return fromValue(CCMMetaDataResponse)
        }
        if (query === FetchPerspectiveListDocument) {
          return fromValue(PerspectiveList)
        }
        return fromValue({})
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <AnomaliesOverviewPage />
        </Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
