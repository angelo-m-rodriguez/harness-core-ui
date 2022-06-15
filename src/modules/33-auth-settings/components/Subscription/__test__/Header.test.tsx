/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Header } from '../Header'

describe('Header', () => {
  test('cf', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="cf" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.cf.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('cf', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="cf" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.cf.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('cd', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="cd" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.cd.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('ci', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="ci" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.ci.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('ce', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="ce" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.ce.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('cv', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="cv" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.cv.continuous common.plans.subscription')).toBeInTheDocument()
  })

  test('sto', () => {
    const { getByText } = render(
      <TestWrapper>
        <Header module="sto" stepDescription="" step={1} />
      </TestWrapper>
    )
    expect(getByText('common.purpose.sto.continuous common.plans.subscription')).toBeInTheDocument()
  })
})
