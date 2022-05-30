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
import StepTwo from '../RemoteStepTwo'

describe('Test cloudformation remote wizard step one', () => {
  test('should render with no initial data', () => {
    const templateFile = {
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
          templateFile
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          templateFile
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={undefined}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should error on submit', async () => {
    const templateFile = {
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
          templateFile
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          templateFile
        }
      }
    }
    const { container, getByTestId } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={undefined}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    const submit = getByTestId('submit')
    act(() => {
      userEvent.click(submit)
    })
    expect(container).toMatchSnapshot()
  })

  test('should render with github branch info', () => {
    const templateFile = {
      type: 'Remote',
      spec: {
        store: {
          spec: {
            connectorRef: {
              connector: {
                spec: {
                  connectionType: 'Account'
                }
              }
            },
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            branch: 'main',
            paths: ['test']
          }
        }
      }
    }
    const data = {
      spec: {
        configuration: {
          templateFile
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          templateFile
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={undefined}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with github commit info', () => {
    const templateFile = {
      type: 'Remote',
      spec: {
        store: {
          spec: {
            connectorRef: 'demo_ref',
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
          templateFile
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          templateFile
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={undefined}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with github commit info', () => {
    const templateFile = {
      type: 'Remote',
      spec: {
        store: {
          spec: {
            connectorRef: 'demo_ref',
            gitFetchType: 'pipelineSteps.commitIdValue',
            commitId: 'main',
            paths: ['test']
          }
        }
      }
    }
    const data = {
      type: 'CreateStack',
      name: 'createStack',
      timeout: '10m',
      identifier: 'createStack',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          templateFile
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        provisionerIdentifier: 'createStack',
        configuration: {
          templateFile
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={undefined}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render parameters', () => {
    const parameters = [
      {
        identifier: 'test',
        store: {
          type: 'github',
          spec: {
            branch: 'main',
            connectorRef: 'testRef',
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: ['test/test']
          }
        }
      }
    ]
    const data = {
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={0}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with runtime parameters', () => {
    const parameters = [
      {
        identifier: 'test',
        store: {
          type: 'github',
          spec: {
            branch: RUNTIME_INPUT_VALUE,
            connectorRef: 'testRef',
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: RUNTIME_INPUT_VALUE
          }
        }
      }
    ]
    const data = {
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const prevStep = {
      selectedConnector: 'Github',
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={0}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render with runtime parameters', () => {
    const parameters = [
      {
        identifier: 'test',
        store: {
          type: 'Github',
          spec: {
            branch: RUNTIME_INPUT_VALUE,
            repoName: RUNTIME_INPUT_VALUE,
            connectorRef: {
              connector: {
                spec: {
                  connectionType: 'Account'
                }
              }
            },
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: RUNTIME_INPUT_VALUE
          }
        }
      }
    ]
    const data = {
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const prevStep = {
      selectedConnector: {
        connector: {
          spec: {
            connectionType: 'Account'
          }
        }
      },
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={0}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('click add and remove paths', async () => {
    const parameters = [
      {
        identifier: 'test',
        store: {
          type: 'S3Url',
          spec: {
            branch: 'main',
            connectorRef: 'test',
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: []
          }
        }
      }
    ]
    const data = {
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const prevStep = {
      selectedConnector: 'S3',
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const { container, getByTestId } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={0}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    const addButton = getByTestId('add-header')
    act(() => {
      userEvent.click(addButton)
    })
    expect(container).toMatchSnapshot()

    const removeButton = getByTestId('remove-header-0')
    act(() => {
      userEvent.click(removeButton)
    })
    expect(container).toMatchSnapshot()
  })

  test('submit with params', async () => {
    const parameters = [
      {
        identifier: 'test',
        store: {
          type: 'S3Url',
          spec: {
            branch: 'main',
            connectorRef: 'test',
            gitFetchType: 'pipelineSteps.deploy.inputSet.branch',
            paths: ['test']
          }
        }
      }
    ]
    const data = {
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const prevStep = {
      selectedConnector: 'S3',
      spec: {
        configuration: {
          parameters
        }
      }
    }
    const { container, getByTestId } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <StepTwo
          initialValues={data}
          prevStepData={prevStep}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          index={0}
          onSubmit={() => undefined}
        />
      </TestWrapper>
    )
    const submit = getByTestId('submit')
    act(() => {
      userEvent.click(submit)
    })
    expect(container).toMatchSnapshot()
  })
})
