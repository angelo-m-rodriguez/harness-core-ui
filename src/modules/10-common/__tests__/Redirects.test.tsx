/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import {
  RedirectToModuleTrialHomeFactory,
  RedirectToProjectFactory,
  RedirectToSubscriptionsFactory
} from '@common/Redirects'
import routes from '@common/RouteDefinitions'
import { TestWrapper } from '@common/utils/testUtils'
import { ModuleName } from 'framework/types/ModuleName'
import type { AppStoreContextProps } from 'framework/AppStore/AppStoreContext'

const testPath = routes.toAccountSettings({ accountId: ':accountId' })
const testPathParams = { accountId: 'accountId' }

const appStoreValues: Partial<AppStoreContextProps> = {
  selectedProject: { name: 'foo', identifier: 'projectId', modules: ['CV'], orgIdentifier: 'orgId' }
}

describe('Redirect', () => {
  test('RedirectToSubscriptionsFactory generates the correct redirect for CD', () => {
    const RedirectToSubscriptions = RedirectToSubscriptionsFactory(ModuleName.CD)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams}>
        <RedirectToSubscriptions />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSubscriptions({
        accountId: 'accountId',
        moduleCard: 'cd'
      })
    )
  })

  test('RedirectToSubscriptionsFactory generates the correct redirect for STO', () => {
    const RedirectToSubscriptions = RedirectToSubscriptionsFactory(ModuleName.STO)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams}>
        <RedirectToSubscriptions />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSubscriptions({
        accountId: 'accountId',
        moduleCard: 'sto'
      })
    )
  })

  test('RedirectToModuleTrialHomeFactory generates the correct redirect for CI', () => {
    const RedirectToModuleTrialHome = RedirectToModuleTrialHomeFactory(ModuleName.CI)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams} queryParams={{ source: 'foo' }}>
        <RedirectToModuleTrialHome />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toModuleTrialHome({
        accountId: 'accountId',
        module: 'ci',
        source: 'foo'
      })
    )
  })

  test('RedirectToModuleTrialHomeFactory generates the correct redirect for CF', () => {
    const RedirectToModuleTrialHome = RedirectToModuleTrialHomeFactory(ModuleName.CF)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams} queryParams={{ source: 'bar' }}>
        <RedirectToModuleTrialHome />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toModuleTrialHome({
        accountId: 'accountId',
        module: 'cf',
        source: 'bar'
      })
    )
  })

  test('RedirectToProjectFactory generates the correct redirect when project includes module', () => {
    const RedirectToModuleTrialHome = RedirectToProjectFactory(ModuleName.CV, routes.toCVHome)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams} defaultAppStoreValues={appStoreValues}>
        <RedirectToModuleTrialHome />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toProjectOverview({
        accountId: 'accountId',
        module: 'cv',
        orgIdentifier: 'orgId',
        projectIdentifier: 'projectId'
      })
    )
  })

  test("RedirectToProjectFactory redirects to module home when project doesn't include module", () => {
    const RedirectToModuleTrialHome = RedirectToProjectFactory(ModuleName.STO, routes.toSTOHome)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams} defaultAppStoreValues={appStoreValues}>
        <RedirectToModuleTrialHome />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSTOHome({
        accountId: 'accountId'
      })
    )
  })

  test('RedirectToProjectFactory redirects to module home when no project selected', () => {
    const RedirectToModuleTrialHome = RedirectToProjectFactory(ModuleName.STO, routes.toSTOHome)

    const { getByTestId } = render(
      <TestWrapper path={testPath} pathParams={testPathParams}>
        <RedirectToModuleTrialHome />
      </TestWrapper>
    )

    expect(getByTestId('location').innerHTML).toEqual(
      routes.toSTOHome({
        accountId: 'accountId'
      })
    )
  })
})
