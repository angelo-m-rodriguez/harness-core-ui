/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, queryByAttribute, render } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { LockStep } from '../Lock'

describe('Lock Step', () => {
  beforeAll(() => {
    factory.registerStep(new LockStep())
  })

  test('it should render as new step - stepViewType Edit', () => {
    const { container, getByText } = render(
      <TestStepWidget initialValues={{}} type={StepType.Lock} stepViewType={StepViewType.Edit} />
    )
    expect(getByText('pipelineSteps.timeoutLabel')).toBeDefined()
    expect(getByText('pipeline.lockStep.resourceKey')).toBeDefined()
    expect(getByText('pipeline.lockStep.scope')).toBeDefined()
    expect(container).toMatchSnapshot('Create Case')
  })

  test('renders RunTime Inputs', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const initialValues = {
      identifier: 'My_Lock_Step',
      name: 'My Lock Step',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        key: RUNTIME_INPUT_VALUE,
        scope: RUNTIME_INPUT_VALUE
      }
    }

    const { container } = render(
      <TestStepWidget
        initialValues={initialValues}
        type={StepType.Lock}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={onUpdate}
      />
    )

    expect(container).toMatchSnapshot('Edit Case - with runtime inputs')
    await act(() => ref.current?.submitForm()!)
    expect(onUpdate).toHaveBeenCalledWith({
      identifier: 'My_Lock_Step',
      name: 'My Lock Step',
      spec: {
        key: '<+input>',
        scope: '<+input>'
      },
      timeout: '<+input>',
      type: 'Lock'
    })
  })

  test('Edit mode works - No runtime', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const initialValues = {
      identifier: 'My_Lock_Step',
      name: 'My Lock Step',
      timeout: '1d',
      spec: {
        key: 'dummy_key',
        scope: 'PIPELINE'
      }
    }

    render(
      <TestStepWidget
        initialValues={initialValues}
        type={StepType.Lock}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={onUpdate}
      />
    )

    await act(() => ref.current?.submitForm()!)
    expect(onUpdate).toHaveBeenCalledWith({
      identifier: 'My_Lock_Step',
      name: 'My Lock Step',
      spec: {
        key: 'dummy_key',
        scope: 'PIPELINE'
      },
      timeout: '1d',
      type: 'Lock'
    })
  })

  test('form produces correct data for fixed inputs', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const { container, getByText } = render(
      <TestStepWidget
        initialValues={{}}
        type={StepType.Lock}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdate}
        ref={ref}
      />
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'My LockAndQueue Step' } })
    fireEvent.change(queryByNameAttribute('spec.key')!, { target: { value: 'this is dummy key' } })
    // fireEvent.change(queryByNameAttribute('spec.method')!, { target: { value: 'PIPELINE' } })

    await act(() => ref.current?.submitForm()!)
    expect(onUpdate).toHaveBeenCalledWith({
      identifier: 'My_LockAndQueue_Step',
      name: 'My LockAndQueue Step',
      spec: {
        key: 'this is dummy key',
        scope: 'STAGE'
      },
      timeout: '10m',
      type: 'Lock'
    })

    fireEvent.change(queryByNameAttribute('timeout')!, { target: { value: '' } })
    // fireEvent.change(container.querySelector('input[value="10s"]') as HTMLElement, { target: { value: '' } })
    await act(() => ref.current?.submitForm()!)
    expect(getByText('validation.timeout10SecMinimum')).toBeTruthy()
  })
})

describe('Lock Step - Input Set', () => {
  beforeAll(() => {
    factory.registerStep(new LockStep())
  })

  test('it should render input set', () => {
    const onUpdate = jest.fn()
    const initialValues = {
      identifier: 'My_Lock_Step',
      name: 'My Lock Step',
      timeout: RUNTIME_INPUT_VALUE,
      spec: {
        key: RUNTIME_INPUT_VALUE,
        scope: RUNTIME_INPUT_VALUE
      }
    }
    const { container } = render(
      <TestStepWidget
        initialValues={{}}
        template={initialValues}
        type={StepType.Lock}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdate}
        path="/abc"
      />
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    expect(queryByNameAttribute('/abc.timeout')).not.toBeNull()
    expect(queryByNameAttribute('/abc.spec.key')).not.toBeNull()
    expect(queryByNameAttribute('/abc.spec.scope')).not.toBeNull()
    expect(container).toMatchSnapshot('Input Set - view')
  })

  test('it should render empty input sets', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{}}
        type={StepType.Lock}
        stepViewType={StepViewType.InputSet}
        template={{}}
        path=""
      />
    )

    expect(container).toMatchSnapshot('empty input sets')
  })
})
