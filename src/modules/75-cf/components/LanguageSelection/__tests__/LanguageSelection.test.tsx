import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { LanguageSelection, LanguageSelectionProps, PlatformEntryType } from '../LanguageSelection'

const renderComponent = (props: Partial<LanguageSelectionProps> = {}): void => {
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <LanguageSelection selected={undefined} onSelect={jest.fn()} {...props} />
    </TestWrapper>
  )
}

describe('LanguageSelection', () => {
  test('it should display six SDKs', async () => {
    renderComponent()

    //assert buttons
    expect(screen.getByText('Android')).toBeInTheDocument()
    expect(screen.getByText('Golang')).toBeInTheDocument()
    expect(screen.getByText('iOS')).toBeInTheDocument()
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('NodeJS')).toBeInTheDocument()
  })

  test('should call onSelectMock and the class of the selected button is changed when NodeJS SDK language button is clicked', async () => {
    const onSelectMock = jest.fn()

    const nodeJSEntry = {
      name: 'NodeJS',
      icon: 'test-file-stub',
      type: PlatformEntryType.SERVER,
      readmeStringId: 'cf.onboarding.readme.nodejs'
    }

    renderComponent({ onSelect: onSelectMock })
    const nodeJSButton = screen.getByRole('button', { name: 'NodeJS' })

    // assert NodeJS button to not have 'selected' as class name before it's been clicked
    expect(nodeJSButton).not.toHaveClass('selected')

    userEvent.click(nodeJSButton)

    // assert function is called
    expect(onSelectMock).toBeCalledWith(nodeJSEntry)

    // assert NodeJS button class changes from 'button' to 'button selected' after it's been clicked
    expect(nodeJSButton).toHaveClass('selected')
  })
})
