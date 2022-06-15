/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import TagsStepTwo from '../TagsStepTwo'

describe('Test cloudformation remote tags step two', () => {
  test('should render with no initial data', () => {
    const tags = {
      type: 'Remote',
      spec: {
        store: {
          spec: {}
        }
      }
    }
    const data = {
      spec: {
        configuration: {
          connectorRef: 'demo_aws',
          tags
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          tags
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <TagsStepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should error on submit', async () => {
    const tags = {
      type: 'Remote',
      spec: {
        identifier: '',
        store: {
          spec: {
            connectorRef: {
              connector: {
                spec: {
                  type: 'Account'
                }
              }
            },
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            branch: RUNTIME_INPUT_VALUE,
            paths: RUNTIME_INPUT_VALUE
          }
        }
      }
    }
    const data = {
      spec: {
        configuration: {
          connectorRef: 'demo_aws',
          tags
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          tags
        }
      }
    }
    const { container, getByTestId } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <TagsStepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    const submit = getByTestId('submit')
    await act(async () => userEvent.click(submit))
    expect(container).toMatchSnapshot()
  })

  test('should render with github commit info', () => {
    const tags = {
      type: 'Remote',
      spec: {
        store: {
          type: 'Github',
          spec: {
            connectorRef: 'account.demo_ref',
            gitFetchType: 'pipelineSteps.commitIdValue',
            commitId: 'main',
            paths: ['test']
          }
        }
      }
    }
    const data = {
      spec: {
        configuration: {
          tags
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          tags
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <TagsStepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should submit with', async () => {
    const tags = {
      spec: {
        store: {
          type: 'Github',
          spec: {
            branch: 'main',
            connectorRef: 'test',
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: ['test']
          }
        }
      }
    }
    const data = {
      spec: {
        configuration: {
          tags
        }
      }
    }
    const prevStep = {
      selectedConnector: 'S3',
      spec: {
        configuration: {
          tags
        }
      }
    }
    const { container, getByTestId } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <TagsStepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    const submit = getByTestId('submit')
    await act(async () => userEvent.click(submit))
    expect(container).toMatchSnapshot()
  })
})
