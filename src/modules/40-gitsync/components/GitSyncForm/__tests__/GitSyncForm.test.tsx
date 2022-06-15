/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, findAllByText, fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import { noop } from 'lodash-es'
import { Formik, FormikForm } from '@harness/uicore'
import { Scope } from '@common/interfaces/SecretsInterface'
import { TestWrapper } from '@common/utils/testUtils'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { GitSyncForm, GitSyncFormFields } from '../GitSyncForm'
import { mockRepos, mockBranches, gitConnectorMock } from './mockdata'

const pathParams = { accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'DevX' }
const getGitConnector = jest.fn(() => Promise.resolve(gitConnectorMock))
const fetchRepos = jest.fn(() => Promise.resolve(mockRepos))
const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))

jest.mock('services/cd-ng', () => ({
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(gitConnectorMock)),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: gitConnectorMock.data.content[0], refetch: getGitConnector, loading: false }
  }),
  useGetListOfReposByRefConnector: jest.fn().mockImplementation(() => {
    return { data: mockRepos, refetch: fetchRepos, loading: false }
  }),
  useGetListOfBranchesByRefConnectorV2: jest.fn().mockImplementation(() => {
    return { data: mockBranches, refetch: fetchBranches }
  })
}))

describe('GitSyncForm test', () => {
  afterEach(() => {
    fetchRepos.mockReset()
  })

  test('Rendering GitSyncForm for while create and filling form', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <Formik<GitSyncFormFields>
          initialValues={{
            identifier: 'testIdentifier',
            connectorRef: {} as ConnectorSelectedValue,
            repo: '',
            branch: '',
            filePath: ''
          }}
          onSubmit={() => undefined}
          formName="GitSyncForm"
        >
          {formikProps => (
            <FormikForm>
              <GitSyncForm formikProps={formikProps} handleSubmit={noop} isEdit={false} />
            </FormikForm>
          )}
        </Formik>
      </TestWrapper>
    )

    const form = document.getElementsByClassName('gitSyncForm')[0] as HTMLElement
    const connnectorRefInput = queryByAttribute('data-testid', form, /connectorRef/)
    expect(connnectorRefInput).toBeTruthy()
    if (connnectorRefInput) {
      act(() => {
        fireEvent.click(connnectorRefInput)
      })
    }

    await act(async () => {
      const connectorSelectorDialog = document.getElementsByClassName('bp3-dialog')[0]

      const githubConnector = await findAllByText(connectorSelectorDialog as HTMLElement, 'ValidGithubRepo')
      expect(githubConnector).toBeTruthy()
      fireEvent.click(githubConnector?.[0])
      const applySelected = getByText('entityReference.apply')
      await act(async () => {
        fireEvent.click(applySelected)
      })
    })

    await waitFor(() => expect(fetchRepos).toBeCalledTimes(1))
    expect(getByText('repository')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('Rendering GitSyncForm for while edit : all field should be disabled', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <Formik<GitSyncFormFields>
          initialValues={{
            identifier: 'testIdentifier',
            connectorRef: {
              label: 'ValidGithubRepo',
              value: 'ValidGithubRepo',
              live: true,
              scope: Scope.PROJECT,
              connector: {}
            } as ConnectorSelectedValue,
            repo: 'test-repo',
            branch: 'dev',
            filePath: '.harness/pipeline.yaml'
          }}
          onSubmit={() => undefined}
          formName="GitSyncForm"
        >
          {formikProps => (
            <FormikForm>
              <GitSyncForm formikProps={formikProps} handleSubmit={noop} isEdit={true} />
            </FormikForm>
          )}
        </Formik>
      </TestWrapper>
    )

    await waitFor(() => expect(fetchRepos).not.toBeCalled())
    expect(getByText('repository')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
