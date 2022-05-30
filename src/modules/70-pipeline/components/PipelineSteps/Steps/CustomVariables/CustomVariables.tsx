/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { get, set, isEmpty, isNil } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import type { FormikErrors } from 'formik'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { listSecretsV2Promise, SecretResponseWrapper } from 'services/cd-ng'
import { StepViewType, ValidateInputSetProps, Step } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { AllNGVariables } from '@pipeline/utils/types'
import { CustomVariableEditable, CustomVariableEditableExtraProps } from './CustomVariableEditable'
import { CustomVariableInputSet, CustomVariableInputSetExtraProps } from './CustomVariableInputSet'
import { CustomVariablesEditableStage } from './CustomVariablesEditableStage'
import type { CustomVariablesData } from './CustomVariableEditable'
import type { StepProps } from '../../PipelineStep'

const logger = loggerFor(ModuleName.COMMON)

const getConnectorValue = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? connector?.secret?.identifier
      : connector?.secret?.orgIdentifier
      ? `${Scope.ORG}.${connector?.secret?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.secret?.identifier}`
  }` || ''

const getConnectorName = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? `${connector?.secret?.type}: ${connector?.secret?.name}`
      : connector?.secret?.orgIdentifier
      ? `${connector?.secret?.type}[Org]: ${connector?.secret?.name}`
      : `${connector?.secret?.type}[Account]: ${connector?.secret?.name}`
  }` || ''

const SecretRefRegex = /^.+variables\.\d+\.value$/
export class CustomVariables extends Step<CustomVariablesData> {
  renderStep(
    props: StepProps<CustomVariablesData, CustomVariableEditableExtraProps | CustomVariableInputSetExtraProps>
  ): JSX.Element {
    const { initialValues, onUpdate, stepViewType, customStepProps, inputSetData, readonly, allowableTypes } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <CustomVariableInputSet
          initialValues={initialValues}
          onUpdate={data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          {...customStepProps}
          inputSetData={inputSetData}
          allowableTypes={allowableTypes}
        />
      )
    }

    if (stepViewType === StepViewType.StageVariable) {
      return (
        <CustomVariablesEditableStage
          initialValues={initialValues}
          onUpdate={data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          enableValidation
          readonly={readonly}
          allowableTypes={allowableTypes}
          {...customStepProps}
        />
      )
    }

    return (
      <CustomVariableEditable
        initialValues={initialValues}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        stepViewType={stepViewType}
        readonly={readonly}
        allowableTypes={allowableTypes}
        {...customStepProps}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<CustomVariablesData>): FormikErrors<CustomVariablesData> {
    const errors: FormikErrors<CustomVariablesData> = { variables: [] }
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    data?.variables?.forEach((variable: AllNGVariables, index: number) => {
      const currentVariableTemplate = get(template, `variables[${index}].value`, '')

      if (
        isRequired &&
        ((isEmpty(variable.value) && variable.type !== 'Number') ||
          (variable.type === 'Number' && (typeof variable.value !== 'number' || isNaN(variable.value)))) &&
        getMultiTypeFromValue(currentVariableTemplate) === MultiTypeInputType.RUNTIME
      ) {
        set(errors, `variables[${index}].value`, getString?.('fieldRequired', { field: variable.name }))
      }
    })

    if (!errors?.variables?.length) {
      delete errors.variables
    }
    return errors
  }

  async getSecretsListForYaml(
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
    const { accountId } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.value', ''))
      if (obj?.type === 'Secret') {
        const listOfSecrets = await listSecretsV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            includeSecretsFromEverySubScope: true,
            types: ['SecretText', 'SecretFile'],
            pageIndex: 0,
            pageSize: 100
          }
        }).then(response =>
          response?.data?.content?.map(connector => {
            return {
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            }
          })
        )
        return listOfSecrets || []
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  constructor() {
    super()
    this.invocationMap.set(SecretRefRegex, this.getSecretsListForYaml.bind(this))
  }

  protected type = StepType.CustomVariable
  protected stepName = 'Custom Variables'
  protected stepIcon: IconName = 'variable'
  protected stepPaletteVisible = false
  protected _hasStepVariables = true
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()
  protected defaultValues: CustomVariablesData = { variables: [] }

  processFormData(data: CustomVariablesData): CustomVariablesData {
    return {
      ...data,
      variables: data.variables.map(row => ({
        name: row.name,
        type: row.type,
        ...(!isNil(row.default)
          ? { default: row.type === 'Number' ? parseFloat(row.default as unknown as string) : row.default }
          : {}),
        value:
          row.type === 'Number' &&
          getMultiTypeFromValue(row.value as unknown as string) === MultiTypeInputType.FIXED &&
          row.value
            ? parseFloat(row.value as unknown as string)
            : row.value
      })) as AllNGVariables[]
    }
  }
}
