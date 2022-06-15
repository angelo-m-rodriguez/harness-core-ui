/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import STOSideNav from '../STOSideNav'

const testPathOverview = routes.toSTOOverview({ accountId: ':accountId' })
const testPathProjectOverview = routes.toSTOProjectOverview({
  accountId: ':accountId',
  orgIdentifier: ':orgIdentifier',
  projectIdentifier: ':projectIdentifier'
})
//'/account/:accountId/sto/orgs/:orgIdentifier/projects/:projectIdentifier/overview'
const testParams = {
  accountId: 'accountId',
  orgIdentifier: 'orgIdentifier',
  projectIdentifier: 'projectIdentifier',
  module: 'sto'
}

jest.mock('@projects-orgs/components/ProjectSelector/ProjectSelector', () => ({
  ProjectSelector: function ProjectSelectorComp(props: any) {
    return (
      <button
        onClick={() => props.onSelect({ identifier: 'newProject', orgIdentifier: 'newOrg' })}
        id="projectSelector"
      />
    )
  }
}))

describe('STO side nav tests', () => {
  test('renders account path', () => {
    const { container } = render(
      <TestWrapper path={testPathOverview} pathParams={testParams}>
        <STOSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('renders project path', () => {
    const { container } = render(
      <TestWrapper path={testPathProjectOverview} pathParams={testParams}>
        <STOSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('switches to project overview when app store has project', async () => {
    const { container, getByTestId } = render(
      <TestWrapper
        path={testPathOverview}
        pathParams={testParams}
        defaultAppStoreValues={{ selectedProject: { name: 'Target', identifier: 'PROJECT', orgIdentifier: 'ORG' } }}
      >
        <STOSideNav />
      </TestWrapper>
    )

    const projectSelector = await waitFor(() => container.querySelector('#projectSelector'))
    fireEvent.click(projectSelector!)

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSTOProjectOverview({
        accountId: 'accountId',
        orgIdentifier: 'newOrg',
        projectIdentifier: 'newProject'
      })
    )
  })

  test('switches to project overview when project selected', async () => {
    const { container, getByTestId } = render(
      <TestWrapper path={testPathOverview} pathParams={testParams}>
        <STOSideNav />
      </TestWrapper>
    )

    const projectSelector = await waitFor(() => container.querySelector('#projectSelector'))
    fireEvent.click(projectSelector!)

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSTOProjectOverview({
        accountId: 'accountId',
        orgIdentifier: 'newOrg',
        projectIdentifier: 'newProject'
      })
    )
  })
})
