/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, act } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'

import type { QlceView } from 'services/ce/services'
import mockPerspectiveData from './mockPerspectiveData.json'
import PerspectiveGridView from '../PerspectiveGridView'

describe('test cases for perspective grid view', () => {
  test('should be able to render grid view', async () => {
    const { container } = render(
      <TestWrapper>
        <PerspectiveGridView
          clonePerspective={jest.fn()}
          deletePerpsective={jest.fn()}
          navigateToPerspectiveDetailsPage={jest.fn()}
          pespectiveData={mockPerspectiveData as QlceView[]}
          setRefetchFolders={jest.fn()}
          setSelectedFolder={jest.fn()}
          setRefetchPerspectives={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should be able to clone grid view item', async () => {
    const clonePerspectiveMock = jest.fn()

    const { container, getByTestId } = render(
      <TestWrapper>
        <PerspectiveGridView
          clonePerspective={clonePerspectiveMock}
          deletePerpsective={jest.fn()}
          navigateToPerspectiveDetailsPage={jest.fn()}
          pespectiveData={mockPerspectiveData as QlceView[]}
          setRefetchFolders={jest.fn()}
          setSelectedFolder={jest.fn()}
          setRefetchPerspectives={jest.fn()}
        />
      </TestWrapper>
    )

    act(() => {
      fireEvent.click(container.querySelector(`button`)!)
    })

    act(() => {
      fireEvent.click(getByTestId(`clone-perspective-${mockPerspectiveData[0].id}`))
    })

    expect(clonePerspectiveMock).toHaveBeenCalled()
  })

  test('should be able to navigate to details page', async () => {
    const navigateToPerspectiveDetailsPageMock = jest.fn()

    const { getByText } = render(
      <TestWrapper>
        <PerspectiveGridView
          clonePerspective={jest.fn()}
          deletePerpsective={jest.fn()}
          navigateToPerspectiveDetailsPage={navigateToPerspectiveDetailsPageMock}
          pespectiveData={mockPerspectiveData as QlceView[]}
          setRefetchFolders={jest.fn()}
          setSelectedFolder={jest.fn()}
          setRefetchPerspectives={jest.fn()}
        />
      </TestWrapper>
    )

    act(() => {
      fireEvent.click(getByText(mockPerspectiveData[0].name))
    })

    expect(navigateToPerspectiveDetailsPageMock).toHaveBeenCalled()
  })
})
