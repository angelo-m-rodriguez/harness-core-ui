/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { queryByText, render } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'

import { TestWrapper } from '@common/utils/testUtils'
import { FetchCcmMetaDataDocument } from 'services/ce/services'

import RecommendationList from '../RecommendationList'
import ResponseData from './ListData.json'
import SavedFilterData from './FiltersData.json'

const CCMMetaDataResponse = {
  k8sClusterConnectorPresent: true,
  cloudDataPresent: true,
  awsConnectorsPresent: true,
  gcpConnectorsPresent: true,
  azureConnectorsPresent: true,
  applicationDataPresent: true,
  inventoryDataPresent: false,
  clusterDataPresent: true,
  isSampleClusterPresent: false,
  defaultAzurePerspectiveId: 'azureId',
  defaultAwsPerspectiveId: 'awsId',
  defaultGcpPerspectiveId: 'gcpId',
  defaultClusterPerspectiveId: 'clusterId',
  __typename: 'CCMMetaData'
}

jest.mock('services/ce', () => ({
  useListRecommendations: jest.fn().mockImplementation(() => ({
    mutate: jest
      .fn()
      .mockReturnValueOnce(() => ({
        status: 'SUCCESS',
        data: { items: [] }
      }))
      .mockImplementation(() => ({
        status: 'SUCCESS',
        data: { items: ResponseData.data.recommendationsV2.items }
      }))
  })),
  useRecommendationStats: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: { ...ResponseData.data.recommendationStatsV2 }
      }
    }
  })),
  useRecommendationsCount: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: 42
      }
    }
  })),
  useRecommendationFilterValues: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: []
      }
    }
  })),
  useGetFilterList: jest.fn().mockImplementation(() => {
    return {
      data: SavedFilterData,
      refetch: jest.fn(),
      loading: false
    }
  })
}))

const params = { accountId: 'TEST_ACC', orgIdentifier: 'TEST_ORG', projectIdentifier: 'TEST_PROJECT' }

describe('test cases for Recommendation List Page', () => {
  test('should be able to render empty page', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchCcmMetaDataDocument) {
          return fromValue({
            data: {
              ccmMetaData: CCMMetaDataResponse
            }
          })
        }
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <RecommendationList />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should be able to render the list page', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchCcmMetaDataDocument) {
          return fromValue({
            data: {
              ccmMetaData: CCMMetaDataResponse
            }
          })
        }
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <RecommendationList />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    expect(queryByText(container, 'filters.selectFilter')).toBeDefined()
  })

  test('should be able to render page when thr are no k8s connector', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchCcmMetaDataDocument) {
          return fromValue({
            data: {
              ccmMetaData: {
                ...CCMMetaDataResponse,
                k8sClusterConnectorPresent: false
              }
            }
          })
        }
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <RecommendationList />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should be able to render page when thr are k8s connector but no cluster data', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchCcmMetaDataDocument) {
          return fromValue({
            data: {
              ccmMetaData: {
                ...CCMMetaDataResponse,
                clusterDataPresent: false
              }
            }
          })
        }
      }
    }

    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <RecommendationList />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
