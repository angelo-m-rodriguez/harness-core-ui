/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
import React from 'react'
import { getByRole, getByText, render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as cfServices from 'services/cf'
import * as cdNgServices from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import * as gitSync from '@cf/hooks/useGitSync'
import * as planEnforcement from '@cf/hooks/usePlanEnforcement'
import TargetDetailPage from '../TargetDetailPage'

jest.mock('@common/components/ContainerSpinner/ContainerSpinner', () => ({
  ContainerSpinner: () => <span data-testid="container-spinner">Container Spinner</span>
}))

jest.mock('../components/FlagSettings/FlagSettings', () => ({
  __esModule: true,
  default: () => <span data-testid="flag-settings">Flag Settings</span>
}))

const renderComponent = (): RenderResult =>
  render(
    <TestWrapper
      path={routes.toCFTargetDetails({
        accountId: 'accId',
        orgIdentifier: 'orgId',
        projectIdentifier: 'projectId',
        targetIdentifier: 'targetId'
      })}
      queryParams={{ environment: 'dev' }}
    >
      <TargetDetailPage />
    </TestWrapper>
  )

describe('TargetDetailPage', () => {
  const useGetTargetMock = jest.spyOn(cfServices, 'useGetTarget')
  const useGetEnvironmentMock = jest.spyOn(cdNgServices, 'useGetEnvironment')
  const useGitSyncMock = jest.spyOn(gitSync, 'useGitSync')
  const usePlanEnforcementMock = jest.spyOn(planEnforcement, 'default')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetTargetMock.mockReturnValue({
      data: {
        createdAt: 1635935343546,
        environment: 'dev',
        identifier: 'Target_1',
        name: 'Target 1',
        account: 'acc1',
        org: 'org1',
        project: 'p1',
        segments: []
      },
      refetch: jest.fn(),
      loading: false,
      error: null
    } as any)

    useGetEnvironmentMock.mockReturnValue({
      data: { data: { name: 'Environment Name' } },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    useGitSyncMock.mockReturnValue({ isGitSyncActionsEnabled: false } as any)
    usePlanEnforcementMock.mockReturnValue({ isPlanEnforcementEnabled: false } as any)
  })

  describe('loading state', () => {
    test('it should show the loading spinner when the target is loading', async () => {
      useGetTargetMock.mockReturnValue({ data: null, loading: true, error: null, refetch: jest.fn() } as any)

      renderComponent()

      expect(screen.getByTestId('container-spinner')).toBeInTheDocument()
    })

    test('it should show the loading spinner when the env is loading', async () => {
      useGetEnvironmentMock.mockReturnValue({ data: null, loading: true, error: null, refetch: jest.fn() } as any)

      renderComponent()

      expect(screen.getByTestId('container-spinner')).toBeInTheDocument()
    })

    test('it should not show the loading spinner when target and env are loaded', async () => {
      renderComponent()

      expect(screen.queryByTestId('container-spinner')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    test('it should show the error message if the target call fails', async () => {
      const errorMessage = 'ERROR MESSAGE'
      useGetTargetMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message: errorMessage },
        refetch: jest.fn()
      } as any)

      renderComponent()

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    test('it should show the error message if the env call fails', async () => {
      const errorMessage = 'ERROR MESSAGE'
      useGetEnvironmentMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message: errorMessage },
        refetch: jest.fn()
      } as any)

      renderComponent()

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    test('it should refetch both target and env when the retry button is pressed', async () => {
      const refetchTargetMock = jest.fn()
      const refetchEnvMock = jest.fn()

      useGetTargetMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message: 'error' },
        refetch: refetchTargetMock
      } as any)
      useGetEnvironmentMock.mockReturnValue({
        data: null,
        loading: false,
        error: { message: 'error' },
        refetch: refetchEnvMock
      } as any)

      renderComponent()

      expect(refetchTargetMock).not.toHaveBeenCalled()
      expect(refetchEnvMock).not.toHaveBeenCalled()

      userEvent.click(screen.getByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(refetchTargetMock).toHaveBeenCalled()
        expect(refetchEnvMock).toHaveBeenCalled()
      })
    })
  })

  describe('header', () => {
    function getHeader(): HTMLElement {
      return document.querySelector('.PageHeader--container') as HTMLElement
    }

    test('it should display the name and created date of the Target', async () => {
      renderComponent()
      const header = getHeader()

      expect(getByText(header, 'Target 1')).toBeInTheDocument()
      expect(getByText(header, 'cf.targetDetail.createdOnDate')).toBeInTheDocument()
    })

    test('it should include a link back to the Target listing page', async () => {
      renderComponent()
      const header = getHeader()

      expect(getByRole(header, 'link', { name: 'cf.shared.targetManagement: cf.shared.targets' })).toBeInTheDocument()
    })
  })
})
