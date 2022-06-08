/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdng from 'services/cd-ng'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import GitPopover, { GitPopoverProps } from '../GitPopover'

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.spyOn(cdng, 'useGetListOfBranchesWithStatus').mockImplementation((): any => {
  return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
})
jest.spyOn(cdng, 'useListGitSync').mockImplementation((): any => {
  return { data: gitConfigs, refetch: getListGitSync, loading: false }
})
jest.spyOn(cdng, 'useGetSourceCodeManagers').mockImplementation((): any => {
  return { data: sourceCodeManagers, refetch: jest.fn(), loading: false }
})

const getProps = (): GitPopoverProps => ({
  data: {
    repoIdentifier: 'identifier',
    branch: 'master'
  }
})

describe('GitPopover', () => {
  test('should return popover icon and content', () => {
    const props = getProps()
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <GitSyncStoreProvider>
          <GitPopover {...props} />
        </GitSyncStoreProvider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should return null when repoIdentifier and repoName both are not passed in props', () => {
    const { container } = render(
      <TestWrapper>
        <GitPopover data={{ branch: 'master' }} />
      </TestWrapper>
    )

    expect(container).toMatchInlineSnapshot(`<div />`)
  })

  test('should render gitpopover info when giticon is hovered', async () => {
    const props = getProps()
    const { getByTestId, getByText } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <GitSyncStoreProvider>
          <GitPopover {...props} />
        </GitSyncStoreProvider>
      </TestWrapper>
    )
    fireEvent.mouseOver(getByTestId('git-popover'))
    await waitFor(() => expect(getByText('PIPELINE.GITDETAILS')).toBeDefined())
    expect(getByText('repository')).toBeDefined()
    expect(getByText('pipelineSteps.deploy.inputSet.branch')).toBeDefined()
  })
})
