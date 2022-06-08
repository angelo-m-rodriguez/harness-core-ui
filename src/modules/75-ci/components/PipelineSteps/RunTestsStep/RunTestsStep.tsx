/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getFormValuesInCorrectFormat } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type {
  MultiTypeSelectOption,
  MultiTypePullOption,
  MultiTypeConnectorRef,
  MultiTypeListType,
  MultiTypeListUIType,
  MultiTypeMapType,
  MultiTypeMapUIType,
  Resources
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StringsMap } from 'stringTypes'
import { RunTestsStepBaseWithRef } from './RunTestsStepBase'
import { RunTestsStepInputSet } from './RunTestsStepInputSet'
import { RunTestsStepVariables, RunTestsStepVariablesProps } from './RunTestsStepVariables'
import { getInputSetViewValidateFieldsConfig, transformValuesFieldsConfig } from './RunTestsStepFunctionConfigs'

export interface RunTestsStepSpec {
  connectorRef: string
  image: string
  language: MultiTypePullOption
  buildTool: MultiTypePullOption
  args: string
  packages?: string // only for Java
  namespaces?: string // only for C#
  buildEnvironment?: string // only for C#
  frameworkVersion?: string // only for C#
  runOnlySelectedTests?: boolean
  testAnnotations?: string // only for Java
  preCommand?: string
  postCommand?: string
  reports?: {
    type: 'JUnit'
    spec: {
      paths: MultiTypeListType
    }
  }
  envVariables?: MultiTypeMapType
  outputVariables?: MultiTypeListType
  imagePullPolicy?: MultiTypeSelectOption
  runAsUser?: string
  resources?: Resources
}

export interface RunTestsStepData {
  identifier: string
  name?: string
  description?: string
  type: string
  timeout?: string
  spec: RunTestsStepSpec
}

export interface RunTestsStepSpecUI
  extends Omit<
    RunTestsStepSpec,
    'connectorRef' | 'buildTool' | 'language' | 'reports' | 'envVariables' | 'outputVariables' | 'resources'
  > {
  connectorRef: MultiTypeConnectorRef
  language: MultiTypeSelectOption
  buildTool: MultiTypeSelectOption
  reportPaths?: MultiTypeListUIType
  envVariables?: MultiTypeMapUIType
  outputVariables?: MultiTypeListUIType
  imagePullPolicy?: MultiTypeSelectOption
  shell?: MultiTypeSelectOption
  runAsUser?: string
  limitMemory?: string
  limitCPU?: string
}

// Interface for the form
export interface RunTestsStepDataUI extends Omit<RunTestsStepData, 'spec'> {
  spec: RunTestsStepSpecUI
}

export interface RunTestsStepProps {
  initialValues: RunTestsStepData
  template?: RunTestsStepData
  path?: string
  isNewStep?: boolean
  readonly?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: RunTestsStepData) => void
  onChange?: (data: RunTestsStepData) => void
  allowableTypes: MultiTypeInputType[]
  formik?: any
}

export class RunTestsStep extends PipelineStep<RunTestsStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  protected type = StepType.RunTests
  protected stepName = 'Configure Run Tests Step'
  protected stepIcon: IconName = 'run-tests-step'
  protected stepIconColor = '#6B6D85'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.RunTests'
  protected stepPaletteVisible = false

  protected defaultValues: RunTestsStepData = {
    identifier: '',
    type: StepType.RunTests as string,
    spec: {
      connectorRef: '',
      image: '',
      args: '',
      buildTool: '',
      language: '',
      packages: '',
      runOnlySelectedTests: true
    }
  }

  /* istanbul ignore next */
  processFormData<T>(data: T): RunTestsStepData {
    return getFormValuesInCorrectFormat<T, RunTestsStepData>(data, transformValuesFieldsConfig)
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<RunTestsStepData>): FormikErrors<RunTestsStepData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getString) {
      return validateInputSet(data, template, getInputSetViewValidateFieldsConfig(isRequired), { getString }, viewType)
    }

    return {}
  }

  renderStep(props: StepProps<RunTestsStepData>): JSX.Element {
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
        <RunTestsStepInputSet
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
        <RunTestsStepVariables
          {...(customStepProps as RunTestsStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }

    return (
      <RunTestsStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={onUpdate}
        readonly={readonly}
        isNewStep={isNewStep}
        ref={formikRef}
      />
    )
  }
}
