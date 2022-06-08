/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import type { DocumentNode } from 'graphql'
import { fromValue } from 'wonka'
import { Provider } from 'urql'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { FetchAllPerspectivesDocument, QlceView } from 'services/ce/services'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import useCreateFolderModal, { CreateModal } from '../CreateFolderModal'
import ResponseData from './ResponseData.json'

jest.mock('services/ce', () => {
  return {
    useCreatePerspectiveFolder: jest.fn().mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {}
        }
      }
    }))
  }
})

const setRefetchFolders = jest.fn()
const setSelectedFolder = jest.fn()

const TestComponent = (): React.ReactElement => {
  const { openCreateFoldersModal } = useCreateFolderModal({
    defaultFolderId: '',
    setRefetchFolders: setRefetchFolders,
    setSelectedFolder: setSelectedFolder
  })
  const onBtnClick = () => {
    openCreateFoldersModal()
  }

  return (
    <>
      <button className="opnModal" onClick={onBtnClick} />
      <CreateModal
        hideModal={jest.fn()}
        perspectives={ResponseData.data.perspectives.customerViews as QlceView[]}
        setRefetchFolders={setRefetchFolders}
        setSelectedFolder={setSelectedFolder}
      />
    </>
  )
}

const responseState = {
  executeQuery: ({ query }: { query: DocumentNode }) => {
    if (query === FetchAllPerspectivesDocument) {
      return fromValue(ResponseData)
    }
    return fromValue({})
  }
}

describe('Test cases for Create Perspective Folder Dialog', () => {
  test('Should render the modal', async () => {
    const { container, getAllByText, getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <TestComponent />
        </Provider>
      </TestWrapper>
    )

    const openModal = container.querySelector('.opnModal')
    await act(async () => {
      fireEvent.click(openModal!)
    })

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    expect(getAllByText('ce.perspectives.folders.createNewFolderHeading')).toBeDefined()

    fillAtForm([
      {
        container: modal!,
        type: InputTypes.TEXTFIELD,
        fieldId: 'folderName',
        value: 'test'
      }
    ])

    const submitFormBtn = modal?.querySelector('[data-testid="createFolder"]')
    expect(submitFormBtn).toBeDefined()
    act(() => {
      fireEvent.click(submitFormBtn!)
    })

    await waitFor(() => {
      expect(getByText('ce.perspectives.folders.folderCreated')).toBeDefined()
      expect(setRefetchFolders).toBeCalledWith(true)
      expect(setSelectedFolder).toBeCalledWith('')
    })
  })

  test('Perspective selection should work', async () => {
    const { container } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <TestComponent />
        </Provider>
      </TestWrapper>
    )

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    const checkbox = modal?.querySelector('[data-testid="perspectiveSelection"]')
    expect(checkbox).toBeDefined()
    act(() => {
      fireEvent.click(checkbox!, { target: { checked: true } })
    })

    expect(container).toMatchSnapshot()
  })
})
