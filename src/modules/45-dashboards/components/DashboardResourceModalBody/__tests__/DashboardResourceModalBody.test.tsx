/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { useGetFolder } from 'services/custom-dashboards'
import DashboardResourceModalBody, { DashboardResourceModalBodyProps } from '../DashboardResourceModalBody'

jest.mock('services/custom-dashboards', () => ({
  useGetFolder: jest.fn()
}))
const useGetFolderMock = useGetFolder as jest.Mock

const renderComponent = (props: Partial<DashboardResourceModalBodyProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <DashboardResourceModalBody
        onSelectChange={jest.fn()}
        selectedData={[]}
        resourceScope={{ accountIdentifier: '' }}
        {...props}
      />
    </TestWrapper>
  )

describe('DashboardResourceModalBody', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useGetFolderMock.mockReturnValue({ data: { resource: [] } })
  })

  test('it should display the no data message when no folders are returned', async () => {
    renderComponent()

    expect(screen.getByText('noData')).toBeInTheDocument()
  })

  test('it should display the folder names', async () => {
    useGetFolderMock.mockReturnValue({ data: { resource: [{ id: '12', name: 'you_got_it', Children: [] }] } })

    renderComponent()

    expect(screen.getByText('you_got_it (0)')).toBeInTheDocument()
  })

  test('it should display the child dashboard names', async () => {
    useGetFolderMock.mockReturnValue({
      data: {
        resource: [
          {
            id: '12',
            name: 'you_got_it',
            Children: [
              { id: '45', name: 'child_one' },
              { id: '49', name: 'two_child' }
            ]
          }
        ]
      }
    })

    renderComponent()

    expect(screen.getByText('child_one')).toBeInTheDocument()
  })
})
