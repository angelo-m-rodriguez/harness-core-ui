/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from '@harness/uicore'
import type { FormikErrors } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import { PERCENTAGE_ROLLOUT_VALUE } from '@cf/constants'
import { mockFeatures } from '@cf/pages/target-group-detail/__tests__/mocks'
import VariationsWithPercentageRolloutCell, {
  VariationsWithPercentageRolloutCellProps
} from '../VariationsWithPercentageRolloutCell'

const MockReasonTooltip: FC = ({ children }) => <>{children}</>

const renderComponent = (
  props: Partial<VariationsWithPercentageRolloutCellProps> = {},
  initialValues = {},
  initialErrors: FormikErrors<any> = {}
): RenderResult =>
  render(
    <TestWrapper>
      <Formik
        validateOnBlur
        formName="wrapper"
        onSubmit={jest.fn()}
        initialValues={initialValues}
        initialErrors={initialErrors}
      >
        <VariationsWithPercentageRolloutCell
          row={{ original: mockFeatures[0] }}
          value={{ disabled: false, ReasonTooltip: MockReasonTooltip }}
          {...props}
        />
      </Formik>
    </TestWrapper>
  )

describe('VariationsWithPercentageRolloutCell', () => {
  test('it should display the variation select', async () => {
    renderComponent()

    const input = screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')
    expect(input).toBeInTheDocument()

    userEvent.click(input)

    await waitFor(() => {
      mockFeatures[0].variations.forEach(({ name, identifier }) => {
        expect(screen.getByText(name || identifier)).toBeInTheDocument()
      })
    })
  })

  test('it should display the percentage rollout UI when Percentage Rollout is selected', async () => {
    renderComponent()

    expect(screen.queryByTestId('variation-percentage-rollout')).not.toBeInTheDocument()

    userEvent.click(screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -'))

    const btn = screen.getByText('cf.featureFlags.percentageRollout')
    expect(btn).toBeInTheDocument()
    userEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByTestId('variation-percentage-rollout')).toBeInTheDocument()
    })
  })

  test('it should display the percentage rollout error when an error exists', async () => {
    const errorMessage = 'cf.percentageRollout.invalidTotalError'

    renderComponent(
      {},
      {
        flags: {
          [mockFeatures[0].identifier]: {
            variation: PERCENTAGE_ROLLOUT_VALUE,
            percentageRollout: {
              variations: [
                { identifier: mockFeatures[0], weight: 51 },
                { identifier: mockFeatures[1], weight: 50 }
              ]
            }
          }
        }
      },
      {
        flags: {
          [mockFeatures[0].identifier]: {
            percentageRollout: {
              variations: 'cf.percentageRollout.invalidTotalError'
            }
          }
        }
      }
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  test('it should disable the input when the value prop contains disabled true', async () => {
    renderComponent(
      { value: { disabled: true, ReasonTooltip: MockReasonTooltip } },
      {
        flags: {
          [mockFeatures[0].identifier]: {
            variation: PERCENTAGE_ROLLOUT_VALUE,
            percentageRollout: {
              variations: [
                { identifier: mockFeatures[0], weight: 90 },
                { identifier: mockFeatures[1], weight: 10 }
              ]
            }
          }
        }
      }
    )

    expect(screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')).toBeDisabled()
    screen.getAllByRole('spinbutton').forEach(input => expect(input).toBeDisabled())
  })

  test('it should not disable the input when the value prop does not contain disabled true', async () => {
    renderComponent(
      { value: { ReasonTooltip: MockReasonTooltip } },
      {
        flags: {
          [mockFeatures[0].identifier]: {
            variation: PERCENTAGE_ROLLOUT_VALUE,
            percentageRollout: {
              variations: [
                { identifier: mockFeatures[0], weight: 90 },
                { identifier: mockFeatures[1], weight: 10 }
              ]
            }
          }
        }
      }
    )

    expect(screen.getByPlaceholderText('- cf.targetManagementFlagConfiguration.selectVariation -')).toBeEnabled()
    screen.getAllByRole('spinbutton').forEach(input => expect(input).toBeEnabled())
  })
})
