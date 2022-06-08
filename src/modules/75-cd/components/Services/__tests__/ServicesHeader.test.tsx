/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, getByText } from '@testing-library/react'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import { ServicesHeader } from '@cd/components/Services/ServicesHeader/ServicesHeader'

jest.mock('services/cd-ng', () => {
  return {
    useGetYamlSchema: jest.fn(() => ({ data: null })),
    useDeleteServiceV2: jest.fn(() => ({ mutate: jest.fn() })),
    useCreateServicesV2: jest.fn(() => ({ data: null })),
    useCreateServiceV2: jest.fn(() => ({ data: null })),
    useUpsertServiceV2: jest.fn(() => ({ data: null }))
  }
})

describe('ServiceHeader', () => {
  test('render', () => {
    const { container } = render(
      <TestWrapper
        path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <ServicesHeader />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should open and close the Services modal', async () => {
    const { container } = render(
      <TestWrapper>
        <ServicesHeader />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('[data-testid="add-service"]') as HTMLElement)

    const dialog = findDialogContainer() as HTMLElement
    expect(dialog).toMatchSnapshot()
    expect(dialog).toBeTruthy()
    expect(getByText(document.body, 'cancel')).toBeDefined()
    fireEvent.click(getByText(document.body, 'cancel') as HTMLButtonElement)
    expect(findDialogContainer()).toBeFalsy()
  })
})
