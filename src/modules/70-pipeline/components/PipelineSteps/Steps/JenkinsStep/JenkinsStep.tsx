/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, SelectOption, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { parse } from 'yaml'
import get from 'lodash-es/get'
import { connect, FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import type {
  MultiTypeMapUIType,
  MultiTypeListUIType,
  MultiTypeConnectorRef
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import type { StringsMap } from 'stringTypes'
import { JenkinsStepBaseWithRef } from './JenkinsStepBase'
import JenkinsStepInputSetBasic from './JenkinsStepInputSet'
import { JenkinsStepVariables, JenkinsStepVariablesProps } from './JenkinsStepVariables'
import { getInputSetViewValidateFieldsConfig } from './JenkinsStepFunctionConfigs'
import { getConnectorSuggestions } from './EditorSuggestionUtils'
import type { JenkinsStepSpec, JenkinsStepData } from './types'

const logger = loggerFor(ModuleName.CI)
const JenkinsStepInputSet = connect(JenkinsStepInputSetBasic)
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

export class JenkinsStep extends PipelineStep<JenkinsStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this.invocationMap = new Map()
    this.invocationMap.set(/^.+step\.spec\.connectorRef$/, this.getConnectorList.bind(this))
  }

  protected type = StepType.JenkinsBuild
  protected stepName = 'Jenkins'
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
  processFormData(data: any): JenkinsStepData {
    const res = {
      ...data,
      spec: {
        ...data.spec,
        connectorRef:
          typeof data?.spec?.connectorRef === 'string'
            ? data?.spec?.connectorRef
            : (data?.spec?.connectorRef as any)?.value,
        jobName:
          ((data.spec.jobName as unknown as SelectOption).value as string) || (data.spec.jobName as unknown as string)
      }
    }
    return res
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

  private getInitialValues(initialValues: JenkinsStepData): JenkinsStepData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        connectorRef:
          typeof initialValues?.spec?.connectorRef === 'string'
            ? initialValues?.spec?.connectorRef
            : (initialValues?.spec?.connectorRef as any)?.value
      }
    }
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

    const connectorRef = this.getInitialValues(initialValues)?.spec?.connectorRef
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <JenkinsStepInputSet
          initialValues={this.getInitialValues(initialValues)}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          readonly={!!inputSetData?.readonly}
          stepViewType={stepViewType}
          onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
          onChange={(values: any) => onChange?.(this.processFormData(values))}
          allowableTypes={allowableTypes}
          connectorRef={getMultiTypeFromValue(connectorRef) !== MultiTypeInputType.RUNTIME ? connectorRef : ''}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <JenkinsStepVariables
          {...(customStepProps as JenkinsStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
        />
      )
    }

    return (
      <JenkinsStepBaseWithRef
        initialValues={this.getInitialValues(initialValues)}
        allowableTypes={allowableTypes}
        onChange={(values: any) => onChange?.(this.processFormData(values))}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={(values: any) => onUpdate?.(this.processFormData(values))}
        ref={formikRef}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
