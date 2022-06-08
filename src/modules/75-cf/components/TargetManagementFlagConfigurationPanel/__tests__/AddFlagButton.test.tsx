/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as cfServices from 'services/cf'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import mockFeature from '@cf/utils/testData/data/mockFeature'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import AddFlagButton, { AddFlagButtonProps } from '../AddFlagButton'

const renderComponent = (props: Partial<AddFlagButtonProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <AddFlagButton
        planEnforcementProps={{}}
        onAdd={jest.fn()}
        existingFlagIds={[]}
        includePercentageRollout={false}
        item={mockTarget}
        title="Modal Title"
        {...props}
      />
    </TestWrapper>
  )

describe('AddFlagButton', () => {
  const useGetAllFeatures = jest.spyOn(cfServices, 'useGetAllFeatures')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetAllFeatures.mockReturnValue({
      data: { pageIndex: 0, pageSize: CF_DEFAULT_PAGE_SIZE, pageCount: 1, itemCount: 1, features: [mockFeature] },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)
  })

  test('it should show the modal when the button is clicked', async () => {
    const title = 'TEST MODAL TITLE'
    renderComponent({ title })

    expect(screen.queryByText(title)).not.toBeInTheDocument()

    userEvent.click(screen.getByRole('button', { name: 'cf.targetManagementFlagConfiguration.addFlag' }))

    await waitFor(() => expect(screen.getByText(title)).toBeInTheDocument())
  })
})
