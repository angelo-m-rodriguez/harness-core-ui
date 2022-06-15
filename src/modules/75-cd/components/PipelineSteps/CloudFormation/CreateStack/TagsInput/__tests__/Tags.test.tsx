/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiTypeInputType, Formik, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { Tags } from '../Tags'

describe('Test cloudformation tags', () => {
  test('should render with no initial data', () => {
    const { container } = render(
      <Formik initialValues={{}} formName="dummy" onSubmit={jest.fn()}>
        {formik => (
          <TestWrapper
            path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
            pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
          >
            <Tags
              readonly={false}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              regions={[]}
              formik={formik}
            />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render tags data', () => {
    const { container } = render(
      <Formik
        initialValues={{
          spec: {
            configuration: {
              tags: {
                type: 'Remote',
                spec: {
                  store: {
                    type: 'Github',
                    spec: {
                      branch: 'main',
                      connectorRef: 'github_demo',
                      gitFetchType: 'Branch',
                      paths: ['test.json']
                    }
                  }
                }
              }
            }
          }
        }}
        formName="dummy"
        onSubmit={jest.fn()}
      >
        {formik => (
          <TestWrapper
            path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
            pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
          >
            <Tags
              readonly={false}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              regions={[]}
              formik={formik}
            />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render open remote modal', async () => {
    const { container, getByTestId } = render(
      <Formik
        initialValues={{
          spec: {
            configuration: {
              tags: {
                type: 'Remote',
                spec: {
                  store: {
                    type: 'Github',
                    spec: {
                      branch: RUNTIME_INPUT_VALUE,
                      connectorRef: RUNTIME_INPUT_VALUE,
                      gitFetchType: RUNTIME_INPUT_VALUE,
                      paths: [RUNTIME_INPUT_VALUE]
                    }
                  }
                }
              }
            }
          }
        }}
        formName="dummy"
        onSubmit={jest.fn()}
      >
        {formik => (
          <TestWrapper
            path="/account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier"
            pathParams={{ accountId: 'account', orgIdentifier: 'org', projectIdentifier: 'project' }}
          >
            <Tags
              readonly={false}
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              regions={[]}
              formik={formik}
            />
          </TestWrapper>
        )}
      </Formik>
    )
    const remoteTags = getByTestId('remoteTags')
    await act(async () => userEvent.click(remoteTags))
    expect(container).toMatchSnapshot()

    const closeButton = getByTestId('remoteClose')
    await act(async () => userEvent.click(closeButton))
    expect(container).toMatchSnapshot()
  })
})
