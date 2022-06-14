/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { AzureWebAppRollback } from '../AzureWebAppRollback'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => {
  return <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
})

const renderComponent = (data: any, stepType = StepViewType.Edit) =>
  render(<TestStepWidget {...data} type={StepType.AzureWebAppsRollback} stepViewType={stepType} />)

describe('Test Azure Web App Rollback step', () => {
  beforeEach(() => {
    factory.registerStep(new AzureWebAppRollback())
  })

  test('should render edit view as new step', () => {
    const { container } = renderComponent({ initialValues: {} })
    expect(container).toMatchSnapshot()
  })

  test('should render rollback step view', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback'
      },
      isNewStep: true,
      readonly: true
    })
    const { container } = renderComponent(data())
    expect(container).toMatchSnapshot()
  })

  test('should submit rollback form', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback'
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())
    await act(() => ref.current?.submitForm()!)

    expect(onUpdate).toHaveBeenCalled()
    expect(container).toMatchSnapshot()
  })

  test('should error on submit', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: '',
        timeout: '',
        identifier: ''
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())
    await act(() => ref.current?.submitForm()!)

    expect(container).toMatchSnapshot()
  })

  test('should show runtime component', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'rollback',
        timeout: RUNTIME_INPUT_VALUE,
        identifier: 'rollback'
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())

    expect(container).toMatchSnapshot()
  })

  test('should update field value', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'azure_web_rollback',
        timeout: '',
        identifier: 'azure_web_rollback'
      },
      isNewStep: false,
      readonly: false,
      ref,
      onUpdate
    })
    const { getByPlaceholderText } = renderComponent(data())
    const timeout = getByPlaceholderText('Enter w/d/h/m/s/ms')
    act(() => userEvent.type(timeout, '10m'))
    expect(timeout).toHaveDisplayValue('10m')
  })

  test('should render variable input step', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback'
      },
      isNewStep: false,
      readonly: true
    })
    const { container } = renderComponent(data(), StepViewType.InputSet)
    expect(container).toMatchSnapshot()
  })

  test('should render variable input step', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureWebAppsRollback,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback'
      },
      stageIdentifier: 'qaStage',
      onUpdate: jest.fn(),
      metadataMap: {},
      variablesData: {
        type: 'rollback',
        name: 'test',
        identifier: 'test',
        timeout: '10m'
      },
      isNewStep: false,
      readonly: true,
      stepType: StepType.AzureWebAppsRollback
    })
    const { container } = renderComponent(data(), StepViewType.InputVariable)
    expect(container).toMatchSnapshot()
  })
})
