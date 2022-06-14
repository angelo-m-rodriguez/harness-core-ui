/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, getByText, getAllByText } from '@testing-library/react'
import mockEnvironments from '@cd/components/PipelineSteps/DeployEnvStep/__tests__/mock.json'
import mockImport from 'framework/utils/mockImport'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import EnvironmentsList from '../EnvironmentsList/EnvironmentsList'

const mutate = jest.fn(() => {
  return Promise.resolve({ data: {} })
})

jest.mock('services/cd-ng', () => ({
  useGetYamlSchema: jest.fn(() => ({ data: null })),
  useGetEnvironmentListV2: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: mockEnvironments, refetch: jest.fn() })),
  useCreateEnvironmentV2: jest.fn(() => ({ data: null })),
  useUpsertEnvironmentV2: jest.fn(() => ({ data: null })),
  useDeleteEnvironmentV2: jest.fn(() => ({ mutate }))
}))

const testFn = jest.fn()
jest.mock('@harness/uicore', () => ({
  ...jest.requireActual('@harness/uicore'),
  useToaster: () => ({
    showSuccess: jest.fn(),
    showError: testFn
  })
}))

describe('EnvironmentsList', () => {
  test('should render loading correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListV2: () => ({ loading: true, data: [], refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )
    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('should render data correctly', async () => {
    mockImport('services/cd-ng', {
      useGetEnvironmentListV2: () => ({
        loading: false,
        error: undefined,
        data: mockEnvironments,
        refetch: jest.fn()
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )

    expect(getAllByText(document.body, mockEnvironments.data.content[0].environment.name)).toBeDefined()
    expect(getAllByText(document.body, mockEnvironments.data.content[1].environment.name)).toBeDefined()
  })

  test('Environment row click should redirect to environment details page', async () => {
    const { getByTestId, container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )

    const row = container.getElementsByClassName('TableV2--row TableV2--card TableV2--clickable')[0]
    await fireEvent.click(row!)
    await waitFor(() => getByTestId('location'))

    expect(getByTestId('location')).toHaveTextContent(
      '/account/dummy/cd/orgs/dummy/projects/dummy/environment/gjhjghjhg/details?sectionId=CONFIGURATION'
    )
  })

  test('should be possible to edit from Environment menu', async () => {
    const { getByTestId, container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('[data-icon="more"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="edit"]') as HTMLElement)
    await waitFor(() => getByTestId('location'))

    expect(getByTestId('location')).toHaveTextContent(
      '/account/dummy/cd/orgs/dummy/projects/dummy/environment/gjhjghjhg/details?sectionId=CONFIGURATION'
    )
  })

  test('should be possible to delete from Environment menu', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
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
  })

  test('Error handling during the deletion of items from the Environment Menu', async () => {
    mockImport('services/cd-ng', {
      useDeleteEnvironmentV2: () => ({
        mutate: jest.fn().mockRejectedValue({
          message: 'Error Detected'
        })
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/:module/orgs/:orgIdentifier/projects/:projectIdentifier/environment"
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsList response={mockEnvironments.data} refetch={() => jest.fn()} />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('[data-icon="more"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)
    const form = findDialogContainer()
    expect(form).toBeTruthy()
    expect(form).toMatchSnapshot()
    expect(getByText(form!, 'delete')).toBeDefined()
    fireEvent.click(getByText(form!, 'delete') as HTMLButtonElement)
    await waitFor(() => expect(testFn).toHaveBeenCalled())
  })
})
