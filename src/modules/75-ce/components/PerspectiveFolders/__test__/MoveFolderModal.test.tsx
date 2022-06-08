/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { fromValue } from 'wonka'
import { Provider } from 'urql'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import useMoveFolderModal, { MovePerspectivesModal } from '../MoveFolderModal'
import FoldersList from './FoldersList.json'

jest.mock('services/ce', () => {
  return {
    useCreatePerspectiveFolder: jest.fn().mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {}
        }
      }
    })),
    useMovePerspectives: jest.fn().mockImplementation(() => ({
      mutate: async () => {
        return {
          status: 'SUCCESS',
          data: {}
        }
      }
    })),
    useGetFolders: jest.fn().mockImplementation(() => {
      return {
        data: FoldersList,
        refetch: jest.fn(),
        error: null,
        loading: false
      }
    })
  }
})

const setRefetchFolders = jest.fn()
const setRefetchPerspectives = jest.fn()
const setSelectedFolder = jest.fn()

const TestComponent = (): React.ReactElement => {
  const { openMoveFoldersModal } = useMoveFolderModal({
    perspectiveId: '',
    setRefetchFolders: setRefetchFolders,
    setSelectedFolder: setSelectedFolder,
    setRefetchPerspectives: setRefetchPerspectives
  })
  const onBtnClick = () => {
    openMoveFoldersModal()
  }

  return (
    <>
      <button className="opnModal" onClick={onBtnClick} />
      <MovePerspectivesModal
        hideModal={jest.fn()}
        perspectiveId={''}
        setRefetchFolders={setRefetchFolders}
        setSelectedFolder={setSelectedFolder}
        setRefetchPerspectives={setRefetchPerspectives}
      />
    </>
  )
}

const responseState = {
  executeQuery: () => {
    return fromValue({})
  }
}

describe('Test cases for Move Perspective Folder Dialog', () => {
  test('Should render the modal', async () => {
    const { container, getAllByText } = render(
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

    expect(getAllByText('ce.perspectives.folders.moveFolderTitle')).toBeDefined()
    expect(modal).toMatchSnapshot()
  })

  test('Should create a new folder while moving', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <TestComponent />
        </Provider>
      </TestWrapper>
    )

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    setFieldValue({
      container: modal!,
      type: InputTypes.RADIOS,
      fieldId: 'folderType',
      value: 'NEW'
    })
    setFieldValue({
      container: modal!,
      type: InputTypes.TEXTFIELD,
      fieldId: 'folderName',
      value: 'test'
    })

    const submitFormBtn = modal?.querySelector('[data-testid="moveFolder"]')
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

  test('Should validate the form in case of EXISTING folder type', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <TestComponent />
        </Provider>
      </TestWrapper>
    )

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    const submitFormBtn = modal?.querySelector('[data-testid="moveFolder"]')
    expect(submitFormBtn).toBeDefined()
    act(() => {
      fireEvent.click(submitFormBtn!)
    })

    await waitFor(() => {
      expect(getByText('ce.perspectives.folders.folderSelectionRequired')).toBeDefined()
    })
  })

  test('Should validate the form in case of NEW folder type', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Provider value={responseState as any}>
          <TestComponent />
        </Provider>
      </TestWrapper>
    )

    const modal = findDialogContainer()
    expect(modal).toBeDefined()

    setFieldValue({
      container: modal!,
      type: InputTypes.RADIOS,
      fieldId: 'folderType',
      value: 'NEW'
    })

    const submitFormBtn = modal?.querySelector('[data-testid="moveFolder"]')
    expect(submitFormBtn).toBeDefined()
    act(() => {
      fireEvent.click(submitFormBtn!)
    })

    await waitFor(() => {
      expect(getByText('ce.perspectives.folders.folderNameRequired')).toBeDefined()
    })
  })
})
