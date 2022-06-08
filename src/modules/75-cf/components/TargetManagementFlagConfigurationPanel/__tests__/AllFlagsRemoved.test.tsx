/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import AllFlagsRemoved from '../AllFlagsRemoved'

describe('AllFlagsRemoved', () => {
  test('it should display the correct message', async () => {
    render(
      <TestWrapper>
        <AllFlagsRemoved />
      </TestWrapper>
    )

    expect(screen.getByText('cf.targetManagementFlagConfiguration.allFlagsRemoved')).toBeInTheDocument()
  })
})
