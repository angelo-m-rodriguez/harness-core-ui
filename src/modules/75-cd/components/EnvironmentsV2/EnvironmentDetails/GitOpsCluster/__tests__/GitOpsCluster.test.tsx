/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, queryByText, render, waitFor } from '@testing-library/react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import * as infiniteScrollHook from '@common/hooks/useInfiniteScroll'

import GitOpsCluster from '../GitOpsCluster'

const addApi = jest.fn().mockImplementation(() => Promise.resolve())
const deleteApiKey = jest.fn()

window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null
}))

jest.spyOn(infiniteScrollHook, 'useInfiniteScroll').mockReturnValue({
  items: [
    {
      identifier: 'test-cluster-a',
      cluster: {
        name: 'test-cluster-a'
      }
    },
    {
      identifier: 'test-cluster-b',
      cluster: {
        name: 'test-cluster-b'
      }
    }
  ],
  error: '',
  fetching: false,
  attachRefToLastElement: jest.fn(),
  hasMore: { current: false },
  loadItems: jest.fn(),
  offsetToFetch: { current: 0 }
})

jest.mock('services/cd-ng', () => ({
  useGetClusterList: jest.fn().mockImplementation(() => {
    return {
      data: {
        content: [
          {
            clusterRef: 'test-cluster-a',
            linkedAt: '123'
          },
          {
            clusterRef: 'test-cluster-b',
            linkedAt: '2'
          }
        ]
      },
      refetch: jest.fn()
    }
  }),
  useDeleteCluster: jest.fn().mockImplementation(() => {
    return { mutate: deleteApiKey }
  }),
  useLinkClusters: jest.fn().mockImplementation(() => {
    return { mutate: addApi }
  })
}))

const props = {
  envRef: 'test-env',
  linkedClusters: {
    data: {
      content: [
        {
          clusterRef: 'test-cluster-a',
          linkedAt: '123'
        },
        {
          clusterRef: 'test-cluster-b',
          linkedAt: '2'
        }
      ]
    }
  }
}
describe('GitOps Cluster tests', () => {
  test('initial render', () => {
    const { container } = render(
      <TestWrapper>
        <GitOpsCluster {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('click on select cluster', async () => {
    const { container } = render(
      <TestWrapper>
        <GitOpsCluster {...props} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click(getByText(container, 'cd.selectClusterLabel')!)
    })
    const form = findDialogContainer()
    expect(form).toMatchSnapshot()
    fireEvent.click(form?.querySelector('.bp3-dialog-close-button')!)
  })

  test('click on unlink icon', async () => {
    const { container } = render(
      <TestWrapper>
        <GitOpsCluster {...props} />
      </TestWrapper>
    )
    const rows = container.querySelectorAll('[data-testid="clusterDataRow"]')

    const unlinkBtn = rows[0].querySelector('[data-test-id="unlink-btn"]')
    fireEvent.click(unlinkBtn!)

    await act(async () => {
      fireEvent.click(unlinkBtn!)
      await waitFor(() => getByText(document.body, 'Unlink cluster'))
      const form = findDialogContainer()
      expect(form).toBeTruthy()
      const deleteBtn = queryByText(form as HTMLElement, 'cd.unLink')
      fireEvent.click(deleteBtn!)
      expect(deleteApiKey).toBeCalled()
    })
  })
})
