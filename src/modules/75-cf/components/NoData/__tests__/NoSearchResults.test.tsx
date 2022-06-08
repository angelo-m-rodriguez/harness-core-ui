/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import NoSearchResults, { NoSearchResultsProps } from '../NoSearchResults'

const renderComponent = (props: Partial<NoSearchResultsProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <NoSearchResults {...props} />
    </TestWrapper>
  )

describe('NoSearchResults', () => {
  test('it should display the correct message', async () => {
    renderComponent()

    expect(screen.getByText('cf.noResultMatch')).toBeInTheDocument()
  })

  test('it should allow the image URL to be overridden', async () => {
    const imageURL = 'TEST_URL'
    renderComponent({ imageURL })

    expect(screen.getByRole('img')).toHaveProperty('src', expect.stringContaining(imageURL))
  })
})
