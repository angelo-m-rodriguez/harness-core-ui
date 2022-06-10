/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import {
  PipelineContextInterface,
  PipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StageType } from '@pipeline/utils/stageHelpers'
import { InfraDeploymentType } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import { envs } from './mocks'
import overridePipelineContext from './overrideSetPipeline.json'
import provisionerInfo from './provisionerInfo.json'
import DeployInfraDefinition from '../DeployInfraDefinition/DeployInfraDefinition'

const getSpec = (type: string) => {
  switch (type) {
    case InfraDeploymentType.KubernetesDirect:
      return {
        serviceConfig: {
          serviceDefinition: {
            type: 'Kubernetes'
          }
        },
        infrastructure: {
          infrastructureDefinition: {
            type: 'KubernetesDirect',
            ...provisionerInfo
          }
        }
      }
    case InfraDeploymentType.KubernetesGcp:
      return {
        serviceConfig: {
          serviceDefinition: {
            type: 'Kubernetes'
          }
        },
        infrastructure: {
          infrastructureDefinition: {
            type: 'KubernetesGcp'
          }
        }
      }
    case InfraDeploymentType.ServerlessAwsLambda:
      return {
        serviceConfig: {
          serviceDefinition: {
            type: 'ServerlessAwsLambda'
          }
        },
        infrastructure: {
          infrastructureDefinition: {
            type: 'ServerlessAwsLambda',
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: RUNTIME_INPUT_VALUE,
              stage: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    case InfraDeploymentType.ServerlessAzureFunctions:
      return {
        serviceConfig: {
          serviceDefinition: {
            type: 'ServerlessAzureFunctions'
          }
        },
        infrastructure: {
          infrastructureDefinition: {
            type: 'ServerlessAzureFunctions',
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              stage: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

    case InfraDeploymentType.ServerlessGoogleFunctions:
      return {
        serviceConfig: {
          serviceDefinition: {
            type: 'ServerlessGoogleFunctions'
          }
        },
        infrastructure: {
          infrastructureDefinition: {
            type: 'ServerlessGoogleFunctions',
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              stage: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    default:
      return {}
  }
}

const getOverrideContextValue = (type?: string): PipelineContextInterface => {
  return {
    ...overridePipelineContext,
    getStageFromPipeline: jest.fn().mockReturnValue({
      stage: {
        stage: {
          name: 'Stage 3',
          identifier: 's3',
          type: StageType.DEPLOY,
          description: '',
          spec: getSpec(type || '')
        }
      }
    }),
    updateStage: jest.fn().mockImplementation(() => ({ then: jest.fn() })),
    updatePipeline: jest.fn()
  } as any
}

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentList: jest.fn().mockImplementation(() => ({ loading: false, data: envs, refetch: jest.fn() }))
}))

jest.mock('lodash-es', () => ({
  ...(jest.requireActual('lodash-es') as Record<string, any>),
  debounce: jest.fn(fn => {
    fn.cancel = jest.fn()
    return fn
  })
}))

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

jest.mock('@pipeline/components/AbstractSteps/StepWidget', () => ({
  ...(jest.requireActual('@pipeline/components/AbstractSteps/StepWidget') as any),
  // eslint-disable-next-line react/display-name
  StepWidget: (props: any) => {
    return (
      <div className="step-widget-mock">
        <button
          name={'updateStepWidget'}
          onClick={() => {
            props.onUpdate(props.initialValues)
          }}
        >
          Step Widget button
        </button>
      </div>
    )
  }
}))

describe('Deploy infra specifications test', () => {
  test('Should match snapshot', () => {
    const context = getOverrideContextValue()
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test(`Should Environment section be present`, () => {
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getOverrideContextValue()}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(getByText('environment')).toBeTruthy()
  })

  test(`Should Infrastructure definition section be present`, () => {
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getOverrideContextValue()}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    expect(getByText('pipelineSteps.deploy.infrastructure.infraDefinition')).toBeTruthy()
  })

  test(`Should updateEnvStep be called upon StepWidget change`, async () => {
    const context = getOverrideContextValue()
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[0])

    expect(context.updateStage).toBeCalled()
  })

  test(`Aws card should be rendering properly`, async () => {
    const context = getOverrideContextValue(InfraDeploymentType.ServerlessAwsLambda)
    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const awsCard = await waitFor(() => findByText('common.aws'))
    expect(awsCard).toBeTruthy()
  })

  test(`KubernetesGcp card should be rendering properly`, async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesGcp)
    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const changeButton = await waitFor(() => findByText('Change'))
    expect(changeButton).toBeTruthy()
    act(() => {
      fireEvent.click(changeButton)
    })
    const awsCard = await waitFor(() => findByText('pipelineSteps.deploymentTypes.kubernetes'))
    expect(awsCard).toBeTruthy()
  })

  test(`KubernetesDirect card should be rendering properly`, async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesDirect)
    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const awsCard = await waitFor(() => findByText('pipelineSteps.deploymentTypes.kubernetes'))
    expect(awsCard).toBeTruthy()
  })

  test(`Azure card should be rendering properly`, async () => {
    const context = getOverrideContextValue(InfraDeploymentType.ServerlessAzureFunctions)
    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    const awsCard = await waitFor(() => findByText('common.azure'))
    expect(awsCard).toBeTruthy()
  })

  test(`cleanUpEmptyProvisioner is getting called properly`, async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesDirect)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[1])
    expect(context.updateStage).toBeCalled()
  })

  test('Should Accordion be shown when non-serverless deployment type is selected', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesDirect)
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container.getElementsByClassName('accordion')[0]).toBeInTheDocument()
    expect(container.getElementsByClassName('tabHeading')[0]).toBeInTheDocument()
  })

  test('Should call resetInfrastructureDefinition upon selecting new infrastructureType', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesDirect)
    const { findByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const changeButton = await waitFor(() => findByText('Change'))
    expect(changeButton).toBeTruthy()
    act(() => {
      fireEvent.click(changeButton)
    })
    const kubernetesGcp = await waitFor(() => findByText('pipelineSteps.deploymentTypes.gk8engine'))
    act(() => {
      fireEvent.click(kubernetesGcp)
    })
    expect(context.updateStage).toBeCalled()
  })

  test('Should call onUpdateInfrastructureDefinition upon typing something on region field for Aws', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.ServerlessAwsLambda)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[1])
    expect(context.updateStage).toBeCalled()
  })

  test('Should call onUpdateInfrastructureDefinition upon typing something on region field for KubernetesDirect', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesDirect)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[2])
    expect(context.updateStage).toBeCalled()
  })
  test('Should call onUpdateInfrastructureDefinition upon typing something on region field for KubernetesGcp', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.KubernetesGcp)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[2])
    expect(context.updateStage).toBeCalled()
  })

  test('Should call onUpdateInfrastructureDefinition upon typing something on region field for ServerlessGoogleFunctions', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.ServerlessGoogleFunctions)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[1])
    expect(context.updateStage).toBeCalled()
  })

  test('Should call onUpdateInfrastructureDefinition upon typing something on region field for ServerlessAzureFunctions', async () => {
    const context = getOverrideContextValue(InfraDeploymentType.ServerlessAzureFunctions)
    const { findAllByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={context}>
          <DeployInfraDefinition />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const button = await waitFor(() => findAllByText('Step Widget button'))
    fireEvent.click(button[1])
    expect(context.updateStage).toBeCalled()
  })
})
