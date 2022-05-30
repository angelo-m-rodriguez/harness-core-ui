/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdServices from 'services/cd-ng'

import { InlineParameterFile } from '../InlineParameterFile'

const renderComponent = (props: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <InlineParameterFile {...props} />
    </TestWrapper>
  )
}

describe('Test cloudformation inline parameter with no data', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })
  test('should render with no data', () => {
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: {}
    }
    const { container } = renderComponent(props)
    expect(container).toMatchSnapshot()
  })

  test('should render with git data', () => {
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: {},
      awsConnectorRef: 'test',
      type: 'git',
      region: 'ireland',
      git: {
        gitConnectorRef: 'test',
        isBranch: true,
        filePath: 'file/path',
        branch: 'main'
      }
    }
    const { container } = renderComponent(props)
    expect(container).toMatchSnapshot()
  })

  test('should render with git data and make an api request', async () => {
    jest.spyOn(cdServices, 'useCFParametersForAws').mockReturnValue({
      loading: false,
      refetch: jest.fn(),
      mutate: jest.fn().mockResolvedValue({
        data: {
          paramKey: 'test',
          paramType: 'String'
        }
      }),
      data: {
        status: 'SUCCESS',
        data: {
          paramKey: 'test',
          paramType: 'String'
        }
      }
    } as any)
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: {},
      awsConnectorRef: 'test',
      type: 'git',
      region: 'ireland',
      git: {
        gitConnectorRef: 'test',
        isBranch: true,
        filePath: 'file/path',
        branch: 'main'
      }
    }
    const { container, getByText } = renderComponent(props)
    const getParams = getByText('cd.cloudFormation.retrieveNames')
    act(() => {
      userEvent.click(getParams)
    })
    expect(container).toMatchSnapshot()
  })

  test('api request errors', async () => {
    jest.spyOn(cdServices, 'useCFParametersForAws').mockReturnValueOnce({
      loading: false,
      refetch: jest.fn(),
      mutate: jest.fn(),
      error: { message: 'useCFParametersForAws error' }
    } as any)
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: {},
      awsConnectorRef: 'test',
      type: 'git',
      region: 'ireland',
      git: {
        gitConnectorRef: 'test',
        isBranch: true,
        filePath: 'file/path',
        branch: 'main'
      }
    }
    const { container, getByText } = renderComponent(props)
    const getParams = getByText('cd.cloudFormation.retrieveNames')
    act(() => {
      userEvent.click(getParams)
    })
    expect(container).toMatchSnapshot()
  })

  test('should error when trying to retrieve data with no git values', async () => {
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: [
        {
          name: 'test',
          value: 'test'
        }
      ],
      awsConnectorRef: '',
      type: '',
      region: '',
      git: {
        gitConnectorRef: 'test',
        isBranch: true,
        filePath: 'file/path',
        branch: 'main'
      }
    }
    const { getByText } = renderComponent(props)
    const getParams = getByText('cd.cloudFormation.retrieveNames')
    act(() => {
      userEvent.click(getParams)
    })
    expect(getByText('cd.cloudFormation.errors.getParam')).toBeTruthy()
  })

  test('should render and remove/add values', async () => {
    const props = {
      onClose: () => undefined,
      onSubmit: () => undefined,
      isOpen: true,
      initialValues: [
        {
          name: 'test',
          value: 'test'
        }
      ],
      awsConnectorRef: 'test',
      type: 'git',
      region: 'ireland',
      git: {
        gitConnectorRef: 'test',
        isBranch: true,
        filePath: 'file/path',
        branch: 'main'
      }
    }
    const { container, getByTestId } = renderComponent(props)
    const remove = getByTestId('remove-header-0')
    act(() => {
      userEvent.click(remove)
    })

    const add = getByTestId('add-header')
    act(() => {
      userEvent.click(add)
    })
    expect(container).toMatchSnapshot()
  })
})
