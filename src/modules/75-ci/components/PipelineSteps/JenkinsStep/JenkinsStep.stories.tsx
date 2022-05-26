/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { Meta, Story } from '@storybook/react'
import { Card, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  factory,
  TestStepWidget,
  TestStepWidgetProps
} from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { DockerHubStep as DockerHubStepComponent } from './DockerHubStep'

factory.registerStep(new DockerHubStepComponent())

export default {
  title: 'Pipelines / Pipeline Steps / DockerHubStep',
  // eslint-disable-next-line react/display-name
  component: TestStepWidget,
  argTypes: {
    type: { control: { disable: true } },
    stepViewType: {
      control: {
        type: 'inline-radio',
        options: Object.keys(StepViewType)
      }
    },
    onUpdate: { control: { disable: true } },
    initialValues: {
      control: {
        type: 'object'
      }
    }
  }
} as Meta

export const DockerHubStep: Story<Omit<TestStepWidgetProps, 'factory'>> = args => {
  const [value, setValue] = React.useState({})
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', columnGap: '20px' }}>
      <Card>
        <TestStepWidget {...args} onUpdate={setValue} />
      </Card>
      <Card>
        <pre>{yamlStringify(value)}</pre>
      </Card>
    </div>
  )
}

DockerHubStep.args = {
  initialValues: {
    identifier: 'Test_A',
    name: 'Test A',
    type: StepType.DockerHub,
    timeout: '10s',
    spec: {
      connectorRef: 'account.connectorRef',
      repo: 'Repository',
      tags: ['tag1', 'tag2', 'tag3'],
      dockerfile: 'Dockerfile',
      context: 'Context',
      labels: {
        label1: 'value1',
        label2: 'value2',
        label3: 'value3'
      },
      buildArgs: {
        buildArg1: 'value1',
        buildArg2: 'value2',
        buildArg3: 'value3'
      },
      optimize: true,
      target: 'Target',
      remoteCacheRepo: 'remote cache repo',
      // TODO: Right now we do not support Image Pull Policy but will do in the future
      // pull: 'always',
      resources: {
        limits: {
          memory: '128Mi',
          cpu: '0.2'
        }
      }
    }
  },
  type: StepType.DockerHub,
  stepViewType: StepViewType.Edit,
  path: '',
  testWrapperProps: {
    path: '/account/:accountId/org/:orgIdentifier/project/:projectIdentifier',
    pathParams: { accountId: 'zEaak-FLS425IEO7OLzMUg', orgIdentifier: 'default', projectIdentifier: 'Max_Test' }
  },
  template: {
    type: StepType.DockerHub,
    identifier: 'Test_A',
    timeout: RUNTIME_INPUT_VALUE,
    spec: {
      connectorRef: RUNTIME_INPUT_VALUE,
      repo: RUNTIME_INPUT_VALUE,
      tags: RUNTIME_INPUT_VALUE,
      dockerfile: RUNTIME_INPUT_VALUE,
      context: RUNTIME_INPUT_VALUE,
      labels: RUNTIME_INPUT_VALUE,
      buildArgs: RUNTIME_INPUT_VALUE,
      optimize: RUNTIME_INPUT_VALUE,
      target: RUNTIME_INPUT_VALUE,
      remoteCacheRepo: RUNTIME_INPUT_VALUE,
      // TODO: Right now we do not support Image Pull Policy but will do in the future
      // pull: RUNTIME_INPUT_VALUE,
      resources: {
        limits: {
          cpu: RUNTIME_INPUT_VALUE,
          memory: RUNTIME_INPUT_VALUE
        }
      }
    }
  },
  allValues: {
    type: StepType.DockerHub,
    name: 'Test A',
    identifier: 'Test_A',
    timeout: RUNTIME_INPUT_VALUE,
    spec: {
      connectorRef: RUNTIME_INPUT_VALUE,
      repo: RUNTIME_INPUT_VALUE,
      tags: RUNTIME_INPUT_VALUE,
      dockerfile: RUNTIME_INPUT_VALUE,
      context: RUNTIME_INPUT_VALUE,
      labels: RUNTIME_INPUT_VALUE,
      buildArgs: RUNTIME_INPUT_VALUE,
      optimize: RUNTIME_INPUT_VALUE,
      target: RUNTIME_INPUT_VALUE,
      remoteCacheRepo: RUNTIME_INPUT_VALUE,
      // TODO: Right now we do not support Image Pull Policy but will do in the future
      // pull: RUNTIME_INPUT_VALUE,
      resources: {
        limits: {
          cpu: RUNTIME_INPUT_VALUE,
          memory: RUNTIME_INPUT_VALUE
        }
      }
    }
  },
  customStepProps: {
    stageIdentifier: 'qaStage',
    metadataMap: {
      'step-name': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.name',
          localName: 'step.dockerHub.name'
        }
      },
      'step-timeout': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.timeout',
          localName: 'step.dockerHub.timeout'
        }
      },
      'step-connectorRef': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.connectorRef',
          localName: 'step.dockerHub.spec.connectorRef'
        }
      },
      'step-repo': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.repo',
          localName: 'step.dockerHub.spec.repo'
        }
      },
      'step-tags': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.tags',
          localName: 'step.dockerHub.spec.tags'
        }
      },
      'step-dockerfile': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.dockerfile',
          localName: 'step.dockerHub.spec.dockerfile'
        }
      },
      'step-context': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.context',
          localName: 'step.dockerHub.spec.context'
        }
      },
      'step-labels': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.labels',
          localName: 'step.dockerHub.spec.labels'
        }
      },
      'step-buildArgs': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.buildArgs',
          localName: 'step.dockerHub.spec.buildArgs'
        }
      },
      'step-optimize': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.optimize',
          localName: 'step.dockerHub.spec.optimize'
        }
      },
      'step-target': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.target',
          localName: 'step.dockerHub.spec.target'
        }
      },
      'step-remoteCacheRepo': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.remoteCacheRepo',
          localName: 'step.dockerHub.spec.remoteCacheRepo'
        }
      },
      // TODO: Right now we do not support Image Pull Policy but will do in the future
      // 'step-pull': {
      //   yamlProperties: {
      //     fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.pull',
      //     localName: 'step.dockerHub.spec.pull'
      //   }
      // },
      'step-limitMemory': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.resources.limits.memory',
          localName: 'step.dockerHub.spec.resources.limits.memory'
        }
      },
      'step-limitCPU': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.dockerHub.spec.resources.limits.cpu',
          localName: 'step.dockerHub.resources.spec.limits.cpu'
        }
      }
    },
    variablesData: {
      type: StepType.DockerHub,
      identifier: 'dockerHub',
      name: 'step-name',
      timeout: 'step-timeout',
      spec: {
        connectorRef: 'step-connectorRef',
        repo: 'step-repo',
        tags: 'step-tags',
        dockerfile: 'step-dockerfile',
        context: 'step-context',
        labels: 'step-labels',
        buildArgs: 'step-buildArgs',
        optimize: 'step-optimize',
        target: 'step-target',
        remoteCacheRepo: 'step-remoteCacheRepo',
        // TODO: Right now we do not support Image Pull Policy but will do in the future
        // pull: 'step-pull',
        resources: {
          limits: {
            memory: 'step-limitMemory',
            cpu: 'step-limitCPU'
          }
        }
      }
    }
  }
}
