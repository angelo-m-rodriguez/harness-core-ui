/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { TestWrapper } from '@common/utils/testUtils'
import EnvironmentDetails from '../EnvironmentDetails'

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentV2: jest.fn().mockImplementation(() => {
    return {
      data: {
        name: 'testenv',
        identifier: 'test-env',
        lastModifiedAt: ''
      },
      refetch: jest.fn()
    }
  }),
  useGetYamlSchema: jest.fn().mockImplementation(() => {
    return {
      data: {
        name: 'testenv',
        identifier: 'test-env',
        lastModifiedAt: ''
      },
      refetch: jest.fn()
    }
  })
}))
describe('EnvironmentDetails tests', () => {
  test('initial render', () => {
    const { container } = render(
      <TestWrapper>
        <EnvironmentDetails />
      </TestWrapper>
    )
    const header = container.querySelector('.environmentDetailsHeader')
    expect(header).toBeDefined()
  })
})
