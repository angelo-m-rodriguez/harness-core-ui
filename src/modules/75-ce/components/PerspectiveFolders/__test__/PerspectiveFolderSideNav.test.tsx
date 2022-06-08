/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Provider } from 'urql'
import { act, fireEvent, render } from '@testing-library/react'
import { fromValue } from 'wonka'
import { TestWrapper } from '@common/utils/testUtils'
import type { CEViewFolder } from 'services/ce'
import PerspectiveFoldersSideNav from '../PerspectiveFoldersSideNav'
import FoldersList from './FoldersList.json'

const responseState = {
  executeQuery: () => {
    return fromValue({})
  }
}

const deleteFolder = jest.fn()

describe('Test cases for perspective folder side nav', () => {
  test('Should render the folders list as side nav', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={jest.fn()}
            selectedFolderId={''}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={jest.fn()}
          />
        </Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should show loader in case of loading state', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={jest.fn()}
            selectedFolderId={''}
            foldersList={[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={true}
            defaultFolderId={''}
            deleteFolder={jest.fn()}
          />
        </Provider>
      </TestWrapper>
    )

    const spinner = container.querySelector('[data-testid="loader"]')
    expect(spinner).toBeTruthy()
  })

  test('Should delete folder on click of delete icon', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <PerspectiveFoldersSideNav
            setSelectedFolder={jest.fn()}
            selectedFolderId={''}
            foldersList={FoldersList.data as unknown as CEViewFolder[]}
            setRefetchFolders={jest.fn()}
            foldersLoading={false}
            defaultFolderId={''}
            deleteFolder={deleteFolder}
          />
        </Provider>
      </TestWrapper>
    )

    const deleteFolderIcon = container.querySelector('[data-testid="deleteFolder"]')
    expect(deleteFolderIcon).toBeDefined()
    act(() => {
      fireEvent.click(deleteFolderIcon!)
    })

    expect(getByText('ce.perspectives.folders.deletedConfirmationDesc')).toBeDefined()

    const deleteButton = getByText('delete')
    expect(deleteButton).toBeDefined()
    act(() => {
      fireEvent.click(deleteButton)
    })
    expect(deleteFolder).toBeCalledWith('yVi1Q8cgQnaq-y1YqmELFQ')
  })
})
