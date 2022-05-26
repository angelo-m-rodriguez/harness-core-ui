/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName, MultiTypeInputType } from '@wings-software/uicore'
import { parse } from 'yaml'
import get from 'lodash-es/get'
import type { FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getFormValuesInCorrectFormat } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type {
  MultiTypeMapType,
  MultiTypeMapUIType,
  MultiTypeListType,
  MultiTypeListUIType,
  MultiTypeConnectorRef,
  Resources
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import type { StringsMap } from 'stringTypes'
import { DockerHubStepBaseWithRef } from './JenkinsStepBase'
import { DockerHubStepInputSet } from './JenkinsStepInputSet'
import { DockerHubStepVariables, DockerHubStepVariablesProps } from './JenkinsStepVariables'
import { getInputSetViewValidateFieldsConfig, transformValuesFieldsConfig } from './JenkinsStepFunctionConfigs'
import { getConnectorSuggestions } from '../EditorSuggestionUtils'
import type { AllFailureStrategyConfig } from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/utils'

const logger = loggerFor(ModuleName.CI)

interface jobParameterInterface {
  name: string
  value: string
}

export interface JenkinsStepSpec {
  connectorRef: string
  jobName: string
  jobParameter: jobParameterInterface[]
  delegateSelectors: string[]
  unstableStatusAsSuccess?: boolean
  captureEnvironmentVariable?: boolean
}

export interface JenkinsStepData {
  identifier: string
  name?: string
  type: string
  timeout?: string
  failureStrategies?: AllFailureStrategyConfig[]
  spec: JenkinsStepSpec
}

export interface JenkinsStepSpecUI
  extends Omit<JenkinsStepSpec, 'connectorRef' | 'tags' | 'labels' | 'buildArgs' | 'pull' | 'resources'> {
  connectorRef: MultiTypeConnectorRef
  tags: MultiTypeListUIType
  labels?: MultiTypeMapUIType
  buildArgs?: MultiTypeMapUIType
}

// Interface for the form
export interface JenkinsStepDataUI extends Omit<JenkinsStepData, 'spec'> {
  spec: JenkinsStepSpecUI
}

export interface JenkinsStepProps {
  initialValues: JenkinsStepData
  template?: JenkinsStepData
  path?: string
  readonly?: boolean
  isNewStep?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: JenkinsStepData) => void
  onChange?: (data: JenkinsStepData) => void
  allowableTypes: MultiTypeInputType[]
  formik?: any
}

export class DockerHubStep extends PipelineStep<JenkinsStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this.invocationMap = new Map()
    this.invocationMap.set(/^.+step\.spec\.connectorRef$/, this.getConnectorList.bind(this))
  }

  protected type = StepType.JenkinsBuild
  protected stepName = 'Build and Push an image to Jenkins'
  protected stepIcon: IconName = 'service-jenkins'
  // to be edited in strings.en.yaml file in future
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.Jenkins'
  protected stepPaletteVisible = false

  protected defaultValues: JenkinsStepData = {
    identifier: '',
    type: StepType.JenkinsBuild as string,
    spec: {
      connectorRef: '',
      jobName: '',
      jobParameter: [],
      delegateSelectors: [],
      unstableStatusAsSuccess: false,
      captureEnvironmentVariable: false
    }
  }

  /* istanbul ignore next */
  protected async getConnectorList(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj.type === StepType.DockerHub) {
        return getConnectorSuggestions(params, ['Jenkins'])
      }
    }
    return []
  }

  /* istanbul ignore next */
  processFormData<T>(data: T): JenkinsStepData {
    return getFormValuesInCorrectFormat<T, JenkinsStepData>(data, transformValuesFieldsConfig)
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<JenkinsStepData>): FormikErrors<JenkinsStepData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getString) {
      return validateInputSet(data, template, getInputSetViewValidateFieldsConfig(isRequired), { getString }, viewType)
    }

    return {}
  }

  renderStep(props: StepProps<JenkinsStepData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      onChange,
      allowableTypes
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <DockerHubStepInputSet
          initialValues={initialValues}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          readonly={!!inputSetData?.readonly}
          stepViewType={stepViewType}
          onUpdate={onUpdate}
          onChange={onChange}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <DockerHubStepVariables
          {...(customStepProps as DockerHubStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }

    return (
      <DockerHubStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={onUpdate}
        ref={formikRef}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
