/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { MultiTypeInputType } from '@wings-software/uicore'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { K8sOverrideValuesRuntimeFields } from '../K8sOverrideValuesRuntimeFields'

const defaultProps = {
  inputSetData: {
    template: {
      spec: {
        overrides: [
          {
            manifest: {
              identifier: 'Test',
              type: 'OpenShiftParams',
              spec: {
                store: {
                  type: 'BitBucket',
                  spec: {
                    branch: '',
                    connectorRef: '',
                    repoName: '',
                    paths: ''
                  }
                }
              }
            }
          }
        ]
      }
    },
    path: 'stages[0].stage.spec.execution.steps[0].step'
  },
  overrideValue: {
    manifest: {
      identifier: 'Test',
      type: 'OpenShiftParams' as any,
      spec: {
        store: {
          type: 'BitBucket',
          spec: {
            branch: '<+input>',
            connectorRef: '<+input>',
            repoName: '<+input>',
            paths: '<+input>'
          }
        }
      }
    }
  },
  initialValues: {
    spec: {
      overrides: [
        {
          manifest: {
            identifier: 'Test',
            type: 'OpenShiftParams',
            spec: {
              store: {
                type: 'BitBucket',
                spec: {
                  branch: '',
                  connectorRef: '',
                  repoName: '',
                  paths: ''
                }
              }
            }
          }
        }
      ]
    }
  },
  index: 0,
  allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED]
}

const defaultPropsforCommitId = {
  inputSetData: {
    template: {
      spec: {
        overrides: [
          {
            manifest: {
              identifier: 'Test',
              type: 'OpenShiftParams',
              spec: {
                store: {
                  type: 'BitBucket',
                  spec: {
                    commitId: ''
                  }
                }
              }
            }
          }
        ]
      }
    },
    path: 'stages[0].stage.spec.execution.steps[0].step'
  },
  overrideValue: {
    manifest: {
      identifier: 'Test',
      type: 'OpenShiftParams' as any,
      spec: {
        store: {
          type: 'BitBucket',
          spec: {
            commitId: '<+input>'
          }
        }
      }
    }
  },
  initialValues: {
    spec: {
      overrides: [
        {
          manifest: {
            identifier: 'Test',
            type: 'OpenShiftParams',
            spec: {
              store: {
                type: 'BitBucket',
                spec: {
                  commitId: ''
                }
              }
            }
          }
        }
      ]
    }
  },
  index: 0,
  allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED]
}

const renderForm = (props: any) => {
  return render(
    <TestWrapper
      path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
      pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
    >
      <K8sOverrideValuesRuntimeFields {...props} />
    </TestWrapper>
  )
}

describe('OverrideYamlValues runtimefields tests', () => {
  test('Render runtime fields in run pipeline form', async () => {
    const { container } = renderForm(defaultProps)
    expect(container).toMatchSnapshot()
  })

  test('Render runtime fields if gitfetchtype is commitid', async () => {
    const { container } = renderForm(defaultPropsforCommitId)
    expect(container).toMatchSnapshot()
  })

  test('Render empty if no runtime fields', async () => {
    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
        pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
      >
        <K8sOverrideValuesRuntimeFields
          initialValues={defaultProps.initialValues as any}
          allowableTypes={[]}
          overrideValue={[]}
          index={0}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
