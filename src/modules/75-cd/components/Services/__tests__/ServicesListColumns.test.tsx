/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, getAllByText, fireEvent, getByText, waitFor } from '@testing-library/react'
import { serviceListResponse, serviceRow } from '@cd/mock'
import mockImport from 'framework/utils/mockImport'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import { ServiceName, ServiceDescription, ServiceMenu } from '../ServicesListColumns/ServicesListColumns'

jest.mock('services/cd-ng', () => {
  return {
    useGetYamlSchema: jest.fn(() => ({ data: null })),
    useDeleteServiceV2: jest.fn(() => ({ mutate: jest.fn() })),
    useCreateServiceV2: jest.fn(() => ({ data: null })),
    useUpsertServiceV2: jest.fn(() => ({ data: null }))
  }
})
const mutate = jest.fn(() => {
  return Promise.resolve({ data: {} })
})

describe('ServiceListColumns', () => {
  test('ServiceName', () => {
    const { container } = render(
      <TestWrapper>
        <ServiceName {...serviceRow} />
      </TestWrapper>
    )

    expect(getAllByText(document.body, serviceRow.row.original.name)).toBeDefined()
    expect(getAllByText(document.body, 'Id: ' + serviceRow.row.original.identifier)).toBeDefined()
    expect(container).toMatchSnapshot()
  })
  test('ServiceDescription', () => {
    const { container } = render(
      <TestWrapper>
        <ServiceDescription {...serviceRow} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

describe('ServiceMenu', () => {
  const services = serviceListResponse?.data?.content?.map(service => service.service) || []
  test('Should render options edit/delete', () => {
    const { container } = render(
      <TestWrapper>
        <ServiceMenu data={services} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Should go to editModal by clicking edit', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <ServiceMenu data={services} />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="edit"]') as HTMLElement)
    expect(container).toMatchSnapshot()
    const form = findDialogContainer()
    expect(form).toBeTruthy()
    expect(form).toMatchSnapshot()

    expect(getByText(document.body, 'cancel')).toBeDefined()
    fireEvent.click(getByText(document.body, 'cancel') as HTMLButtonElement)
    expect(findDialogContainer()).toBeFalsy()
  })

  test('Should allow deleting', async () => {
    mockImport('services/cd-ng', {
      useDeleteServiceV2: () => ({
        mutate
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <ServiceMenu data={services} />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)
    let form = findDialogContainer()
    expect(form).toBeTruthy()
    expect(form).toMatchSnapshot()
    expect(getByText(document.body, 'confirm')).toBeDefined()
    fireEvent.click(getByText(document.body, 'confirm') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)
    form = findDialogContainer()
    expect(form).toBeTruthy()
    expect(getByText(document.body, 'cancel')).toBeDefined()
    fireEvent.click(getByText(document.body, 'cancel') as HTMLButtonElement)
    expect(findDialogContainer()).toBeFalsy()
  })
})
