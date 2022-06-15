/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplateStudioHeader } from '@templates-library/components/TemplateStudio/TemplateStudioHeader/TemplateStudioHeader'
import type { TemplateType } from '@templates-library/utils/templatesUtils'

jest.mock('@templates-library/components/Templates/TemplatesFactory', () => ({
  getTemplateName: jest.fn(templateType => {
    switch (templateType) {
      case 'Stage':
        return 'Stage Template'
      case 'Step':
        return 'Step Template'
      default:
        return 'Studio'
    }
  })
}))

describe('TemplateStudioHeader', () => {
  test('renders Stage templateType correctly', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TemplateStudioHeader templateType={'Stage' as TemplateType} />
      </TestWrapper>
    )
    expect(getByText('Stage Template')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('renders Step templateType correctly', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <TemplateStudioHeader templateType={'Step' as TemplateType} />
      </TestWrapper>
    )
    expect(getByText('Step Template')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('renders default title correctly', () => {
    const { container, getByText, debug } = render(
      <TestWrapper>
        <TemplateStudioHeader templateType={'unknown' as TemplateType} />
      </TestWrapper>
    )
    expect(getByText('Studio')).toBeInTheDocument()
    debug()
    expect(container).toMatchSnapshot()
  })
})
