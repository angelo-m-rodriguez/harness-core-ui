/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Button } from '@harness/uicore'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import MonitoredServiceInputSetsTemplate, { getNestedRuntimeInputs } from '../MonitoredServiceInputSetsTemplate'
import { pathList, spec, templateYamlData } from './MonitoredServiceInputSetsTemplate.mock'

jest.mock('services/template-ng', () => ({
  ...(jest.requireActual('services/template-ng') as any),
  useGetTemplateInputSetYaml: jest.fn().mockImplementation(() => ({
    data: {
      status: 'SUCCESS',
      data: 'identifier: "<+monitoredService.serviceRef>_<+monitoredService.environmentRef>"\ntype: "Application"\nserviceRef: "<+input>"\nenvironmentRef: "<+input>"\nsources:\n  healthSources:\n  - identifier: "AppD_default_metrics_runtime_connector"\n    type: "AppDynamics"\n    spec:\n      applicationName: "<+input>"\n      tierName: "<+input>"\n      connectorRef: "<+input>"\n  - identifier: "Appd_with_custom_and_runtime_connector"\n    type: "AppDynamics"\n    spec:\n      applicationName: "<+input>"\n      tierName: "<+input>"\n      metricDefinitions:\n      - identifier: "appdMetric_101"\n        completeMetricPath: "<+input>"\n        analysis:\n          deploymentVerification:\n            serviceInstanceMetricPath: "<+input>"\n      connectorRef: "<+input>"\n',
      refetch: jest.fn(),
      error: null,
      loading: false
    }
  })),
  useGetTemplate: jest
    .fn()
    .mockImplementation(() => ({ data: templateYamlData, refetch: jest.fn(), error: null, loading: false }))
}))
const refetchSaveTemplateYaml = jest.fn().mockResolvedValue({})
jest.mock('services/cv', () => ({
  ...(jest.requireActual('services/cv') as any),
  useSaveMonitoredServiceFromYaml: jest.fn().mockImplementation(() => ({ mutate: refetchSaveTemplateYaml }))
}))

jest.mock('@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment', () => ({
  useGetHarnessServices: () => ({
    serviceOptions: [
      { label: 'service1', value: 'service1' },
      { label: 'AppDService101', value: 'AppDService101' }
    ]
  }),
  HarnessServiceAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addService"
          onClick={() => props.serviceProps.onNewCreated({ name: 'newService', identifier: 'newService' })}
        />
      </Container>
    )
  },
  HarnessEnvironmentAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addEnv"
          onClick={() => props.environmentProps.onNewCreated({ name: 'newEnv', identifier: 'newEnv' })}
        />
      </Container>
    )
  },
  useGetHarnessEnvironments: () => {
    return {
      environmentOptions: [
        { label: 'env1', value: 'env1' },
        { label: 'AppDTestEnv1', value: 'AppDTestEnv1' }
      ]
    }
  }
}))
describe('Test MonitoredServiceInputSetsTemplate', () => {
  test('should render with ms inputset', async () => {
    const { container, findByText } = render(
      <TestWrapper>
        <MonitoredServiceInputSetsTemplate />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    const submit = await findByText('submit')
    fireEvent.click(submit)
    await waitFor(() => expect(findByText('cv.monitoredServices.monitoredServiceCreated')).toBeTruthy())
  })

  test('should validate getNestedRuntimeInputs', () => {
    const output = getNestedRuntimeInputs(spec, [], 'path')
    expect(output).toEqual(pathList)
  })
})
