/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, render } from '@testing-library/react'
import { set } from 'lodash-es'
import produce from 'immer'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import type { TemplateSelectorLeftViewProps } from '@templates-library/components/TemplateSelector/TemplateSelectorLeftView/TemplateSelectorLeftView'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import { mockTemplates } from '@templates-library/TemplatesTestHelper'
import type { TemplateDetailsProps } from '@templates-library/components/TemplateDetails/TemplateDetails'
import { TemplateSelector } from '../TemplateSelector'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn()
}))

jest.mock('@templates-library/components/TemplateSelector/TemplateSelectorLeftView/TemplateSelectorLeftView', () => ({
  ...(jest.requireActual(
    '@templates-library/components/TemplateSelector/TemplateSelectorLeftView/TemplateSelectorLeftView'
  ) as any),
  // eslint-disable-next-line react/display-name
  TemplateSelectorLeftView: ({ setTemplate }: TemplateSelectorLeftViewProps) => {
    React.useEffect(() => {
      setTemplate(mockTemplates.data?.content?.[0])
    }, [])
    return <div className="template-selector-left-view-mock"></div>
  }
}))

jest.mock('@templates-library/components/TemplateDetails/TemplateDetails', () => ({
  ...(jest.requireActual('@templates-library/components/TemplateDetails/TemplateDetails') as any),
  TemplateDetails: ({ template }: TemplateDetailsProps) => {
    return <div className="template-details-left-view-mock">{template.identifier}</div>
  }
}))

const pipelineContext = produce(pipelineContextMock, draft => {
  set(draft, 'state.templateView.templateDrawerData.data.selectorData.onSubmit', jest.fn())
})

describe('<TemplateSelector /> tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should match snapshot when selected template is not set', async () => {
    const { container, getByRole } = render(
      <PipelineContext.Provider value={pipelineContext}>
        <TestWrapper>
          <TemplateSelector />
        </TestWrapper>
      </PipelineContext.Provider>
    )

    expect(container).toMatchSnapshot()

    const copyTemplateBtn = getByRole('button', { name: 'templatesLibrary.copyToPipeline' })
    await act(async () => {
      fireEvent.click(copyTemplateBtn)
    })
    expect(pipelineContext.state.templateView.templateDrawerData.data?.selectorData?.onSubmit).toBeCalledWith(
      mockTemplates.data?.content?.[0],
      true
    )

    const useTemplateBtn = getByRole('button', { name: 'templatesLibrary.useTemplate' })
    await act(async () => {
      fireEvent.click(useTemplateBtn)
    })
    expect(pipelineContext.state.templateView.templateDrawerData.data?.selectorData?.onSubmit).toBeCalledWith(
      mockTemplates.data?.content?.[0],
      false
    )
  })

  test('should disable use template button when same selected template is set', async () => {
    const context = produce(pipelineContext, draft => {
      set(
        draft,
        'state.templateView.templateDrawerData.data.selectorData.selectedTemplate',
        mockTemplates.data?.content?.[0]
      )
    })
    const { getByRole } = render(
      <PipelineContext.Provider value={context}>
        <TestWrapper>
          <TemplateSelector />
        </TestWrapper>
      </PipelineContext.Provider>
    )

    const useTemplateBtn = getByRole('button', { name: 'templatesLibrary.useTemplate' })
    expect(useTemplateBtn).toBeDisabled()
  })

  test('should work correctly when different selected template is set', async () => {
    const context = produce(pipelineContext, draft => {
      set(draft, 'state.templateView.templateDrawerData.data.selectorData.selectedTemplate', {
        ...mockTemplates.data?.content?.[0],
        versionLabel: 'v5'
      })
    })
    const { getByRole } = render(
      <PipelineContext.Provider value={context}>
        <TestWrapper>
          <TemplateSelector />
        </TestWrapper>
      </PipelineContext.Provider>
    )

    const copyTemplateBtn = getByRole('button', { name: 'templatesLibrary.copyToPipeline' })
    await act(async () => {
      fireEvent.click(copyTemplateBtn)
    })
    const copyBtn = getByText(findDialogContainer() as HTMLElement, 'confirm')
    await act(async () => {
      fireEvent.click(copyBtn)
    })
    expect(pipelineContext.state.templateView.templateDrawerData.data?.selectorData?.onSubmit).toBeCalledWith(
      mockTemplates.data?.content?.[0],
      true
    )

    const useTemplateBtn = getByRole('button', { name: 'templatesLibrary.useTemplate' })
    await act(async () => {
      fireEvent.click(useTemplateBtn)
    })
    const useBtn = getByText(findDialogContainer() as HTMLElement, 'confirm')
    await act(async () => {
      fireEvent.click(useBtn)
    })
    expect(pipelineContext.state.templateView.templateDrawerData.data?.selectorData?.onSubmit).toBeCalledWith(
      mockTemplates.data?.content?.[0],
      false
    )
  })
})
