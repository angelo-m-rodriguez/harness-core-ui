import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import HeaderToolbar from '../HeaderToolbar'

const WrapperComponent = () => {
  return (
    <TestWrapper>
      <HeaderToolbar loading={false} createdAt={1651200977736} lastModifiedAt={1653481776500} />
    </TestWrapper>
  )
}

describe('HeaderToolbar', () => {
  test('should render correct data', () => {
    const { container } = render(<WrapperComponent />)

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="Layout--vertical StyledProps--main StyledProps--flex StyledProps--flex-justifyContent-flex-end StyledProps--flex-alignItems-end"
          style="height: 100%;"
        >
          <p
            class="StyledProps--font StyledProps--main StyledProps--font-variation-tiny-semi StyledProps--color StyledProps--color-grey500"
          >
            cv.lastModifiedOn 25 May 2022 12:29:36 PM
          </p>
          <p
            class="StyledProps--font StyledProps--main StyledProps--font-variation-tiny-semi StyledProps--color StyledProps--color-grey500"
          >
            cv.createdOn 29 Apr 2022 2:56:17 AM
          </p>
        </div>
      </div>
    `)
  })
})
