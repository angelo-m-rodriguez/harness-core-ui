/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { unset } from 'lodash-es'
import { getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import type { Scope } from '@common/interfaces/SecretsInterface'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { ListType, SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'

import type {
  InlineTerraformVarFileSpec,
  StepElementConfig,
  StringNGVariable,
  TerraformApplyStepInfo,
  TerraformBackendConfig,
  TerraformConfigFilesWrapper,
  TerraformDestroyStepInfo,
  TerraformExecutionData,
  TerraformPlanExecutionData,
  TerraformPlanStepInfo,
  TerraformRollbackStepInfo,
  TerraformStepConfiguration,
  TerraformVarFileWrapper
} from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'

export const TerraformStoreTypes = {
  Inline: 'Inline',
  Remote: 'Remote'
}
export interface TerraformProps<T = TerraformData> {
  initialValues: T
  onUpdate?: (data: T) => void
  onChange?: (data: T) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  configTypes?: SelectOption[]
  isNewStep?: boolean
  inputSetData?: {
    template?: T
    path?: string
  }
  readonly?: boolean
  path?: string
  stepType?: string
  gitScope?: GitFilterScope
  allValues?: T
}

export interface TerraformPlanProps {
  initialValues: TFPlanFormData
  onUpdate?: (data: TFPlanFormData) => void
  onChange?: (data: TFPlanFormData) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  configTypes?: SelectOption[]
  isNewStep?: boolean
  inputSetData?: {
    template?: TFPlanFormData
    path?: string
  }
  path?: string
  readonly?: boolean
  gitScope?: GitFilterScope
  stepType?: string
  allValues?: TFPlanFormData
}

export interface RemoteVar {
  varFile: {
    identifier?: string
    spec?: {
      store?: {
        spec?: {
          gitFetchType?: string
          repoName?: string
          branch?: string
          commitId?: string
          connectorRef?: {
            label: string
            value: string
            scope: Scope
            live: boolean
            connector: { type: string; spec: { val: string } }
          }
          paths?: PathInterface[]
          content?: string
        }
      }
    }
  }
}

export interface TerraformPlanVariableStepProps {
  initialValues: TFPlanFormData
  originalData?: TFPlanFormData
  stageIdentifier?: string
  onUpdate?(data: TFPlanFormData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData?: TFPlanFormData
}

export interface TerraformVariableStepProps {
  initialValues: TerraformData
  originalData?: TerraformData
  stageIdentifier?: string
  onUpdate?(data: TerraformData): void
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData?: TerraformData
  stepType?: string
}

export const ConfigurationTypes: Record<TerraformStepConfiguration['type'], TerraformStepConfiguration['type']> = {
  Inline: 'Inline',
  InheritFromPlan: 'InheritFromPlan',
  InheritFromApply: 'InheritFromApply'
}

export const CommandTypes = {
  Apply: 'Apply',
  Destroy: 'Destroy'
}
export interface PathInterface {
  [x: string]: any
  path: string
}

export interface EnvironmentVar {
  key: string
  value: string
}

export interface BackendConfig {
  type: string
  spec: {
    content?: string
  }
}
export interface VarFileArray {
  varFile: {
    type?: string
    store?: {
      spec?: {
        gitFetchType?: string
        repoName?: string
        branch?: string
        commitId?: string
        connectorRef?: {
          label: string
          value: string
          scope: Scope
          live: boolean
          connector: { type: string; spec: { val: string } }
        }
        paths?: PathInterface[]
        content?: string
      }
    }
  }
}

export interface ConfigFileData {
  spec?: {
    configuration?: {
      spec?: TerraformApplyStepInfo
    }
  }
}

export interface TFPlanConfig {
  spec?: {
    configuration?: TerraformPlanExecutionData
  }
}

export interface Connector {
  label: string
  value: string
  scope: Scope
  live: boolean
  connector: {
    type: string
    identifier: string
    name: string
    spec: { val: string; url: string; connectionType?: string; type?: string }
  }
}
export interface TerraformData extends StepElementConfig {
  spec?: {
    provisionerIdentifier?: string
    configuration?: {
      type?: 'Inline' | 'InheritFromPlan' | 'InheritFromApply'

      spec?: TFDataSpec
    }
  }
}

export interface TerraformPlanData extends StepElementConfig {
  spec?: TerraformPlanStepInfo
}

export interface TFDataSpec {
  workspace?: string
  backendConfig?: TerraformBackendConfig
  targets?: any

  environmentVariables?: any
  configFiles?: {
    store?: {
      type?: string
      spec?: {
        gitFetchType?: string
        branch?: string
        commitId?: string
        folderPath?: string
        connectorRef?: string | Connector
        repositoryName?: string
        artifactPaths?: string
      }
    }
  }
  varFiles?: TerraformVarFileWrapper[]
  exportTerraformPlanJson?: boolean
}

export interface TFFormData extends StepElementConfig {
  spec?: TerraformApplyStepInfo
}

export interface TFDestroyData extends StepElementConfig {
  spec?: TerraformDestroyStepInfo
}

export interface TFRollbackData extends StepElementConfig {
  spec: TerraformRollbackStepInfo
}

export interface TFPlanFormData extends StepElementConfig {
  spec?: Omit<TerraformPlanStepInfo, 'configuration'> & {
    configuration: Omit<TerraformPlanExecutionData, 'environmentVariables' | 'targets'> & {
      targets?: Array<{ id: string; value: string }> | string[] | string
      environmentVariables?: Array<{ key: string; id: string; value: string }> | string
    }
  }
}

export interface TerraformFormData extends StepElementConfig {
  delegateSelectors: string[]
  spec?: TerraformPlanStepInfo
}

export interface TfVar {
  type?: string
  connectorRef?: {
    label: string
    scope: Scope
    value: string
  }
  gitFetchType?: string
  repoName?: string
  branch?: string
  commitId?: string
  paths?: string[]
}

export const onSubmitTerraformData = (values: any): TFFormData => {
  if (values?.spec?.configuration?.type === 'Inline') {
    const envVars = values.spec?.configuration?.spec?.environmentVariables
    const envMap: StringNGVariable[] = []
    if (Array.isArray(envVars)) {
      envVars.forEach(mapValue => {
        if (mapValue.value) {
          envMap.push({
            name: mapValue.key,
            value: mapValue.value,
            type: 'String'
          })
        }
      })
    }

    const targets = values?.spec?.configuration?.spec?.targets as MultiTypeInputType
    const targetMap: ListType = []
    if (Array.isArray(targets)) {
      targets.forEach(target => {
        if (target.value) {
          targetMap.push(target.value)
        }
      })
    }

    const connectorValue = values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef as any

    const configObject: TerraformExecutionData = {
      workspace: values?.spec?.configuration?.spec?.workspace,
      configFiles: {} as any
    }
    if (values?.spec?.configuration?.spec?.backendConfig?.spec?.content) {
      configObject['backendConfig'] = {
        type: 'Inline',
        spec: {
          content: values?.spec?.configuration?.spec?.backendConfig?.spec?.content
        }
      }
    } else {
      unset(values?.spec?.configuration?.spec, 'backendConfig')
    }

    if (envMap.length) {
      configObject['environmentVariables'] = envMap
    }

    if (targetMap.length) {
      configObject['targets'] = targetMap
    } else if (getMultiTypeFromValue(values?.spec?.configuration?.spec?.targets) === MultiTypeInputType.RUNTIME) {
      configObject['targets'] = values?.spec?.configuration?.spec?.targets
    }

    if (values?.spec?.configuration?.spec?.varFiles?.length) {
      configObject['varFiles'] = values?.spec?.configuration?.spec?.varFiles
    } else {
      unset(values?.spec?.configuration?.spec, 'varFiles')
    }

    if (
      connectorValue ||
      getMultiTypeFromValue(values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef) ===
        MultiTypeInputType.RUNTIME
    ) {
      configObject['configFiles'] = {
        ...values.spec?.configuration?.spec?.configFiles,
        store: {
          ...values.spec?.configuration?.spec?.configFiles?.store,
          type: connectorValue?.connector?.type || values?.spec?.configuration?.spec?.configFiles?.store?.type,
          spec: {
            ...values.spec?.configuration?.spec?.configFiles?.store?.spec,
            connectorRef: values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef
              ? getMultiTypeFromValue(values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef) ===
                  MultiTypeInputType.RUNTIME || !connectorValue?.value
                ? values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef
                : connectorValue?.value
              : ''
          }
        }
      }
    }
    return {
      ...values,
      spec: {
        provisionerIdentifier: values.spec?.provisionerIdentifier,
        configuration: {
          type: values?.spec?.configuration?.type,
          spec: {
            ...configObject
          }
        }
      }
    }
  }

  return {
    ...values,
    spec: {
      ...values.spec,
      provisionerIdentifier: values?.spec?.provisionerIdentifier,
      configuration: {
        type: values?.spec?.configuration?.type
      }
    }
  }
}

export const onSubmitTFPlanData = (values: any): TFPlanFormData => {
  const envVars = values.spec?.configuration?.environmentVariables
  const envMap: StringNGVariable[] = []
  if (Array.isArray(envVars)) {
    envVars.forEach(mapValue => {
      if (mapValue.value) {
        envMap.push({
          name: mapValue.key,
          value: mapValue.value,
          type: 'String'
        })
      }
    })
  }

  const targets = values?.spec?.configuration?.targets as MultiTypeInputType
  const targetMap: ListType = []
  if (Array.isArray(targets)) {
    targets.forEach(target => {
      if (target.value) {
        targetMap.push(target.value)
      }
    })
  }

  const connectorValue = values?.spec?.configuration?.configFiles?.store?.spec?.connectorRef

  const configObject: TerraformPlanExecutionData = {
    command: values?.spec?.configuration?.command,
    workspace: values?.spec?.configuration?.workspace,
    configFiles: {} as TerraformConfigFilesWrapper,
    secretManagerRef: ''
  }
  if (values?.spec?.configuration?.backendConfig?.spec?.content) {
    configObject['backendConfig'] = {
      type: 'Inline',
      spec: {
        content: values?.spec?.configuration?.backendConfig?.spec?.content
      }
    }
  }

  if (envMap.length) {
    configObject['environmentVariables'] = envMap
  } else if (getMultiTypeFromValue(values?.spec?.configuration?.environmentVariables) === MultiTypeInputType.RUNTIME) {
    configObject['environmentVariables'] = values?.spec?.configuration?.environmentVariables
  }

  if (targetMap.length) {
    configObject['targets'] = targetMap
  } else if (getMultiTypeFromValue(values?.spec?.configuration?.targets) === MultiTypeInputType.RUNTIME) {
    configObject['targets'] = values?.spec?.configuration?.targets
  }

  if (values?.spec?.configuration?.varFiles?.length) {
    configObject['varFiles'] = values?.spec?.configuration?.varFiles
  }
  if (
    connectorValue ||
    getMultiTypeFromValue(values?.spec?.configuration?.configFiles?.store?.spec?.connectorRef) ===
      MultiTypeInputType.RUNTIME
  ) {
    configObject['configFiles'] = {
      ...values.spec?.configuration?.configFiles,
      store: {
        ...values.spec?.configuration?.configFiles?.store,
        type: connectorValue?.connector?.type || values?.spec?.configuration?.configFiles?.store?.type,
        spec: {
          ...values.spec?.configuration?.configFiles?.store?.spec,
          connectorRef: values?.spec?.configuration?.configFiles?.store?.spec?.connectorRef
            ? getMultiTypeFromValue(values?.spec?.configuration?.spec?.configFiles?.store?.spec?.connectorRef) ===
                MultiTypeInputType.RUNTIME || !connectorValue?.value
              ? values?.spec?.configuration?.configFiles?.store?.spec?.connectorRef
              : connectorValue?.value
            : ''
        }
      }
    }
  }

  if (values?.spec?.configuration?.secretManagerRef) {
    configObject['secretManagerRef'] = values?.spec?.configuration?.secretManagerRef
      ? values?.spec?.configuration?.secretManagerRef
      : ''
  }

  if (values?.spec?.configuration?.exportTerraformPlanJson) {
    configObject['exportTerraformPlanJson'] = values?.spec?.configuration?.exportTerraformPlanJson
      ? values?.spec?.configuration?.exportTerraformPlanJson
      : false
  }

  return {
    ...values,
    spec: {
      ...values.spec,

      configuration: {
        ...configObject
      }
    }
  }
}
export interface InlineVar {
  varFile: {
    identifier: string
    spec: InlineTerraformVarFileSpec
  }
}
