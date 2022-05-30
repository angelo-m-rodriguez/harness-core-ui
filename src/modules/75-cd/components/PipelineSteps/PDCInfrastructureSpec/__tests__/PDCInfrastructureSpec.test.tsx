/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import * as CDNG from 'services/cd-ng'
import type { ResponseMessage } from 'services/cd-ng'
import { PDCInfrastructureSpec, PdcRegex, SshKeyRegex, parseAttributes } from '../PDCInfrastructureSpec'
import { ConnectorsResponse } from './mock/ConnectorsResponse.mock'
import { ConnectorResponse } from './mock/ConnectorResponse.mock'
import { mockListSecrets, mockSecret } from './mock/Secrets.mock'

const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: Pdc
                          spec:
                              connectorRef: account.connectorRef`

const infraDefPath = 'pipeline.stages[0].stage.spec.infrastructure.infrastructureDefinition'
const accountIdParams = { accountId: 'accountId1' }

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const validateHosts = jest
  .fn()
  .mockImplementation(() => Promise.resolve({ data: [{ host: 'localhost' }, { host: '1.2.3.4' }], status: 'SUCCESS' }))
const responseMessages: ResponseMessage[] = [{ code: 'ACCESS_DENIED', message: 'error validation' }]
const validateHostsFailure = jest.fn().mockImplementation(() => Promise.resolve({ responseMessages }))

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(ConnectorsResponse.data)),
  useValidateSshHosts: jest.fn(() => jest.fn(() => ({ mutate: jest.fn() }))),
  useFilterHostsByConnector: jest.fn(() => ({
    mutate: jest.fn(() => Promise.resolve({ data: { content: [{ hostname: '1.2.3.4' }] } }))
  })),
  useValidateHosts: jest.fn(() => ({ mutate: validateHosts })),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockListSecrets))
}))

jest.mock('services/portal', () => ({
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

const getRuntimeInputsValues = () => ({
  credentialsRef: RUNTIME_INPUT_VALUE
})

const getInitialValuesNoPreconfigured = () => ({
  credentialsRef: 'credentialsRef',
  hosts: ['localhost', '1.2.3.4'],
  delegateSelectors: ['tag1'],
  sshKey: 'sshkey1',
  allowSimultaneousDeployments: true
})

const getInitialValuesPreconfigured = () => ({
  ...getInitialValuesNoPreconfigured(),
  connectorRef: 'connectorRef1'
})

const getInitialValuesPreconfiguredWithAttributes = () => ({
  ...getInitialValuesPreconfigured(),
  attributeFilters: { hostType: 'DB' }
})

const getInitialValuePreconfiguredWithHostFilters = () => ({
  ...getInitialValuesPreconfigured(),
  hostFilters: ['5.5.5.5', '4.4.4.4']
})

const getEmptyInitialValues = () => ({
  credentialsRef: ''
})

const checkForFormInit = async (container: HTMLElement) => {
  const form = container.querySelector('form')
  return await waitFor(() => {
    expect(form!).toBeDefined()
  })
}

const openPreviewHosts = async (getByText: any) => {
  await waitFor(() => {
    expect(getByText('cd.steps.pdcStep.previewHosts')).toBeDefined()
  })
  act(() => {
    fireEvent.click(getByText('cd.steps.pdcStep.previewHosts'))
  })
  await waitFor(() => {
    expect(getByText('common.refresh')).toBeDefined()
  })
}

const checkTestConnection = async (getByText: any) => {
  act(() => {
    fireEvent.click(getByText('common.smtp.testConnection'))
  })
  await waitFor(() => {
    expect(validateHosts).toBeCalled()
  })
}

const submitForm = async (getByText: any) => {
  await act(async () => {
    fireEvent.click(getByText('Submit'))
  })
}

const refreshHosts = async (getByText: any) => {
  await waitFor(() => {
    expect(getByText('common.refresh')).toBeDefined()
  })
  act(() => {
    fireEvent.click(getByText('common.refresh'))
  })
}

const clickOn = (getByText: any, textIdentifier: string) => {
  act(() => {
    fireEvent.click(getByText(textIdentifier)!)
  })
}

const clickOnPreconfiguredHostsOption = async (getByText: any) => {
  clickOn(getByText, 'cd.steps.pdcStep.preconfiguredHostsOption')
  await waitFor(() => {
    expect(getByText('cd.steps.pdcStep.deployAllHostsOption')).toBeDefined()
  })
}

const clickOnDeploySpecificHostsOption = async (getByText: any) => {
  clickOn(getByText, 'cd.steps.pdcStep.deploySpecificHostsOption')
}

const clickOnDeployAllHostsOption = async (getByText: any) => {
  clickOn(getByText, 'cd.steps.pdcStep.deployAllHostsOption')
}

const updateConnector = async (container: any) => {
  const connnectorRefInput = queryByAttribute('data-testid', container, /connectorRef/)
  act(() => {
    fireEvent.change(connnectorRefInput!, {
      target: { value: { name: 'connectorName', identifier: 'connIdentifier' } }
    })
  })
}

const updateTextArea = async (container: any) => {
  const hostsArea = container.querySelector('textarea')
  act(() => {
    fireEvent.change(hostsArea!, { target: { value: 'localhost, 1.2.3.4' } })
  })
}
describe('Test PDCInfrastructureSpec behavior - No Preconfigured', () => {
  beforeEach(() => {
    factory.registerStep(new PDCInfrastructureSpec())
  })

  test('should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesNoPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesNoPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )
    await checkForFormInit(container)
    updateTextArea(container)
    await submitForm(getByText)
    expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValuesNoPreconfigured())
  })

  test('should not call onUpdate if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getEmptyInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getEmptyInitialValues()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )
    await checkForFormInit(container)
    updateTextArea(container)
    await submitForm(getByText)
    expect(onUpdateHandler).not.toHaveBeenCalled()
  })

  test('populate hosts, and open hosts table', async () => {
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesNoPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesNoPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )

    await checkForFormInit(container)
    updateTextArea(container)
    await openPreviewHosts(getByText)
    expect(getByText('cd.steps.pdcStep.noHosts')).toBeDefined()
    await submitForm(getByText)
  })

  test('switch to preconfigured manually', async () => {
    const { getByText, getByPlaceholderText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesNoPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesNoPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    await checkForFormInit(container)
    updateTextArea(container)
    await clickOnPreconfiguredHostsOption(getByText)
    await clickOnDeploySpecificHostsOption(getByText)
    await waitFor(() => {
      expect(getByPlaceholderText('cd.steps.pdcStep.specificHostsPlaceholder')).toBeDefined()
    })
    await clickOnDeployAllHostsOption(getByText)
    await updateConnector(container)
    await submitForm(getByText)
  })
})

describe('Test PDCInfrastructureSpec behavior - Preconfigured', () => {
  beforeEach(() => {
    factory.registerStep(new PDCInfrastructureSpec())
  })

  test('should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await checkForFormInit(container)
    await submitForm(getByText)
    expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValuesPreconfigured())
  })

  test('should not call onUpdate if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getEmptyInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getEmptyInitialValues()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )
    await checkForFormInit(container)
    updateTextArea(container)
    await submitForm(getByText)
    expect(onUpdateHandler).not.toHaveBeenCalled()
  })

  test('populate hosts, test is deploy to all hosts, and open hosts table', async () => {
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )

    await checkForFormInit(container)
    expect(container.querySelector('textarea')).toBe(null)
    await openPreviewHosts(getByText)
    expect(getByText('cd.steps.pdcStep.noHosts')).toBeDefined()
    await submitForm(getByText)
  })

  test('populate hosts, test is deploy to custom hosts, and open hosts table', async () => {
    const { getByText, container, getByPlaceholderText } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    await checkForFormInit(container)
    clickOn(getByText, 'cd.steps.pdcStep.deploySpecificHostsOption')
    await waitFor(() => {
      expect(getByPlaceholderText('cd.steps.pdcStep.specificHostsPlaceholder')).toBeDefined()
    })
    const customHostsTextArea = getByPlaceholderText('cd.steps.pdcStep.specificHostsPlaceholder')
    act(() => {
      fireEvent.change(customHostsTextArea, { target: { value: '1.1.1.1, 2.2.2.2' } })
    })

    await openPreviewHosts(getByText)
    await refreshHosts(getByText)
    await waitFor(() => {
      expect(getByText('1.2.3.4')).toBeDefined()
    })
    await submitForm(getByText)
  })

  test('test is deploy to custom hosts by attribute filter, and open hosts table', async () => {
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfiguredWithAttributes()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfiguredWithAttributes()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )

    await checkForFormInit(container)
    await openPreviewHosts(getByText)
    await refreshHosts(getByText)

    await waitFor(() => {
      expect(getByText('1.2.3.4')).toBeDefined()
    })
    await submitForm(getByText)
  })

  test('test is deploy to custom hosts by hosts filter, and open hosts table', async () => {
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuePreconfiguredWithHostFilters()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuePreconfiguredWithHostFilters()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )

    await checkForFormInit(container)
    await openPreviewHosts(getByText)
    await refreshHosts(getByText)

    await waitFor(() => {
      expect(getByText('1.2.3.4')).toBeDefined()
    })
    await submitForm(getByText)
  })

  test('populate hosts, test is deploy to all hosts, and open hosts table and test all connections - all success', async () => {
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    await checkForFormInit(container)
    await openPreviewHosts(getByText)
    refreshHosts(getByText)
    await waitFor(() => {
      expect(getByText('1.2.3.4')).toBeDefined()
    })
    await checkTestConnection(getByText)
    await submitForm(getByText)
  })
})

describe('test api rejections', () => {
  beforeEach(() => {
    factory.registerStep(new PDCInfrastructureSpec())
  })
  test('test all connections - error fail / reject', async () => {
    jest.spyOn(CDNG, 'listSecretsV2Promise').mockImplementationOnce(() => Promise.resolve(mockListSecrets as any))
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    await checkForFormInit(container)
    await openPreviewHosts(getByText)
    refreshHosts(getByText)
    await waitFor(() => {
      expect(getByText('1.2.3.4')).toBeDefined()
    })
    await checkTestConnection(getByText)
    await submitForm(getByText)
  })
  test('getSecretV2Promise rejection', async () => {
    jest
      .spyOn(CDNG, 'getSecretV2Promise')
      .mockImplementationOnce(() => Promise.reject({ data: { message: 'error...' } }))
    const { getByText } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    expect(CDNG.getSecretV2Promise).toBeCalled()
    await submitForm(getByText)
  })
  test('useValidateHosts failure test', async () => {
    jest.spyOn(CDNG, 'useValidateHosts').mockImplementationOnce(validateHostsFailure)
    const { getByText } = render(
      <TestStepWidget
        initialValues={getInitialValuesPreconfigured()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValuesPreconfigured()}
        type={StepType.PDC}
        stepViewType={StepViewType.InputSet}
        onUpdate={jest.fn()}
      />
    )
    expect(validateHostsFailure).toBeCalled()
    await submitForm(getByText)
  })
})

describe('invocation map test', () => {
  test('invocation map, empty yaml', () => {
    const yaml = ''
    const invocationMap = factory.getStep(StepType.PDC)?.getInvocationMap?.()
    invocationMap?.get(PdcRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).not.toBeCalled()
    invocationMap?.get(SshKeyRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.listSecretsV2Promise).not.toBeCalled()
  })

  test('invocation map, wrong yaml', () => {
    const yaml = {} as string
    const invocationMap = factory.getStep(StepType.PDC)?.getInvocationMap?.()
    invocationMap?.get(PdcRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).not.toBeCalled()
    invocationMap?.get(SshKeyRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.listSecretsV2Promise).not.toBeCalled()
  })

  test('invocation map should call template list', () => {
    jest.spyOn(CDNG, 'listSecretsV2Promise').mockImplementationOnce(() => Promise.resolve(mockListSecrets as any))
    jest
      .spyOn(CDNG, 'getConnectorListV2Promise')
      .mockImplementationOnce(() => Promise.resolve(ConnectorsResponse.data as any))

    const yaml = getYaml()

    const invocationMap = factory.getStep(StepType.PDC)?.getInvocationMap?.()
    invocationMap?.get(PdcRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).toBeCalled()
    invocationMap?.get(SshKeyRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.listSecretsV2Promise).toBeCalled()
  })
})

describe('test custom functions', () => {
  test('test parseAttributes fn', () => {
    expect(parseAttributes('hostType:DB\nregion:west')).toEqual({ hostType: 'DB', region: 'west' })
  })
})
