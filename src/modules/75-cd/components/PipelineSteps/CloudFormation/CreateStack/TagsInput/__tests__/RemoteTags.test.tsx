/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiTypeInputType } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdServices from 'services/cd-ng'
import RemoteTags from '../RemoteTags'

const mockedConnectorData = {
  name: 'harness-qa',
  identifier: 'harnessqa',
  description: null,
  orgIdentifier: null,
  projectIdentifier: null,
  tags: {},
  type: 'CEAws',
  spec: {
    featuresEnabled: ['VISIBILITY', 'OPTIMIZATION', 'BILLING'],
    tenantId: 'b229b2bb-5f33-4d22-bce0-730f6474e906',
    subscriptionId: '20d6a917-99fa-4b1b-9b2e-a3d624e9dcf0',
    billingExportSpec: {
      storageAccountName: 'cesrcbillingstorage',
      containerName: 'cesrcbillingcontainer',
      directoryName: 'billingdirectorycommon',
      reportName: 'cebillingreportharnessqa-lightwing',
      subscriptionId: '20d6a917-99fa-4b1b-9b2e-a3d624e9dcf0'
    }
  }
}

const mockedConnectorDataResponse = { response: mockedConnectorData }

jest.spyOn(cdServices, 'useGetConnector').mockImplementation(
  () =>
    ({
      loading: false,
      refetch: jest.fn(),
      data: mockedConnectorDataResponse
    } as any)
)

describe('Test cloudformation remote tags', () => {
  test('should render with no initial data', () => {
    const data = {
      type: 'CreateStack',
      name: 'createStack',
      timeout: '10m',
      identifier: 'createStack',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          stackName: 'createStack',
          connectorRef: 'demo_aws',
          region: 'eu-west-1',
          tags: {
            type: 'Remote',
            spec: {
              store: {
                spec: {}
              }
            }
          }
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <RemoteTags
          readonly={false}
          showModal
          onClose={() => undefined}
          setFieldValue={() => undefined}
          initialValues={data}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          regions={[]}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render click new connector modal', async () => {
    const data = {
      type: 'CreateStack',
      name: 'createStack',
      timeout: '10m',
      identifier: 'createStack',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          stackName: 'createStack',
          connectorRef: 'demo_aws',
          region: 'eu-west-1',
          tags: {
            type: 'Remote',
            spec: {
              store: {
                type: 'Github',
                spec: {
                  branch: 'main',
                  connectorRef: 'github_demo',
                  gitFetchType: 'Branch',
                  paths: ['test.com']
                }
              }
            }
          }
        }
      }
    }
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <RemoteTags
          readonly={false}
          showModal
          onClose={() => undefined}
          setFieldValue={() => undefined}
          initialValues={data}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          regions={[]}
        />
      </TestWrapper>
    )
    const newConnButton = getByText('newLabel common.repo_provider.githubLabel connector')
    await act(async () => userEvent.click(newConnButton))
    expect(container).toMatchSnapshot()
  })
})
