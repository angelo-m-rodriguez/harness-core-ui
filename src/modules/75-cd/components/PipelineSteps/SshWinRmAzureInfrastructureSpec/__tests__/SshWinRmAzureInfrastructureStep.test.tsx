/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, MultiTypeInputValue } from '@wings-software/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { K8sAzureInfrastructure } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { SshWinRmAzureInfrastructureSpec } from '../SshWinRmAzureInfrastructureSpec'
import {
  connectorsResponse,
  connectorResponse,
  subscriptionsResponse,
  resourceGroupsResponse,
  clustersResponse
} from './mocks'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => connectorResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(connectorsResponse.data)),
  getAzureSubscriptionsPromise: jest.fn(() => Promise.resolve(subscriptionsResponse.data)),
  getAzureResourceGroupsBySubscriptionPromise: jest.fn(() => Promise.resolve(resourceGroupsResponse.data)),
  getAzureClustersPromise: jest.fn(() => Promise.resolve(clustersResponse.data))
}))

const getInitialValues = (): K8sAzureInfrastructure => ({
  connectorRef: 'connectorRef',
  subscriptionId: 'subscriptionId',
  resourceGroup: 'resourceGroup',
  cluster: 'cluster',
  namespace: 'namespace',
  releaseName: 'releasename'
})

/*const getInvalidYaml = (): string => `p ipe<>line:
sta ges:
   - st<>[]age:
              s pe<> c: <> sad-~`

const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: SshWinRmAzure
                          spec:
                              connectorRef: account.connectorRef
                              subscriptionId: subscriptionId
                              resourceGroup: resourceGroup
                              cluster: cluster
                              namespace: namespace
                              releaseName: releaseName`

const connectorRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.connectorRef'
const subscriptionPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.subscriptionId'
const resourceGroupPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.resourceGroup'
const clusterPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.cluster'*/

jest.mock('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField', () => ({
  ...(jest.requireActual('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField') as any),
  // eslint-disable-next-line react/display-name
  FormMultiTypeConnectorField: (props: any) => {
    return (
      <div>
        <button
          name={'changeFormMultiTypeConnectorField'}
          onClick={() => {
            props.onChange('value', MultiTypeInputValue.STRING, MultiTypeInputType.RUNTIME)
          }}
        >
          Form Multi Type Connector Field button
        </button>
      </div>
    )
  }
}))

describe('Test Azure Infrastructure Spec snapshot', () => {
  beforeEach(() => {
    factory.registerStep(new SshWinRmAzureInfrastructureSpec())
  })

  test('Should render edit view with empty initial values', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.KubernetesAzure} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render edit view with values', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('Should render edit view for inputset view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputVariable}
      />
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Test Azure Infrastructure Spec behavior', () => {
  beforeEach(() => {
    factory.registerStep(new SshWinRmAzureInfrastructureSpec())
  })

  test.skip('Should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container, findByText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    const button = await waitFor(() => findByText('Form Multi Type Connector Field button'))
    act(() => {
      fireEvent.click(button)
    })

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })
    expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValues())
  })

  test.skip('Should not call onUpdate if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={{}}
        template={getInitialValues()}
        allValues={{}}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })

    expect(onUpdateHandler).not.toHaveBeenCalled()
  })

  test.skip('Should call onUpdate if valid values entered - edit view', async () => {
    const onUpdateHandler = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdateHandler}
        ref={ref}
      />
    )

    await act(async () => {
      const subscriptionInput = container.querySelector(
        '[placeholder="cd.steps.azureInfraStep.subscriptionPlaceholder"]'
      )
      fireEvent.change(subscriptionInput!, { target: { value: 'subscription1' } })

      await ref.current?.submitForm()
    })

    await waitFor(() => expect(onUpdateHandler).toHaveBeenCalled())
  })
})
