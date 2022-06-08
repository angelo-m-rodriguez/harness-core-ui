/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, findByText, fireEvent, render } from '@testing-library/react'
import { queryByNameAttribute, TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import SaveToGitFormV2 from '../SaveToGitFormV2'

const mockBranches = {
  status: 'SUCCESS',
  data: {
    branches: [{ name: 'main' }, { name: 'main-demo' }, { name: 'main-patch' }, { name: 'testBranch' }],
    defaultBranch: { name: 'main' }
  },
  metaData: null,
  correlationId: 'correlationId'
}

const pathParams = { accountId: 'dummy', orgIdentifier: 'default', projectIdentifier: 'dummyProject' }
const fetchBranches = jest.fn(() => Promise.resolve(mockBranches))
const saveToGitFormV2Handler = jest.fn(gitDetails => Promise.resolve(gitDetails))

jest.mock('services/cd-ng', () => ({
  useGetListOfBranchesByRefConnectorV2: jest.fn().mockImplementation(() => {
    return { data: mockBranches, refetch: fetchBranches }
  })
}))

describe('SaveToGitFormV2 test', () => {
  afterEach(() => {
    fetchBranches.mockReset()
  })

  test('Creating new branch and PR in SaveToGitFormV2', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/ci/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/-1/pipeline-studio/"
        pathParams={pathParams}
      >
        <SaveToGitFormV2
          {...pathParams}
          isEditing={false}
          resource={{
            type: 'Pipelines',
            name: 'testPipeline',
            identifier: 'testPipeline',
            gitDetails: { branch: 'testBranch' }
          }}
          onSuccess={saveToGitFormV2Handler}
        />
      </TestWrapper>
    )
    const newBranchRadioBtn = document.querySelector('[data-test="newBranchRadioBtn"]')
    act(() => {
      fireEvent.click(newBranchRadioBtn!)
    })

    // New branch input should be autofilled with default value
    expect((queryByNameAttribute('branch', container) as HTMLInputElement)?.value).toBe('testBranch-patch')
    // Branch should not be fetched till createPR is checked
    expect(fetchBranches).not.toBeCalled()

    await act(async () => {
      fillAtForm([
        {
          container,
          fieldId: 'branch',
          type: InputTypes.TEXTFIELD,
          value: 'testBranch'
        },
        {
          container,
          fieldId: 'createPr',
          type: InputTypes.CHECKBOX,
          value: true
        }
      ])
      const submitBtn = await findByText(container, 'save')
      fireEvent.click(submitBtn)
    })

    //targetBranch as same with branch should have form validation error
    expect(getByText('common.git.validation.sameBranches')).toBeInTheDocument()
    expect(saveToGitFormV2Handler).not.toBeCalled()
    //Changing new branch name
    await act(async () => {
      fillAtForm([
        {
          container,
          fieldId: 'branch',
          type: InputTypes.TEXTFIELD,
          value: 'newBranch'
        }
      ])
      const submitBtn = await findByText(container, 'save')
      fireEvent.click(submitBtn)
    })

    expect(saveToGitFormV2Handler).toBeCalledWith({
      baseBranch: 'testBranch',
      branch: 'newBranch',
      commitMsg: 'common.gitSync.createResource',
      createPr: true,
      isNewBranch: true,
      targetBranch: 'testBranch'
    })

    expect(container).toMatchSnapshot()
  })
})
