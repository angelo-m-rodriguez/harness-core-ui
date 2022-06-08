/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { mockFeatures } from '@cf/pages/target-group-detail/__tests__/mocks'
import VariationsCell, { VariationsCellProps } from '../VariationsCell'

const MockReasonTooltip: FC = ({ children }) => <>{children}</>

const renderComponent = (props: Partial<VariationsCellProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <VariationsCell
        row={{ original: mockFeatures[0] }}
        value={{ disabled: false, ReasonTooltip: MockReasonTooltip }}
        {...props}
      />
    </TestWrapper>
  )

describe('VariationsCell', () => {
  test('it should display the variation select', async () => {
    renderComponent()

    const input = screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')
    expect(input).toBeInTheDocument()

    userEvent.click(input)

    await waitFor(() => {
      mockFeatures[0].variations.forEach(({ name, identifier }) => {
        expect(screen.getByText(name || identifier)).toBeInTheDocument()
      })
    })
  })

  test('it should disable the input when the value prop contains disabled true', async () => {
    renderComponent({ value: { disabled: true, ReasonTooltip: MockReasonTooltip } })

    expect(screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')).toBeDisabled()
  })

  test('it should not disable the input when the value prop does not contain disabled true', async () => {
    renderComponent({ value: { ReasonTooltip: MockReasonTooltip } })

    expect(screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')).toBeEnabled()
  })
})
