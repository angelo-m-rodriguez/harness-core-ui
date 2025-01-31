/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { useTemplateSelector } from '@templates-library/hooks/useTemplateSelector'
import { TemplateSelectorContext } from '@templates-library/components/TemplateSelectorContext/TemplateSelectorContext'
import { templateSelectorContextMock } from '@templates-library/components/TemplateSelectorContext/stateMocks'

function Wrapped(): React.ReactElement {
  const { getTemplate } = useTemplateSelector()
  return (
    <>
      <button onClick={() => getTemplate({ templateType: 'Step' })}>Get Template</button>
    </>
  )
}

describe('useTemplateSelector Test', () => {
  test('should work as expected', async () => {
    const { getByText } = render(
      <TemplateSelectorContext.Provider value={templateSelectorContextMock}>
        <TestWrapper>
          <Wrapped />
        </TestWrapper>
      </TemplateSelectorContext.Provider>
    )

    const getTemplateBtn = getByText('Get Template')
    await act(async () => {
      fireEvent.click(getTemplateBtn)
    })
    expect(templateSelectorContextMock.openTemplateSelector).toBeCalledWith({
      onCancel: expect.any(Function),
      onSubmit: expect.any(Function),
      templateType: 'Step'
    })
  })
})
