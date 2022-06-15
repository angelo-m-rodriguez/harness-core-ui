/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  render,
  queryByAttribute,
  fireEvent,
  waitFor,
  findByText as findByTextGlobal,
  act
} from '@testing-library/react'
import { useToaster } from '@harness/uicore'
import { TestWrapper, CurrentLocation } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useClonePipeline } from 'services/pipeline-ng'
import { useGetProjectAggregateDTOList } from 'services/cd-ng'

import { ClonePipelineForm, ClonePipelineFormProps } from './ClonePipelineForm'

jest.mock('@harness/uicore', () => ({
  ...jest.requireActual('@harness/uicore'),
  useToaster: jest.fn().mockReturnValue({ showSuccess: jest.fn() })
}))

const originalPipeline: ClonePipelineFormProps['originalPipeline'] = {
  name: 'My Pipeline',
  identifier: 'My_Pipeline',
  description: 'My Pipeline Description',
  tags: { MyTag1: '', MyTag2: '' }
}

const TEST_PATH = routes.toCDProject({
  module: ':module',
  orgIdentifier: ':orgIdentifier',
  projectIdentifier: ':projectIdentifier',
  accountId: ':accountId'
})

const PATH_PARAMS: PipelineType<ProjectPathProps> = {
  module: 'cd',
  orgIdentifier: 'TEST_ORG1',
  projectIdentifier: 'TEST_PROJECT1',
  accountId: 'TEST_ACCOUNT1'
}

const FORM_ID = 'clone-pipeline-form'

jest.mock('services/cd-ng', () => ({
  useGetOrganizationList: jest.fn().mockReturnValue({
    data: {
      data: {
        content: [
          { organization: { name: 'Test Org 1', identifier: 'TEST_ORG1' } },
          { organization: { name: 'Test Org 2', identifier: 'TEST_ORG2' } }
        ]
      }
    },
    loading: false
  }),
  useGetProjectAggregateDTOList: jest.fn().mockReturnValue({
    data: {
      data: {
        content: [
          { projectResponse: { project: { name: 'Test Project 1', identifier: 'TEST_PROJECT1' } } },
          { projectResponse: { project: { name: 'Test Project 2', identifier: 'TEST_PROJECT2' } } }
        ]
      }
    },
    loading: false
  })
}))

jest.mock('services/pipeline-ng', () => ({
  useClonePipeline: jest.fn().mockReturnValue({ mutate: jest.fn() })
}))

describe('<ClonePipelineForm /> tests', () => {
  test('snapshot test', async () => {
    const { findByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS as any}>
        <ClonePipelineForm originalPipeline={originalPipeline} onClose={jest.fn()} isOpen />
      </TestWrapper>
    )

    const form = await findByTestId(FORM_ID)
    expect(form).toMatchSnapshot()

    const name = queryByAttribute('name', form, 'name') as HTMLInputElement
    const description = queryByAttribute('name', form, 'description') as HTMLInputElement
    const id = queryByAttribute('class', form, 'bp3-editable-text-content') as HTMLElement
    const org = queryByAttribute('name', form, 'destinationConfig.orgIdentifier') as HTMLInputElement
    const proj = queryByAttribute('name', form, 'destinationConfig.projectIdentifier') as HTMLInputElement

    expect(name.value).toBe('My Pipeline - Clone')
    expect(id.textContent).toBe('My_Pipeline_Clone')
    expect(org.value).toBe('Test Org 1')
    expect(proj.value).toBe('Test Project 1')
    expect(description.value).toBe(originalPipeline.description)
  })

  test('submit flow', async () => {
    const clonePipeline = jest.fn()
    ;(useClonePipeline as jest.Mock).mockImplementation().mockReturnValue({
      mutate: clonePipeline
    })
    const { findByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS as any}>
        <ClonePipelineForm originalPipeline={originalPipeline} onClose={jest.fn()} isOpen />
        <CurrentLocation />
      </TestWrapper>
    )

    const clone = await findByTestId('clone')

    act(() => {
      fireEvent.click(clone)
    })

    await waitFor(() =>
      expect(clonePipeline).toHaveBeenLastCalledWith({
        cloneConfig: {
          connectors: false,
          inputSets: false,
          templates: false,
          triggers: false
        },
        destinationConfig: {
          orgIdentifier: 'TEST_ORG1',
          pipelineIdentifier: 'My_Pipeline_Clone',
          pipelineName: 'My Pipeline - Clone',
          projectIdentifier: 'TEST_PROJECT1',
          description: 'My Pipeline Description',
          tags: { MyTag1: '', MyTag2: '' }
        },
        sourceConfig: {
          orgIdentifier: 'TEST_ORG1',
          pipelineIdentifier: 'My_Pipeline',
          projectIdentifier: 'TEST_PROJECT1'
        }
      })
    )
    const newLocation = await findByTestId('location')

    expect(newLocation).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/TEST_ACCOUNT1/cd/orgs/TEST_ORG1/projects/TEST_PROJECT1/pipelines/My_Pipeline_Clone
      </div>
    `)
  })

  test('handles errors', async () => {
    const showError = jest.fn()
    const showSuccess = jest.fn()
    ;(useToaster as jest.Mock).mockReturnValue({ showError, showSuccess })

    const err_msg =
      'Pipeline [test1_Clone_Clone] under Project[defaultproject], Organization [default] already exists or has been deleted.'
    ;(useClonePipeline as jest.Mock).mockImplementation().mockReturnValue({
      mutate: jest.fn().mockRejectedValue({
        data: {
          status: 'ERROR',
          code: 'DUPLICATE_FIELD',
          message: err_msg
        }
      })
    })
    const { findByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS as any}>
        <ClonePipelineForm originalPipeline={originalPipeline} onClose={jest.fn()} isOpen />
      </TestWrapper>
    )

    const clone = await findByTestId('clone')

    act(() => {
      fireEvent.click(clone)
    })

    await waitFor(() => expect(showError).toHaveBeenLastCalledWith(err_msg))
  })

  test('new projects are fetched, when org is changed', async () => {
    const refetch = jest.fn()
    ;(useGetProjectAggregateDTOList as jest.Mock).mockImplementation().mockReturnValue({
      refetch,
      data: {
        data: {
          content: [
            { projectResponse: { project: { name: 'Test Project 1', identifier: 'TEST_PROJECT1' } } },
            { projectResponse: { project: { name: 'Test Project 2', identifier: 'TEST_PROJECT2' } } }
          ]
        }
      },
      loading: false
    })

    const { findByTestId } = render(
      <TestWrapper path={TEST_PATH} pathParams={PATH_PARAMS as any}>
        <ClonePipelineForm originalPipeline={originalPipeline} onClose={jest.fn()} isOpen />
      </TestWrapper>
    )

    const form = await findByTestId(FORM_ID)
    const org = queryByAttribute('name', form, 'destinationConfig.orgIdentifier') as HTMLInputElement

    act(() => {
      fireEvent.click(org.parentElement!.querySelector('.bp3-icon')!)
    })

    await waitFor(() => {
      expect(document.querySelector('ul.bp3-menu')).toBeTruthy()
    })

    const item = await findByTextGlobal(document.body, 'Test Org 2')

    act(() => {
      fireEvent.click(item)
    })

    await waitFor(() =>
      expect(refetch).toHaveBeenLastCalledWith({
        queryParams: {
          accountIdentifier: 'TEST_ACCOUNT1',
          orgIdentifier: 'TEST_ORG2'
        }
      })
    )

    const proj = queryByAttribute('name', form, 'destinationConfig.projectIdentifier') as HTMLInputElement

    await waitFor(() => {
      expect(proj.value).toBe('')
    })
  })
})
