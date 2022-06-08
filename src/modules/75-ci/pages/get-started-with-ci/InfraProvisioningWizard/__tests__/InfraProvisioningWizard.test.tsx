/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { InfraProvisiongWizardStepId } from '../Constants'
import { InfraProvisioningWizard } from '../InfraProvisioningWizard'
import { repos } from '../mocks/repositories'

jest.mock('services/pipeline-ng', () => ({
  createPipelineV2Promise: jest.fn().mockImplementation(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        identifier: 'Default_Pipeline'
      }
    })
  ),
  useCreateTrigger: jest.fn().mockImplementation(() =>
    Promise.resolve({
      status: 'SUCCESS'
    })
  )
}))

jest.mock('services/cd-ng', () => ({
  useCreateDefaultScmConnector: jest.fn().mockImplementation(() => {
    return {
      mutate: () =>
        Promise.resolve({
          status: 'SUCCESS',
          data: {
            connectorResponseDTO: { connector: { identifier: 'identifier' } },
            connectorValidationResult: { status: 'SUCCESS' },
            secretResponseWrapper: { secret: { identifier: 'identifier' } }
          }
        })
    }
  }),
  useGetListOfAllReposByRefConnector: jest.fn().mockImplementation(() => {
    return { data: { data: repos, status: 'SUCCESS' }, refetch: jest.fn(), error: null, loading: false }
  })
}))

const pathParams = { accountId: 'accountId', orgIdentifier: 'orgId', projectIdentifier: 'projectId' }

describe('Render and test InfraProvisioningWizard', () => {
  test('Test Wizard Navigation with starting with Select Git Provider as first step', async () => {
    const { getByText } = render(
      <TestWrapper path={routes.toGetStartedWithCI({ ...pathParams, module: 'ci' })} pathParams={pathParams}>
        <InfraProvisioningWizard lastConfiguredWizardStepId={InfraProvisiongWizardStepId.SelectGitProvider} />
      </TestWrapper>
    )

    expect(getByText('ci.getStartedWithCI.codeRepo')).toBeTruthy()
    expect(getByText('next: ci.getStartedWithCI.selectRepo')).toBeTruthy()
  })
})
