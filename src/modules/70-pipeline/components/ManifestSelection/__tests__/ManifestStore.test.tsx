/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import ManifestStore from '../ManifestWizardSteps/ManifestStore'
import type { ManifestStepInitData } from '../ManifestInterface'

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn().mockImplementation(() => ({ data: {} }))
}))
describe('ManifestSelection tests', () => {
  test(`renders without crashing`, () => {
    const { container } = render(
      <TestWrapper>
        <ManifestStore
          name={'manifestSource'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={{} as ManifestStepInitData}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders K8 Manifest Store`, () => {
    const { container } = render(
      <TestWrapper>
        <ManifestStore
          name={'manifestSource'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={
            {
              connectorRef: {
                label: 'test',
                value: 'test',
                scope: 'project',
                live: true,
                connector: {
                  name: 'test',
                  identifier: 'test',
                  description: '',
                  orgIdentifier: 'default',
                  projectIdentifier: 'default',
                  tags: {},
                  type: 'Github',
                  spec: {
                    url: 'http://github.com/default',
                    validationRepo: 'Gdummy-repo',
                    authentication: {
                      type: 'Http',
                      spec: {
                        type: 'UsernameToken',
                        spec: {
                          username: 'default',
                          usernameRef: null,
                          tokenRef: 'secret'
                        }
                      }
                    },
                    apiAccess: null,
                    delegateSelectors: [],
                    executeOnDelegate: false,
                    type: 'Account'
                  }
                }
              },
              gitFetchType: 'Branch',
              paths: ['dsfs'],
              repoName: 'demoRepo',
              branch: 'demoBranch',
              store: 'Github',
              selectedManifest: 'K8sManifest'
            } as ManifestStepInitData
          }
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
