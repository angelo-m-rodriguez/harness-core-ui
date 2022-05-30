/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { useGetAllTags } from 'services/custom-dashboards'
import FilterTagsSideBar, { FilterTagsSideBarProps } from '../FilterTagsSideBar'

const accountId = 'fmy6_hj3'

jest.mock('services/custom-dashboards', () => ({
  useGetAllTags: jest.fn()
}))
const useGetAllTagsMock = useGetAllTags as jest.Mock

const renderComponent = (props: Partial<FilterTagsSideBarProps> = {}): RenderResult =>
  render(
    <TestWrapper path={routes.toCustomDashboardHome({ accountId })} pathParams={{ accountId: accountId }}>
      <FilterTagsSideBar setFilteredTags={jest.fn()} {...props} />
    </TestWrapper>
  )

const buildTagsResponse = (isLoading: boolean, tags = '') => {
  return {
    data: {
      resource: {
        tags: tags
      }
    },
    loading: isLoading
  }
}

describe('FilterTagsSideBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it should display loading before data is loaded', async () => {
    useGetAllTagsMock.mockReturnValue(buildTagsResponse(true))

    renderComponent()

    expect(screen.getByText('dashboards.homePage.filterByTags')).toBeInTheDocument()
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  test('it should display no tags message when no filters', async () => {
    useGetAllTagsMock.mockReturnValue(buildTagsResponse(false))

    renderComponent()

    expect(screen.getByText('dashboards.homePage.noTags')).toBeInTheDocument()
  })

  test('it should display each tag', async () => {
    useGetAllTagsMock.mockReturnValue(buildTagsResponse(false, 'one,two'))

    renderComponent()

    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  test('it should invoke the set state callback when a tag is clicked', async () => {
    const setFilteredTagsMock = jest.fn()
    useGetAllTagsMock.mockReturnValue(buildTagsResponse(false, 'one,two'))

    renderComponent({ setFilteredTags: setFilteredTagsMock })
    expect(setFilteredTagsMock).not.toHaveBeenCalled()

    const tagButton = screen.getByText('one') as HTMLButtonElement
    await act(async () => {
      userEvent.click(tagButton)
    })

    await waitFor(() => expect(setFilteredTagsMock).toHaveBeenCalled())
    const anonFunction = setFilteredTagsMock.mock.calls[0][0]
    expect(anonFunction.call(null, ['zero'])).toEqual(['zero', 'one'])
  })

  test('it should not add duplicate tags when clicked', async () => {
    const setFilteredTagsMock = jest.fn()
    useGetAllTagsMock.mockReturnValue(buildTagsResponse(false, 'one,two'))

    renderComponent({ setFilteredTags: setFilteredTagsMock })
    expect(setFilteredTagsMock).not.toHaveBeenCalled()

    const tagButton = screen.getByText('one') as HTMLButtonElement
    await act(async () => {
      userEvent.click(tagButton)
    })

    await waitFor(() => expect(setFilteredTagsMock).toHaveBeenCalled())
    const anonFunction = setFilteredTagsMock.mock.calls[0][0]
    expect(anonFunction.call(null, ['one'])).toEqual(['one'])
  })
})
