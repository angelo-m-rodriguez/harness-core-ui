/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, queryByAttribute, fireEvent, act } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import type { DocumentNode } from 'graphql'
import { TestWrapper } from '@common/utils/testUtils'
import { FetchAllPerspectivesDocument } from 'services/ce/services'
import PerspectiveListPage from '../PerspectiveListPage'
import FoldersData from './FoldersData.json'
import ResponseData from './ResponseData.json'

const params = {
  accountId: 'TEST_ACC'
}

jest.mock('services/ce', () => ({
  useGetFolders: jest.fn().mockImplementation(() => {
    return {
      data: FoldersData,
      refetch: jest.fn(),
      error: null,
      loading: false
    }
  }),
  useCreatePerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useDeletePerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useClonePerspective: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useDeleteFolder: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  })),
  useUpdateFolder: jest.fn().mockImplementation(() => ({
    mutate: async () => {
      return {
        status: 'SUCCESS',
        data: {}
      }
    }
  }))
}))

describe('test cases for Perspective details Page', () => {
  test('should be able to render the details page', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchAllPerspectivesDocument) {
          return fromValue(ResponseData)
        }
      }
    }
    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <PerspectiveListPage />
        </Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should be able to render and switch to list view', async () => {
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchAllPerspectivesDocument) {
          return fromValue(ResponseData)
        }
      }
    }
    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <PerspectiveListPage />
        </Provider>
      </TestWrapper>
    )
    const listIcon = queryByAttribute('class', container, /bp3-icon-list/)
    act(() => {
      fireEvent.click(listIcon!)
    })
    expect(container).toMatchSnapshot()
  })
})
