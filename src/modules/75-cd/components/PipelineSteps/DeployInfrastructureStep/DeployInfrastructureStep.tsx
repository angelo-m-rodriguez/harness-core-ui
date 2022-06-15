/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikErrors } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'

import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@harness/uicore'
import { getEnvironmentListPromise, PipelineInfrastructure } from 'services/cd-ng'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'

import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { Step, StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import { DeployInfrastructureWidget } from './DeployInfrastructureWidget'
import DeployInfrastructureInputStep from './DeployInfrastructureInputStep'
import type { PipelineInfrastructureV2 } from './utils'

const logger = loggerFor(ModuleName.CD)
const EnvironmentRegex = /^.+stage\.spec\.environment\.environmentRef$/

export class DeployInfrastructureStep extends Step<PipelineInfrastructureV2> {
  lastFetched: number

  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  protected stepPaletteVisible = false
  protected type = StepType.DeployInfrastructure
  protected stepName = 'Deploy Infrastructure'
  protected stepIcon: IconName = 'main-environments'

  protected defaultValues: PipelineInfrastructureV2 = {}

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(EnvironmentRegex, this.getEnvironmentListForYaml.bind(this))
  }

  protected getEnvironmentListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.infrastructure.environmentRef', ''))
      if (obj.type === 'Deployment') {
        return getEnvironmentListPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(service => ({
              label: service.environment?.name || '',
              insertText: service.environment?.identifier || '',
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  renderStep(props: StepProps<PipelineInfrastructureV2>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, inputSetData, readonly = false, allowableTypes } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <DeployInfrastructureInputStep
          initialValues={initialValues}
          readonly={readonly}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          allowableTypes={allowableTypes}
          inputSetData={inputSetData}
        />
      )
    }

    return (
      <DeployInfrastructureWidget
        initialValues={initialValues}
        readonly={readonly}
        onUpdate={onUpdate}
        stepViewType={stepViewType}
        allowableTypes={allowableTypes}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<PipelineInfrastructure>): FormikErrors<PipelineInfrastructure> {
    const errors: FormikErrors<PipelineInfrastructure> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      isEmpty(data?.environmentRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.environmentRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.environmentRef = getString?.('cd.pipelineSteps.environmentTab.environmentIsRequired')
    }
    return errors
  }
}
