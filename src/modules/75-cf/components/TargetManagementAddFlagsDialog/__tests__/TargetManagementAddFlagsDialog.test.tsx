/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getByPlaceholderText, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import type { Feature, Features } from 'services/cf'
import * as cfServices from 'services/cf'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import TargetManagementAddFlagsDialog, { TargetManagementAddFlagsDialogProps } from '../TargetManagementAddFlagsDialog'

const mockFlags = [
  {
    identifier: 'f1',
    name: 'Flag 1',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' },
      { identifier: 'v3' }
    ]
  },
  {
    identifier: 'f2',
    name: 'Flag 2',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ]
  },
  {
    identifier: 'f3',
    name: 'Flag 3',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ]
  },
  {
    identifier: 'f4',
    name: 'Flag 4',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ]
  }
] as Feature[]

const mockResponse = (flags: Feature[] = mockFlags): Features =>
  ({
    features: flags,
    pageIndex: 0,
    pageSize: CF_DEFAULT_PAGE_SIZE,
    itemCount: flags.length,
    pageCount: Math.ceil(flags.length / CF_DEFAULT_PAGE_SIZE),
    version: 1
  } as Features)

jest.mock('@common/components/ContainerSpinner/ContainerSpinner', () => ({
  ContainerSpinner: () => <span data-testid="container-spinner">Container Spinner</span>
}))

const renderComponent = (props: Partial<TargetManagementAddFlagsDialogProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <TargetManagementAddFlagsDialog
        item={mockTarget}
        title="Add Flags"
        hideModal={jest.fn()}
        onAdd={jest.fn()}
        existingFlagIds={[]}
        includePercentageRollout={false}
        {...props}
      />
    </TestWrapper>
  )

describe('TargetManagementAddFlagsDialog', () => {
  const useGetAllFeaturesMock = jest.spyOn(cfServices, 'useGetAllFeatures')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)
  })

  test('it should show the title of the dialog', async () => {
    const title = 'TEST TITLE'
    renderComponent({ title })

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  test('it should disable the submit button until a flag is added', async () => {
    renderComponent()

    const btn = screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlags' })
    expect(btn).toBeInTheDocument()
    expect(btn).toBeDisabled()

    const checkbox = screen.getAllByRole('checkbox')[0]
    userEvent.click(checkbox)
    userEvent.click(
      getByPlaceholderText(
        checkbox.closest('[role="row"]') as HTMLElement,
        '- cf.targetManagementFlagConfiguration.selectVariation -'
      )
    )

    await waitFor(() => expect(screen.getByText(mockFlags[0].variations[0].name as string)).toBeInTheDocument())
    userEvent.click(screen.getByText(mockFlags[0].variations[0].name as string))

    await waitFor(() => expect(btn).toBeEnabled())
  })

  test('it should show the error message when an error occurs fetching the flags', async () => {
    const message = 'ERROR MESSAGE'
    const refetchMock = jest.fn()

    useGetAllFeaturesMock.mockReturnValue({
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

  test('it should show the spinner when initially loading', async () => {
    useGetAllFeaturesMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent()

    expect(screen.getByTestId('container-spinner')).toBeInTheDocument()
  })

  test('it should show the no flags message when there are no flags', async () => {
    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse([]),
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent()

    expect(screen.getByText('cf.targetManagementFlagConfiguration.noFlagsAvailable')).toBeInTheDocument()
  })

  test('it should show the no search results message when a search has been made that returns no results', async () => {
    renderComponent()

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse([]),
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    await userEvent.type(screen.getByRole('searchbox'), 'TEST SEARCH TERM')

    await waitFor(() => expect(screen.getByTestId('no-data-no-search-results')).toBeInTheDocument())
  })

  test('it should show the spinner when loading search results', async () => {
    renderComponent()

    useGetAllFeaturesMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    } as any)

    await userEvent.type(screen.getByRole('searchbox'), 'TEST SEARCH TERM')

    await waitFor(() => expect(screen.getByTestId('container-spinner')).toBeInTheDocument())
  })

  test('it should allow selection of a percentage rollout when include percentage rollout is set', async () => {
    renderComponent({ includePercentageRollout: true })

    const checkbox = screen.getAllByRole('checkbox')[0]
    userEvent.click(checkbox)
    userEvent.click(
      getByPlaceholderText(
        checkbox.closest('[role="row"]') as HTMLElement,
        '- cf.targetManagementFlagConfiguration.selectVariation -'
      )
    )

    await waitFor(() => expect(screen.getByText('cf.featureFlags.percentageRollout')).toBeInTheDocument())
    userEvent.click(screen.getByText('cf.featureFlags.percentageRollout'))

    await waitFor(() => expect(screen.getByText('cf.percentageRollout.invalidTotalError')).toBeInTheDocument())
  })
})
