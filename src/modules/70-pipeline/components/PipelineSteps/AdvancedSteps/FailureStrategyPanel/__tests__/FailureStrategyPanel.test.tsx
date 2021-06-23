import React from 'react'
import { act, fireEvent, queryAllByAttribute, render, waitFor } from '@testing-library/react'
import { times } from 'lodash-es'

import { StepMode as Modes } from '@pipeline/utils/stepUtils'
import { ErrorType, Strategy } from '@pipeline/utils/FailureStrategyUtils'
import { Basic } from '../FailureStrategyPanel.stories'

describe('<FailureStrategyPanel /> tests', () => {
  test('initial render with no data', async () => {
    const { findByTestId } = render(<Basic data={{ failureStrategies: [] }} mode={Modes.STEP} />)
    const panel = await findByTestId('failure-strategy-panel')
    expect(panel).toMatchSnapshot()
  })

  test('adding a new strategy works', async () => {
    const { container, findByTestId } = render(<Basic data={{ failureStrategies: [] }} mode={Modes.STEP} />)

    const add = await findByTestId('add-failure-strategy')

    await act(() => {
      fireEvent.click(add)
      return Promise.resolve()
    })

    await waitFor(() => findByTestId('failure-strategy-step-0'))

    expect(queryAllByAttribute('name', container, 'failureStrategies[0].onFailure.errors').length).toBe(2)

    const panel = await findByTestId('failure-strategy-panel')
    expect(panel).toMatchSnapshot()

    const code = await findByTestId('code-output')
    expect(code).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors: []
            action: {}

      </pre>
    `)
  })

  test('removing a strategy works', async () => {
    const { findByTestId, getByTestId } = render(
      <Basic
        data={{
          failureStrategies: [
            {
              onFailure: {
                errors: [ErrorType.Authentication],
                action: { type: Strategy.Abort }
              }
            },
            {
              onFailure: {
                errors: [ErrorType.Authorization],
                action: { type: Strategy.Abort }
              }
            }
          ]
        }}
        mode={Modes.STEP}
      />
    )

    const step2 = await findByTestId('failure-strategy-step-1')

    await act(() => {
      fireEvent.click(step2)
      return Promise.resolve()
    })

    const deleteBtn = await findByTestId('remove-failure-strategy')

    await act(() => {
      fireEvent.click(deleteBtn)
      return Promise.resolve()
    })

    expect(() => getByTestId('failure-strategy-step-1')).toThrow()

    const panel = await findByTestId('failure-strategy-panel')
    expect(panel).toMatchSnapshot()

    const code = await findByTestId('code-output')

    expect(code).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors:
              - Authentication
            action:
              type: Abort

      </pre>
    `)
  })

  test('shows error for unsupported strategy', async () => {
    const { findByTestId } = render(
      <Basic
        data={{ failureStrategies: [{ onFailure: { errors: [], action: { type: 'UNKNOWN' as any } } }] }}
        mode={Modes.STAGE}
      />
    )

    const panel = await findByTestId('failure-strategy-panel')
    expect(panel).toMatchSnapshot()
  })

  test('error type selection does not show already selected error types', async () => {
    const { container, findByText, findByTestId } = render(<Basic data={{ failureStrategies: [] }} mode={Modes.STEP} />)

    const getErrorTypeField = (): HTMLElement[] =>
      queryAllByAttribute('name', container, 'failureStrategies[0].onFailure.errors')!
    const menuItemSelector = '.bp3-menu-item > div'
    const authErrorTxt = 'pipeline.failureStrategies.errorTypeLabels.Authentication'

    const add = await findByTestId('add-failure-strategy')

    await act(() => {
      fireEvent.click(add)
      return Promise.resolve()
    })

    await waitFor(() => findByTestId('failure-strategy-step-0'))

    fireEvent.change(getErrorTypeField()[0], { target: { value: 'auth' } })

    const opt1 = await findByText(authErrorTxt, { selector: menuItemSelector })

    await act(() => {
      fireEvent.click(opt1)
      fireEvent.focus(getErrorTypeField()[0])
      return Promise.resolve()
    })

    await expect(() => findByText(authErrorTxt, { selector: menuItemSelector })).rejects.toThrow()

    const code = await findByTestId('code-output')

    expect(code).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors:
              - Authentication
            action: {}

      </pre>
    `)
  })

  test('when AllErrors is selected, select is disabled', async () => {
    const { container, findByTestId } = render(
      <Basic
        data={{
          failureStrategies: []
        }}
        mode={Modes.STEP}
      />
    )

    const add = await findByTestId('add-failure-strategy')

    await act(() => {
      fireEvent.click(add)
      return Promise.resolve()
    })

    await waitFor(() => findByTestId('failure-strategy-step-0'))
    const errorTypeFields = queryAllByAttribute('name', container, 'failureStrategies[0].onFailure.errors')!

    const code1 = await findByTestId('code-output')

    expect(code1).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors: []
            action: {}

      </pre>
    `)

    await act(() => {
      fireEvent.click(errorTypeFields[1], { target: { value: 'any' } })
      return Promise.resolve()
    })

    const code2 = await findByTestId('code-output')

    expect(code2).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors:
              - AllErrors
            action: {}

      </pre>
    `)

    const panel = await findByTestId('failure-strategy-panel')
    expect(panel.querySelector('.failureSelect')).toMatchSnapshot()
  })

  test('removing error type works', async () => {
    const { container, findByTestId } = render(
      <Basic
        data={{
          failureStrategies: [
            {
              onFailure: {
                errors: [ErrorType.Authentication, ErrorType.Authorization],
                action: { type: Strategy.Abort }
              }
            }
          ]
        }}
        mode={Modes.STEP}
      />
    )

    const code1 = await findByTestId('code-output')

    expect(code1).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors:
              - Authentication
              - Authorization
            action:
              type: Abort

      </pre>
    `)
    const removeTags = queryAllByAttribute('class', container, 'bp3-tag-remove')

    await act(() => {
      fireEvent.click(removeTags[removeTags.length - 1])
      return Promise.resolve()
    })

    const code2 = await findByTestId('code-output')

    expect(code2).toMatchInlineSnapshot(`
      <pre
        data-testid="code-output"
      >
        failureStrategies:
        - onFailure:
            errors:
              - Authentication
            action:
              type: Abort

      </pre>
    `)
  })

  test('"Add" button is disabled, if the tab has errors', async () => {
    const { findByTestId, findByText } = render(<Basic data={{ failureStrategies: [{} as any] }} mode={Modes.STAGE} />)

    await waitFor(() => findByTestId('failure-strategy-step-0'))

    const add = await findByTestId('add-failure-strategy')

    await act(() => {
      fireEvent.click(add)
      return Promise.resolve()
    })

    await findByText('pipeline.failureStrategies.validation.errorsRequired')
    expect(add.classList.contains('bp3-disabled')).toBe(true)
    expect(add.hasAttribute('disabled')).toBe(true)
  })

  test('"Add" button is disabled, when all possible errors are selected', async () => {
    const { findByTestId } = render(
      <Basic
        data={{
          failureStrategies: Object.values(ErrorType).map(err => ({
            onFailure: { errors: [err], action: { type: Strategy.Abort } }
          }))
        }}
        mode={Modes.STAGE}
      />
    )

    const add = await findByTestId('add-failure-strategy')

    expect(add.classList.contains('bp3-disabled')).toBe(true)
    expect(add.hasAttribute('disabled')).toBe(true)
  })

  test('correct tab is opened, in error state on submit', async () => {
    const { findByTestId } = render(
      <Basic
        data={{
          failureStrategies: [
            {
              onFailure: {
                errors: [ErrorType.AllErrors],
                action: {
                  type: Strategy.Abort
                }
              }
            },
            {
              onFailure: {
                errors: [ErrorType.AllErrors]
              } as any // For testing
            },
            {
              onFailure: {
                errors: [ErrorType.AllErrors],
                action: {
                  type: Strategy.Abort
                }
              }
            }
          ]
        }}
        mode={Modes.STEP}
      />
    )

    const submit = await findByTestId('test-submit')

    await act(() => {
      fireEvent.click(submit)
      return Promise.resolve()
    })

    const err = await findByTestId('failure-strategy-step-1')

    expect(err.dataset.selected).toBe('true')
  })

  test('on adding a new strategy, switch to latest tab', async () => {
    const NUM = 5
    const { findByTestId } = render(
      <Basic
        data={{
          failureStrategies: times(NUM, () => ({
            onFailure: {
              errors: [ErrorType.AllErrors],
              action: {
                type: Strategy.Abort
              }
            }
          }))
        }}
        mode={Modes.STEP}
      />
    )

    await waitFor(() => findByTestId('failure-strategy-step-0'))

    const add = await findByTestId('add-failure-strategy')

    await act(() => {
      fireEvent.click(add)
      return Promise.resolve()
    })

    const panel = await findByTestId(`failure-strategy-step-${NUM}`)
    expect(panel.dataset.selected).toBe('true')
  })
})
