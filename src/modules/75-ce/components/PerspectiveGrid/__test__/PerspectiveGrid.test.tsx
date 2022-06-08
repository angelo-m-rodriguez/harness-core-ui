/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { QlceViewEntityStatsDataPoint } from 'services/ce/services'
import PerspectiveGrid, { PerspectiveGridProps } from '../PerspectiveGrid'
import MockResponse from './MockPerspectiveGridResponse.json'

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test cases for Perspective Grid', () => {
  test('should be able to render Perspective Grid', async () => {
    const { container, getByText } = render(
      <TestWrapper pathParams={params}>
        <PerspectiveGrid
          {...({
            ...MockResponse,
            gridData: MockResponse.gridData as QlceViewEntityStatsDataPoint[]
          } as PerspectiveGridProps)}
        />
      </TestWrapper>
    )

    expect(getByText('ce.gridColumnSelector')).toBeDefined()
    expect(container.querySelector('[class*="bp3-icon-arrow-down"]')).not.toBeNull()
    expect(container).toMatchSnapshot()
  })
})
