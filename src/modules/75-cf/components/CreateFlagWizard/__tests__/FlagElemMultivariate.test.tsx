/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SelectOption } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { FlagTypeVariations } from '@cf/components/CreateFlagDialog/FlagDialogUtils'
import { FeatureFlagMutivariateKind } from '@cf/utils/CFUtils'
import FlagElemMultivariate, { FlagElemMultivariateProps } from '../FlagElemMultivariate'

const renderComponent = (props: Partial<FlagElemMultivariateProps> = {}): void => {
  const flagTypeOptionsMock: SelectOption[] = [
    { label: 'boolean', value: FlagTypeVariations.booleanFlag },
    { label: 'multivariate', value: FeatureFlagMutivariateKind.string }
  ]

  const TOTAL_WIZARD_STEPS = (): number => 2

  render(
    <TestWrapper>
      <FlagElemMultivariate
        name="Create Boolean Flag Step 1"
        toggleFlagType={jest.fn()}
        flagTypeOptions={flagTypeOptionsMock}
        projectIdentifier="dummy"
        setModalErrorHandler={jest.fn()}
        isLoadingCreateFeatureFlag={false}
        previousStep={jest.fn()}
        nextStep={jest.fn()}
        currentStep={TOTAL_WIZARD_STEPS}
        totalSteps={TOTAL_WIZARD_STEPS}
        prevStepData={{}}
        {...props}
      />
    </TestWrapper>
  )
}

const setDefaultVariations = async (): Promise<void> => {
  await act(async () => {
    const variationOption1Name = document.getElementsByName('variations.0.name')[0]
    const variationOption1Value = document.getElementsByName('variations.0.value')[0]

    await userEvent.type(variationOption1Name, 'variation one', { allAtOnce: true })
    await userEvent.type(variationOption1Value, 'On', { allAtOnce: true })

    const variationOption2Name = document.getElementsByName('variations.1.name')[0]
    const variationOption2Value = document.getElementsByName('variations.1.value')[0]

    await userEvent.type(variationOption2Name, 'variation two', { allAtOnce: true })
    await userEvent.type(variationOption2Value, 'Off', { allAtOnce: true })
  })
}

describe('FlagElemMultivariate', () => {
  test('it should render flag type options and handle change correctly', async () => {
    const flagToggleMock = jest.fn()
    renderComponent({ toggleFlagType: flagToggleMock })

    const kindDropdown = document.getElementsByName('kind')[0]
    expect(kindDropdown).toHaveValue('multivariate')

    userEvent.click(kindDropdown)

    await waitFor(() => {
      expect(screen.getByText('boolean')).toBeInTheDocument()
      expect(screen.getByText('multivariate')).toBeInTheDocument()
    })

    userEvent.click(screen.getByText('boolean'))

    await waitFor(() => expect(flagToggleMock).toHaveBeenCalled())
  })

  test.each(['string', 'cf.creationModal.jsonType', 'number'])(
    'it should render data type options and handle change to %s data type correctly',
    async type => {
      renderComponent()

      const dataTypeDropdown = document.getElementsByName('dataTypes')[0]

      userEvent.click(dataTypeDropdown)

      await waitFor(() => expect(screen.getByText(type)).toBeInTheDocument())

      userEvent.click(screen.getByText(type))

      await waitFor(() => expect(dataTypeDropdown).toHaveValue(type))
    }
  )

  test('it should render 2 empty variation options by default', async () => {
    renderComponent()

    expect(document.getElementsByName('variations.0.name')[0]).toBeInTheDocument()
    expect(document.getElementsByName('variations.1.name')[0]).toBeInTheDocument()
  })

  test('it should add another variation option when add variation button clicked ', async () => {
    renderComponent()

    const addVariationButton = screen.getByText('cf.shared.variation')
    expect(addVariationButton).toBeInTheDocument()

    userEvent.click(addVariationButton)

    await waitFor(() => expect(document.getElementsByName('variations.2.name')[0]).toBeInTheDocument())
  })

  test('it should delete variation option when delete icon clicked', async () => {
    renderComponent()

    // add another variation
    const addVariationButton = screen.getByText('cf.shared.variation')
    expect(addVariationButton).toBeInTheDocument()

    userEvent.click(addVariationButton)

    await waitFor(() => expect(document.getElementsByName('variations.2.name')[0]).toBeInTheDocument())

    // assert
    const deleteButton = screen.getByTestId('delete_icon_2')
    expect(deleteButton).toBeInTheDocument()

    userEvent.click(deleteButton)

    await waitFor(() => expect(document.getElementsByName('variations.2.name')).toHaveLength(0))
  })

  test('it should populate default ON rules dropdown with variation values', async () => {
    renderComponent()

    await setDefaultVariations()

    // assert
    const defaultOnVariationDropdown = document.getElementsByName('defaultOnVariation')[0]
    userEvent.click(defaultOnVariationDropdown)
    userEvent.click(screen.getByText('variation one'))

    await waitFor(() => expect(defaultOnVariationDropdown).toHaveValue('variation one'))
  })

  test('it should populate default OFF rules dropdown with variation values', async () => {
    renderComponent()

    await setDefaultVariations()

    // assert
    const defaultOffVariationDropdown = document.getElementsByName('defaultOffVariation')[0]
    userEvent.click(defaultOffVariationDropdown)

    await waitFor(() => expect(screen.getByText('variation two')).toBeInTheDocument())

    userEvent.click(screen.getByText('variation two'))

    await waitFor(() => expect(defaultOffVariationDropdown).toHaveValue('variation two'))
  })

  test('it should display "Save and Close" button if at end of wizard', async () => {
    const nextStepMock = jest.fn()
    const nextStepDataMock = {
      defaultOffVariation: 'variation_one',
      defaultOnVariation: 'variation_one',
      kind: 'string',
      variations: [
        {
          identifier: 'variation_one',
          name: 'variation one',
          value: 'On'
        },
        {
          identifier: 'variation_two',
          name: 'variation two',
          value: 'Off'
        }
      ]
    }

    renderComponent({ nextStep: nextStepMock })

    await setDefaultVariations()

    // select default rules
    const defaultOnVariationDropdown = document.getElementsByName('defaultOnVariation')[0]
    userEvent.click(defaultOnVariationDropdown)
    userEvent.click(screen.getAllByText('variation one')[0])

    const defaultOffVariationDropdown = document.getElementsByName('defaultOffVariation')[0]
    userEvent.click(defaultOffVariationDropdown)
    userEvent.click(screen.getAllByText('variation one')[1])

    const nextButton = screen.getByText('cf.creationModal.saveAndClose')
    expect(nextButton).toBeInTheDocument()

    userEvent.click(nextButton)

    await waitFor(() => expect(nextStepMock).toHaveBeenCalledWith(nextStepDataMock))
  })

  test('it should call previousStep callback on "back" click', async () => {
    const previousStepMock = jest.fn()
    const previousStepDataMock = { name: 'test 1' }
    renderComponent({ previousStep: previousStepMock, prevStepData: previousStepDataMock })

    const backButton = screen.getByText('back')
    expect(backButton).toBeInTheDocument()

    userEvent.click(backButton)

    await waitFor(() => expect(previousStepMock).toHaveBeenCalledWith(previousStepDataMock))
  })

  test('it should display "Next" button if more steps available', async () => {
    const nextStepMock = jest.fn()

    renderComponent({ nextStep: nextStepMock, totalSteps: () => 3 })

    expect(screen.getByText('next')).toBeInTheDocument()
  })
})
