/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as cfServices from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import { mockFeatures, mockTargetGroup } from '@cf/pages/target-group-detail/__tests__/mocks'
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
    } as any)

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
})
