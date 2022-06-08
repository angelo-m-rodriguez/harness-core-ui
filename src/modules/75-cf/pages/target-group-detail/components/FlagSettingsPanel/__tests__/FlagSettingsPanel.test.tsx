/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getByPlaceholderText, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cloneDeep } from 'lodash-es'
import * as cfServices from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import { mockFeatures, mockTargetGroup } from '@cf/pages/target-group-detail/__tests__/mocks'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import FlagSettingsPanel, { FlagSettingsPanelProps } from '../FlagSettingsPanel'
import * as useGetTargetGroupFlagsHook from '../../../hooks/useGetTargetGroupFlags'

jest.mock('@common/components/ContainerSpinner/ContainerSpinner', () => ({
  ContainerSpinner: () => <span data-testid="container-spinner">Container Spinner</span>
}))

const renderComponent = (props: Partial<FlagSettingsPanelProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <FlagSettingsPanel targetGroup={mockTargetGroup} {...props} />
    </TestWrapper>
  )

describe('FlagSettingsPanel', () => {
  const useGetTargetGroupFlagsMock = jest.spyOn(useGetTargetGroupFlagsHook, 'default')
  const patchSegmentMock = jest.fn()
  const usePatchSegmentMock = jest.spyOn(cfServices, 'usePatchSegment')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetTargetGroupFlagsMock.mockReturnValue({
      data: mockFeatures,
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    usePatchSegmentMock.mockReturnValue({
      mutate: patchSegmentMock
    } as any)
  })

  test('it should display the error message when it fails to load flags ', async () => {
    const message = 'ERROR MESSAGE'
    const refetchMock = jest.fn()

    useGetTargetGroupFlagsMock.mockReturnValue({
      data: null,
      loading: false,
      error: { message },
      refetch: refetchMock
    } as any)

    renderComponent()

    const btn = screen.getByRole('button', { name: 'Retry' })
    expect(btn).toBeInTheDocument()
    expect(refetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(message)).toBeInTheDocument()

    userEvent.click(btn)

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())
  })

  test('it should show the loading spinner when loading flags', async () => {
    useGetTargetGroupFlagsMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent()

    expect(screen.getByTestId('container-spinner')).toBeInTheDocument()
  })

  test('it should call the patchSegment hook and reload the flags when the form is submitted with changes', async () => {
    const refetchMock = jest.fn()

    useGetTargetGroupFlagsMock.mockReturnValue({
      data: mockFeatures,
      loading: false,
      error: null,
      refetch: refetchMock
    } as any)

    patchSegmentMock.mockResolvedValue(undefined)

    renderComponent()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])
    await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))

    expect(patchSegmentMock).not.toHaveBeenCalled()
    expect(refetchMock).not.toHaveBeenCalled()

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(patchSegmentMock).toHaveBeenCalled()
      expect(refetchMock).toHaveBeenCalled()
    })
  })

  test('it should display an error and not refetch if the patchTarget hook fails', async () => {
    const message = 'ERROR MESSAGE'
    const refetchMock = jest.fn()

    useGetTargetGroupFlagsMock.mockReturnValue({
      data: mockFeatures,
      loading: false,
      error: null,
      refetch: refetchMock
    })

    patchSegmentMock.mockRejectedValue({ message })

    renderComponent()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])
    await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))

    expect(refetchMock).not.toHaveBeenCalled()

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(patchSegmentMock).toHaveBeenCalled()
      expect(refetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })

  describe('add flag', () => {
    const openAndSubmitDialog = async (refetchMock: jest.Mock): Promise<void> => {
      const newFlag = cloneDeep(mockFeatures[0])
      newFlag.identifier = 'newFlag'
      newFlag.name = 'New Flag'
      newFlag.variations[0].name = 'NEW VARIATION'

      jest.spyOn(cfServices, 'useGetAllFeatures').mockReturnValue({
        data: {
          pageSize: CF_DEFAULT_PAGE_SIZE,
          itemCount: 1,
          pageCount: 1,
          pageIndex: 0,
          features: [newFlag]
        }
      } as any)

      useGetTargetGroupFlagsMock.mockReturnValue({
        data: mockFeatures,
        loading: false,
        error: null,
        refetch: refetchMock
      })

      renderComponent()

      userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlag' }))

      await waitFor(() => expect(screen.getByText('cf.segmentDetail.addFlagToTargetGroup')).toBeInTheDocument())

      const checkbox = screen.getByRole('checkbox')
      userEvent.click(checkbox)
      userEvent.click(
        getByPlaceholderText(
          checkbox.closest('[role="row"]') as HTMLElement,
          '- cf.targetManagementFlagConfiguration.selectVariation -'
        )
      )

      await waitFor(() => expect(screen.getByText(newFlag.variations[0].name as string)).toBeInTheDocument())
      userEvent.click(screen.getByText(newFlag.variations[0].name as string))

      const submitBtn = screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })
      await waitFor(() => {
        expect(submitBtn).toBeEnabled()
        expect(patchSegmentMock).not.toHaveBeenCalled()
        expect(refetchMock).not.toHaveBeenCalled()
      })

      userEvent.click(submitBtn)
    }

    test('it should call patchTargetGroup and refetch when the add flags form is submitted', async () => {
      patchSegmentMock.mockResolvedValue(undefined)
      const refetchMock = jest.fn()

      await openAndSubmitDialog(refetchMock)

      await waitFor(() => {
        expect(patchSegmentMock).toHaveBeenCalled()
        expect(refetchMock).toHaveBeenCalled()
      })
    })

    test('it should display the error message and not refetch when the add flags submission fails', async () => {
      const message = 'ERROR MESSAGE'
      patchSegmentMock.mockRejectedValue({ message })
      const refetchMock = jest.fn()

      await openAndSubmitDialog(refetchMock)

      await waitFor(() => {
        expect(patchSegmentMock).toHaveBeenCalled()
        expect(refetchMock).not.toHaveBeenCalled()
        expect(screen.getByText(message)).toBeInTheDocument()
      })
    })
  })
})
