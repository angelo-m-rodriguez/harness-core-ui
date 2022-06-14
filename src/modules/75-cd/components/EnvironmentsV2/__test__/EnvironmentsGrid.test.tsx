/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, getByText } from '@testing-library/react'
import mockEnvironments from '@cd/components/PipelineSteps/DeployEnvStep/__tests__/mock.json'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import EnvironmentsGrid from '../EnvironmentsGrid/EnvironmentsGrid'

const mutate = jest.fn(() => {
  return Promise.resolve({ data: {} })
})

const testFn = jest.fn()
jest.mock('@harness/uicore', () => ({
  ...jest.requireActual('@harness/uicore'),
  useToaster: () => ({
    showSuccess: testFn,
    showError: jest.fn()
  })
}))

jest.mock('services/cd-ng', () => ({
  useGetYamlSchema: jest.fn(() => ({ data: null })),
  useGetEnvironmentListV2: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: mockEnvironments, refetch: jest.fn() })),
  useCreateEnvironmentV2: jest.fn(() => ({ data: null })),
  useUpsertEnvironmentV2: jest.fn(() => ({ data: null })),
  useDeleteEnvironmentV2: jest.fn(() => ({ mutate }))
}))

describe('EnvironmentsGrid', () => {
  test('renders Environment Grid', () => {
    const { container } = render(
      <TestWrapper>
        <EnvironmentsGrid response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should be possible to edit from Environment Card menu', async () => {
    const { getByTestId, container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsGrid response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('[data-icon="more"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="edit"]') as HTMLElement)
    await waitFor(() => getByTestId('location'))

    expect(getByTestId('location')).toHaveTextContent(
      '/account/dummy/cd/orgs/dummy/projects/dummy/environment/gjhjghjhg/details?sectionId=CONFIGURATION'
    )
  })

  test('should be possible to delete from Environment Card menu', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsGrid response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('[data-icon="more"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)
    const form = findDialogContainer()
    expect(form).toBeTruthy()
    expect(form).toMatchSnapshot()
    expect(getByText(form!, 'delete')).toBeDefined()
    fireEvent.click(getByText(form!, 'delete') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))
    await waitFor(() => expect(testFn).toHaveBeenCalled())
  })
})
