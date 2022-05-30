/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName } from '@blueprintjs/core'
import { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { Step, StepProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { PipelineContextInterface } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { CustomStageMinimalModeProps } from '../types'

class StepFactory extends AbstractStepFactory {
  protected type = 'test-factory'
  protected stepName = 'stepOne'
  protected stepIcon: IconName = 'cross'
}

class StepOne extends Step<Record<string, any>> {
  protected type = StepType.HarnessApproval
  protected stepName = 'stepOne'
  protected stepIcon: IconName = 'cross'
  validateInputSet(): Record<string, any> {
    return {}
  }
  protected defaultValues = { a: 'a' }
  renderStep(props: StepProps<Record<string, any>>): JSX.Element {
    return <div onClick={() => props.onUpdate?.(props.initialValues)}>{JSON.stringify(props.initialValues)}</div>
  }
}

class StepTwo extends Step<Record<string, any>> {
  protected type = StepType.CustomVariable
  protected stepName = 'stepTwo'
  protected stepIcon: IconName = 'cross'
  validateInputSet(): Record<string, any> {
    return {}
  }
  protected defaultValues = { a: 'a' }
  renderStep(props: StepProps<Record<string, any>>): JSX.Element {
    return <div onClick={() => props.onUpdate?.(props.initialValues)}>{JSON.stringify(props.initialValues)}</div>
  }
}

const stepFactory = new StepFactory()
stepFactory.registerStep(new StepOne())
stepFactory.registerStep(new StepTwo())

const stagesMap = {
  Deployment: {
    name: 'Deploy',
    type: 'Deployment',
    icon: 'pipeline-deploy',
    iconColor: 'var(--pipeline-deploy-stage-color)',
    isApproval: false,
    openExecutionStrategy: true
  },
  ci: {
    name: 'Deploy',
    type: 'ci',
    icon: 'pipeline-build',
    iconColor: 'var(--pipeline-build-stage-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Pipeline: {
    name: 'Deploy',
    type: 'Pipeline',
    icon: 'pipeline',
    iconColor: 'var(--pipeline-blue-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Custom: {
    name: 'Deploy',
    type: 'Custom',
    icon: 'custom-stage-icon',
    iconColor: 'var(--pipeline-custom-stage-color)',
    isApproval: false,
    openExecutionStrategy: false
  },
  Approval: {
    name: 'Deploy',
    type: 'Approval',
    icon: 'approval-stage-icon',
    iconColor: 'var(--pipeline-approval-stage-color)',
    isApproval: true,
    openExecutionStrategy: false
  }
}

export const pipelineContextMock = {
  state: {
    pipeline: {
      name: 'Pipeline',
      identifier: 'Pipeline',
      description: null,
      tags: null,
      stages: [
        {
          stage: {
            name: 'CustomStep',
            identifier: 'CustomStep',
            description: '',
            type: 'Custom',
            spec: {}
          }
        }
      ]
    },
    originalPipeline: {
      name: 'Pipeline',
      identifier: 'Pipeline',
      description: null,
      tags: null,
      stages: [
        {
          stage: {
            name: 'CustomStep',
            identifier: 'CustomStep',
            description: '',
            type: 'Custom',
            spec: {}
          }
        }
      ]
    },
    pipelineIdentifier: 'Pipeline',
    pipelineView: {
      isSplitViewOpen: true,
      isDrawerOpened: false,
      splitViewData: { type: 'StageView' },
      drawerData: { type: 'AddCommand' }
    },
    selectionState: { selectedStageId: 'CustomStep', selectedStepId: 'harnessCustom' },
    isLoading: false,
    isBEPipelineUpdated: false,
    isDBInitialized: true,
    isUpdated: true,
    isInitialized: true,
    error: '',
    templateTypes: {}
  },
  contextType: 'Pipeline',
  stepsFactory: stepFactory,
  stagesMap
}

export const getPropsForMinimalStage = (): PipelineStagesProps<CustomStageMinimalModeProps> => ({
  minimal: true,
  stageProps: {
    data: {
      stage: {
        identifier: '',
        name: ''
      } as any
    } as any,
    onSubmit: jest.fn(),
    onChange: jest.fn()
  },
  children: [
    {
      props: {
        name: '',
        type: 'CUSTOM',
        icon: 'nav-harness',
        isApproval: false,
        isDisabled: false,
        title: 'CustomStage',
        description: ''
      },
      type: '',
      key: 'custom'
    }
  ]
})

export const getDummyPipelineContextValue = (): PipelineContextInterface => {
  return {
    ...pipelineContextMock,
    updatePipeline: jest.fn(),
    updatePipelineView: jest.fn(),
    updateStage: jest.fn().mockResolvedValue({}),
    setSelectedTabId: jest.fn(),
    getStagePathFromPipeline: jest.fn(),
    getStageFromPipeline: jest.fn(() => {
      return { stage: pipelineContextMock.state.pipeline.stages[0], parent: undefined }
    }),
    setTemplateTypes: jest.fn()
  } as any
}

export const customStageTemplateMock = {
  name: 'Ishant Custom Stage Test',
  identifier: 'Ishant_Custom_Stage_Test',
  versionLabel: 'v1',
  type: 'Stage',
  projectIdentifier: 'Ishant_Test_Project',
  orgIdentifier: 'default',
  tags: {},
  spec: {
    type: 'Custom',
    spec: {
      execution: {
        steps: [
          {
            step: {
              name: 'Custom',
              identifier: 'custom',
              type: 'HarnessApproval',
              timeout: '1d',
              spec: {
                approvalMessage: 'Please review the following information\nand approve the pipeline progression',
                includePipelineExecutionHistory: true,
                approvers: { minimumCount: 1, disallowPipelineExecutor: false }
              }
            }
          }
        ]
      }
    }
  }
}

export const customStageTemplateSummaryMock: TemplateSummaryResponse = {
  accountId: 'px7xd_BFRCi-pfWPYXVjvw',
  orgIdentifier: 'default',
  projectIdentifier: 'Ishant_Test_Project',
  identifier: 'Ishant_Custom_Stage_Test',
  name: 'Ishant Custom Stage Test',
  description: '',
  tags: {},
  yaml: yamlStringify({ template: customStageTemplateMock }),
  versionLabel: 'v1',
  templateEntityType: 'Stage',
  childType: 'Custom',
  templateScope: 'project',
  version: 0,
  gitDetails: {},
  entityValidityDetails: {
    valid: true
  },
  lastUpdatedAt: 1645627607011,
  stableTemplate: true
}

export const getPropsForMinimalStageWithTemplateUsed = (): CustomStageMinimalModeProps => ({
  data: {
    stage: {
      identifier: '',
      name: ''
    } as any
  } as any,
  template: customStageTemplateSummaryMock,
  onSubmit: jest.fn(),
  onChange: jest.fn()
})
