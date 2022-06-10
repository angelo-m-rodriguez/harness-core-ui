/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import ClusterTableView from '../ClusterTableView'

const props = {
  linkedClusters: {
    data: {
      content: [
        {
          clusterRef: 'test-cluster'
        }
      ]
    }
  },
  loading: false,
  refetch: jest.fn(),
  envRef: 'test-env'
}
describe('GitOps Cluster tests', () => {
  test('initial render', () => {
    const { container } = render(
      <TestWrapper>
        <ClusterTableView {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('when loading is set to true', () => {
    const { container } = render(
      <TestWrapper>
        <ClusterTableView {...props} loading={true} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('when no clusters are linked', () => {
    const defaultProps = {
      linkedClusters: {
        data: {
          content: []
        }
      },
      loading: false,
      refetch: jest.fn(),
      envRef: 'test-env'
    }
    const { container } = render(
      <TestWrapper>
        <ClusterTableView {...defaultProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
