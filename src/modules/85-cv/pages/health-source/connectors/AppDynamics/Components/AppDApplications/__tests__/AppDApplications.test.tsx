/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import AppDApplications from '../AppDApplications'

describe('AppDApplications', () => {
  test('should render AppDApplications with normal Select', () => {
    const refetchTier = jest.fn()
    const setCustomFieldAndValidation = jest.fn()
    const { container, rerender } = render(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={false}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={''}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={false}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    rerender(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={true}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={''}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={false}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    rerender(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={false}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={'formikAppDynamicsValue'}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={false}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render AppDApplications with multiInputType Select', () => {
    const refetchTier = jest.fn()
    const setCustomFieldAndValidation = jest.fn()
    const { container, rerender } = render(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={false}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={''}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={true}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    rerender(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={true}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={''}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={true}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    rerender(
      <TestWrapper>
        <AppDApplications
          applicationOptions={[]}
          applicationLoading={false}
          connectorIdentifier={'appdconn'}
          formikAppDynamicsValue={'<+input>'}
          refetchTier={refetchTier}
          setCustomFieldAndValidation={setCustomFieldAndValidation}
          isTemplate={true}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
