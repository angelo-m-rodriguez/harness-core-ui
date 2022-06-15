/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { act, fireEvent, getByText, render } from '@testing-library/react'
import React from 'react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import * as infiniteScrollHook from '@common/hooks/useInfiniteScroll'

import AddCluster from '../AddCluster'

const clusters = [
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
  },
  {
    identifier: 'test-cluster-3'
  },
  {
    identifier: 'test-cluster-c',
    name: 'test-cluster-c'
  },
  {
    identifier: 'test-cluster-d',

    name: 'test-cluster-d'
  },
  {
    identifier: 'test-cluster-e',
    name: 'test-cluster-e'
  },
  {
    identifier: 'test-cluster-f',
    name: 'test-cluster-f'
  },
  {
    identifier: 'test-cluster-g',
    name: 'test-cluster-g'
  },
  {
    identifier: 'test-cluster-h',
    name: 'test-cluster-h'
  },
  {
    identifier: 'test-cluster-1',
    name: 'test-cluster-1'
  },
  {
    identifier: 'test-cluster-2',
    name: 'test-cluster-2'
  },
  {
    identifier: 'test-cluster-3',
    name: 'test-cluster-3'
  },
  {
    identifier: 'test-cluster-4',
    name: 'test-cluster-4'
  }
]

window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null
}))
jest.spyOn(infiniteScrollHook, 'useInfiniteScroll').mockReturnValue({
  items: clusters,
  error: '',
  fetching: false,
  attachRefToLastElement: jest.fn(),
  hasMore: { current: false },
  loadItems: jest.fn(),
  offsetToFetch: { current: 0 }
})

const addApi = jest.fn().mockImplementation(() => Promise.resolve())
jest.mock('services/cd-ng', () => ({
  getClusterListFromSourcePromise: jest.fn().mockImplementation(() => Promise.resolve(clusters)),
  useLinkClusters: jest.fn().mockImplementation(() => {
    return { mutate: addApi }
  })
}))

const props = {
  linkedClusterResponse: {
    data: {
      content: []
    }
  },
  onHide: jest.fn(),
  refetch: jest.fn(),
  envRef: 'test-env'
}
describe('AddCluster tests', () => {
  test('when no clusters', () => {
    jest.mock('services/cd-ng', () => ({
      getClusterListFromSourcePromise: jest.fn().mockImplementation(() => Promise.resolve([])),
      useLinkClusters: jest.fn().mockImplementation(() => {
        return { mutate: addApi }
      })
    }))
    const testProps = {
      linkedClusterResponse: {
        data: {
          content: []
        }
      },
      onHide: jest.fn(),
      refetch: jest.fn(),
      envRef: 'test-env'
    }
    render(
      <TestWrapper>
        <AddCluster {...testProps} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    expect(form).toMatchSnapshot()
  })
  test('initial render', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    expect(form).toMatchSnapshot()
  })

  test('select a cluster', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    const cluster = form?.querySelector('.gitopsClusterCard')
    fireEvent.click(cluster!)
    expect(form).toMatchSnapshot()

    expect(getByText(form as HTMLElement, 'cd.clustersSelected(1)')).toBeDefined()
  })

  test('deselect a cluster', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    const cluster = form?.querySelector('.gitopsClusterCard')
    fireEvent.click(cluster!)
    expect(getByText(form as HTMLElement, 'cd.clustersSelected(1)')).toBeDefined()
    fireEvent.click(cluster!)
    expect(getByText(form as HTMLElement, 'cd.clustersSelected(0)')).toBeDefined()
  })

  test('select All clusters', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    fireEvent.click(getByText(form as HTMLElement, 'Select All'))

    expect(getByText(form as HTMLElement, 'cd.clustersSelected(13)')).toBeDefined()
  })

  test('select All clusters and unselect one cluster', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    fireEvent.click(getByText(form as HTMLElement, 'Select All'))
    const clusterCard = form?.querySelectorAll('.gitopsClusterCard') || []

    fireEvent.click(clusterCard[1] as HTMLElement)
    expect(getByText(form as HTMLElement, 'cd.clustersSelected(12)')).toBeDefined()
  })

  test('deselect- Select All clusters', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    fireEvent.click(getByText(form as HTMLElement, 'Select All'))

    expect(getByText(form as HTMLElement, 'cd.clustersSelected(13)')).toBeDefined()
    fireEvent.click(getByText(form as HTMLElement, 'Select All'))
    expect(getByText(form as HTMLElement, 'cd.clustersSelected(0)')).toBeDefined()
  })

  test('click on add icon', () => {
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    const cluster = form?.querySelector('.gitopsClusterCard')
    fireEvent.click(cluster!)
    act(() => {
      fireEvent.click(getByText(form as HTMLElement, 'Add'))
    })

    expect(addApi).toBeCalled()
  })

  test('click on add icon - shows error', () => {
    jest.mock('services/cd-ng', () => ({
      getClusterListFromSourcePromise: jest.fn().mockImplementation(() => Promise.reject()),
      useLinkClusters: jest.fn().mockImplementation(() => {
        return { mutate: addApi }
      })
    }))
    render(
      <TestWrapper>
        <AddCluster {...props} />
      </TestWrapper>
    )
    const form = findDialogContainer()
    const cluster = form?.querySelector('.gitopsClusterCard')
    fireEvent.click(cluster!)
    act(() => {
      fireEvent.click(getByText(form as HTMLElement, 'Add'))
    })

    expect(addApi).toBeCalled()
  })
})
