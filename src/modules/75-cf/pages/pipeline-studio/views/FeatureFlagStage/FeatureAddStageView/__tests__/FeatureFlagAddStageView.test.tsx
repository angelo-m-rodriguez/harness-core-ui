/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { FeatureAddEditStageView, FeatureAddEditStageViewProps } from '../FeatureAddStageView'
import mockFFStageTemplate from './__data__/mockFFStageTemplate'

const renderComponent = (props: Partial<FeatureAddEditStageViewProps> = {}): void => {
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <FeatureAddEditStageView
        data={{
          stage: {
            name: '',
            identifier: '',
            description: '',
            type: 'FeatureFlag',
            spec: {}
          }
        }}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        {...props}
      />
    </TestWrapper>
  )
}

describe('FeatureFlagAddStageView', () => {
  test('it should add stage correctly', async () => {
    const mockSubmit = jest.fn()

    renderComponent({ onSubmit: mockSubmit })

    const stageNameInput = screen.getByPlaceholderText('common.namePlaceholder')
    expect(stageNameInput).toBeInTheDocument()

    userEvent.type(stageNameInput, 'FF_TEST_STAGE')
    expect(stageNameInput).toHaveValue('FF_TEST_STAGE')

    const setUpStageBtn = screen.getByRole('button', { name: 'pipelineSteps.build.create.setupStage' })
    expect(setUpStageBtn).toBeInTheDocument()

    userEvent.click(setUpStageBtn)

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          stage: {
            description: '',
            identifier: 'FF_TEST_STAGE',
            name: 'FF_TEST_STAGE',
            spec: {},
            type: 'FeatureFlag'
          }
        },
        'FF_TEST_STAGE'
      )
    )
  })

  test('it should add template stage correctly', async () => {
    const mockSubmit = jest.fn()

    renderComponent({ onSubmit: mockSubmit, template: mockFFStageTemplate })

    const stageNameInput = screen.getByPlaceholderText('common.namePlaceholder')
    expect(stageNameInput).toBeInTheDocument()

    userEvent.type(stageNameInput, 'FF_TEST_STAGE')
    expect(stageNameInput).toHaveValue('FF_TEST_STAGE')

    await waitFor(() => expect(screen.getByText(/Using Template: tempalte_2/)).toBeInTheDocument())

    const setUpStageBtn = screen.getByRole('button', { name: 'pipelineSteps.build.create.setupStage' })
    expect(setUpStageBtn).toBeInTheDocument()

    userEvent.click(setUpStageBtn)

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          stage: {
            identifier: 'FF_TEST_STAGE',
            name: 'FF_TEST_STAGE',
            template: { templateRef: 'tempalte_2', versionLabel: 'v1' }
          }
        },
        'FF_TEST_STAGE'
      )
    )
  })
})
