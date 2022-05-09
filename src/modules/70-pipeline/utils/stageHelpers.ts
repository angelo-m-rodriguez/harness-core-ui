/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, get, isEmpty } from 'lodash-es'
import { v4 as uuid } from 'uuid'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { GraphLayoutNode, PipelineExecutionSummary } from 'services/pipeline-ng'
import type { StringKeys } from 'framework/strings'
import type {
  Infrastructure,
  GetExecutionStrategyYamlQueryParams,
  PipelineInfoConfig,
  StageElementConfig,
  ServerlessAwsLambdaInfrastructure
} from 'services/cd-ng'
import { connectorTypes } from '@pipeline/utils/constants'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { DependencyElement } from 'services/ci'
import type { PipelineGraphState } from '@pipeline/components/PipelineDiagram/types'
import type { InputSetDTO } from './types'
import type { DeploymentStageElementConfig, PipelineStageWrapper, StageElementWrapper } from './pipelineTypes'

export enum StageType {
  DEPLOY = 'Deployment',
  BUILD = 'CI',
  FEATURE = 'FeatureFlag',
  PIPELINE = 'Pipeline',
  APPROVAL = 'Approval',
  CUSTOM = 'Custom',
  Template = 'Template',
  SECURITY = 'SecurityTests'
}

export enum ServiceDeploymentType {
  Kubernetes = 'Kubernetes',
  NativeHelm = 'NativeHelm',
  amazonEcs = 'amazonEcs',
  amazonAmi = 'amazonAmi',
  awsCodeDeploy = 'awsCodeDeploy',
  winrm = 'winrm',
  awsLambda = 'awsLambda',
  pcf = 'pcf',
  ssh = 'Ssh',
  ServerlessAwsLambda = 'ServerlessAwsLambda',
  ServerlessAzureFunctions = 'ServerlessAzureFunctions',
  ServerlessGoogleFunctions = 'ServerlessGoogleFunctions',
  AmazonSAM = 'AwsSAM',
  AzureFunctions = 'AzureFunctions'
}

export type ServerlessGCPInfrastructure = Infrastructure & {
  connectorRef: string
  metadata?: string
  stage: string
}

export type ServerlessAzureInfrastructure = Infrastructure & {
  connectorRef: string
  metadata?: string
  stage: string
}
export type ServerlessInfraTypes =
  | ServerlessGCPInfrastructure
  | ServerlessAzureInfrastructure
  | ServerlessAwsLambdaInfrastructure

export const changeEmptyValuesToRunTimeInput = (inputset: any, propertyKey: string): InputSetDTO => {
  if (inputset) {
    Object.keys(inputset).forEach(key => {
      if (typeof inputset[key] === 'object') {
        changeEmptyValuesToRunTimeInput(inputset[key], key)
      } else if (inputset[key] === '' && ['tags'].indexOf(propertyKey) === -1) {
        inputset[key] = '<+input>'
      }
    })
  }
  return inputset
}

export function isCDStage(node?: GraphLayoutNode): boolean {
  return node?.nodeType === StageType.DEPLOY || node?.module === 'cd' || !isEmpty(node?.moduleInfo?.cd)
}

export function isCIStage(node?: GraphLayoutNode): boolean {
  return node?.nodeType === StageType.BUILD || node?.module === 'ci' || !isEmpty(node?.moduleInfo?.ci)
}

export function hasCDStage(pipelineExecution?: PipelineExecutionSummary): boolean {
  return pipelineExecution?.modules?.includes('cd') || !isEmpty(pipelineExecution?.moduleInfo?.cd)
}

export function hasCIStage(pipelineExecution?: PipelineExecutionSummary): boolean {
  return pipelineExecution?.modules?.includes('ci') || !isEmpty(pipelineExecution?.moduleInfo?.ci)
}

export const getHelperTextString = (
  invalidFields: string[],
  getString: (key: StringKeys) => string,
  isServerlessDeploymentTypeSelected = false
): string => {
  return `${invalidFields.length > 1 ? invalidFields.join(', ') : invalidFields[0]} ${
    invalidFields.length > 1 ? ' are ' : ' is '
  } ${
    isServerlessDeploymentTypeSelected
      ? getString('pipeline.artifactPathDependencyRequired')
      : getString('pipeline.tagDependencyRequired')
  }`
}

export const getHelpeTextForTags = (
  fields: {
    imagePath?: string
    artifactPath?: string
    region?: string
    connectorRef: string
    registryHostname?: string
    repository?: string
    repositoryPort?: number
    artifactDirectory?: string
  },
  getString: (key: StringKeys) => string,
  isServerlessDeploymentTypeSelected = false
): string => {
  const {
    connectorRef,
    region,
    imagePath,
    artifactPath,
    registryHostname,
    repository,
    repositoryPort,
    artifactDirectory
  } = fields
  const invalidFields: string[] = []
  if (!connectorRef || getMultiTypeFromValue(connectorRef) === MultiTypeInputType.RUNTIME) {
    invalidFields.push(getString('connector'))
  }
  if (region !== undefined && (!region || getMultiTypeFromValue(region) === MultiTypeInputType.RUNTIME)) {
    invalidFields.push(getString('regionLabel'))
  }
  if (
    registryHostname !== undefined &&
    (!registryHostname || getMultiTypeFromValue(registryHostname) === MultiTypeInputType.RUNTIME)
  ) {
    invalidFields.push(getString('connectors.GCR.registryHostname'))
  }
  if (
    !isServerlessDeploymentTypeSelected &&
    (imagePath === '' || getMultiTypeFromValue(imagePath) === MultiTypeInputType.RUNTIME)
  ) {
    invalidFields.push(getString('pipeline.imagePathLabel'))
  }
  if (
    !isServerlessDeploymentTypeSelected &&
    (artifactPath === '' || getMultiTypeFromValue(artifactPath) === MultiTypeInputType.RUNTIME)
  ) {
    invalidFields.push(getString('pipeline.artifactPathLabel'))
  }
  if (repository !== undefined && (!repository || getMultiTypeFromValue(repository) === MultiTypeInputType.RUNTIME)) {
    invalidFields.push(getString('repository'))
  }
  if (
    repositoryPort !== undefined &&
    (!repositoryPort || getMultiTypeFromValue(repositoryPort) === MultiTypeInputType.RUNTIME)
  ) {
    invalidFields.push(getString('pipeline.artifactsSelection.repositoryPort'))
  }
  if (
    isServerlessDeploymentTypeSelected &&
    (!artifactDirectory || getMultiTypeFromValue(artifactDirectory) === MultiTypeInputType.RUNTIME)
  ) {
    invalidFields.push(getString('pipeline.artifactsSelection.artifactDirectory'))
  }

  const helpText = getHelperTextString(invalidFields, getString, isServerlessDeploymentTypeSelected)

  return invalidFields.length > 0 ? helpText : ''
}

export const isServerlessDeploymentType = (deploymentType: string): boolean => {
  return (
    deploymentType === ServiceDeploymentType.ServerlessAwsLambda ||
    deploymentType === ServiceDeploymentType.ServerlessAzureFunctions ||
    deploymentType === ServiceDeploymentType.ServerlessGoogleFunctions ||
    deploymentType === ServiceDeploymentType.AmazonSAM ||
    deploymentType === ServiceDeploymentType.AzureFunctions
  )
}

export const detailsHeaderName: Record<string, string> = {
  [ServiceDeploymentType.ServerlessAwsLambda]: 'Amazon Web Services Details',
  [ServiceDeploymentType.ServerlessAzureFunctions]: 'Azure Details',
  [ServiceDeploymentType.ServerlessGoogleFunctions]: 'GCP Details'
}

export const isServerlessManifestType = (selectedManifest: ManifestTypes | null): boolean => {
  return selectedManifest === ManifestDataType.ServerlessAwsLambda
}

export const getSelectedDeploymentType = (
  stage: StageElementWrapper<DeploymentStageElementConfig> | undefined,
  getStageFromPipeline: <T extends StageElementConfig = StageElementConfig>(
    stageId: string,
    pipeline?: PipelineInfoConfig | undefined
  ) => PipelineStageWrapper<T>,
  isPropagating = false
): GetExecutionStrategyYamlQueryParams['serviceDefinitionType'] => {
  if (isPropagating) {
    const parentStageId = get(stage, 'stage.spec.serviceConfig.useFromStage.stage', null)
    const parentStage = getStageFromPipeline<DeploymentStageElementConfig>(defaultTo(parentStageId, ''))
    return get(parentStage, 'stage.stage.spec.serviceConfig.serviceDefinition.type', null)
  }
  return get(stage, 'stage.spec.serviceConfig.serviceDefinition.type', null)
}

export const getCustomStepProps = (type: string, getString: (key: StringKeys) => string) => {
  switch (type) {
    case ServiceDeploymentType.ServerlessAwsLambda:
      return {
        hasRegion: true,
        formInfo: {
          formName: 'serverlessAWSInfra',
          type: connectorTypes.Aws,
          header: getString('pipelineSteps.awsConnectorLabel'),
          tooltipIds: {
            connector: 'awsInfraConnector',
            region: 'awsRegion',
            stage: 'awsStage'
          }
        }
      }
    case ServiceDeploymentType.ServerlessAzureFunctions:
      return {
        formInfo: {
          formName: 'serverlessAzureInfra',
          // @TODO - (change type to 'azure')
          // this is not being used anywhere currently, once azure support is there we will change it.
          type: connectorTypes.Gcp,
          header: getString('pipelineSteps.awsConnectorLabel'),
          tooltipIds: {
            connector: 'azureInfraConnector',
            region: 'azureRegion',
            stage: 'azureStage'
          }
        }
      }
    case ServiceDeploymentType.ServerlessGoogleFunctions:
      return {
        formInfo: {
          formName: 'serverlessGCPInfra',
          type: connectorTypes.Gcp,
          header: getString('pipelineSteps.gcpConnectorLabel'),
          tooltipIds: {
            connector: 'gcpInfraConnector',
            region: 'gcpRegion',
            stage: 'gcpStage'
          }
        }
      }
    default:
      return { formInfo: {} }
  }
}

export const isArtifactManifestPresent = (stage: DeploymentStageElementConfig): boolean => {
  return (
    !!stage.spec?.serviceConfig &&
    (!!stage.spec?.serviceConfig.serviceDefinition?.spec.artifacts ||
      !!stage.spec?.serviceConfig.serviceDefinition?.spec.manifests)
  )
}

export const isInfraDefinitionPresent = (stage: DeploymentStageElementConfig): boolean => {
  return !!stage.spec?.infrastructure?.infrastructureDefinition
}

export const isExecutionFieldPresent = (stage: DeploymentStageElementConfig): boolean => {
  return !!(stage.spec?.execution && stage.spec?.execution.steps && stage.spec?.execution.steps?.length > 0)
}

export const doesStageContainOtherData = (stage?: DeploymentStageElementConfig): boolean => {
  if (!stage) {
    return false
  }
  return isArtifactManifestPresent(stage) || isInfraDefinitionPresent(stage) || isExecutionFieldPresent(stage)
}

export const deleteStageData = (stage?: DeploymentStageElementConfig): void => {
  if (stage) {
    delete stage?.spec?.serviceConfig?.serviceDefinition?.spec.artifacts
    delete stage?.spec?.serviceConfig?.serviceDefinition?.spec.manifests
    delete stage?.spec?.infrastructure?.allowSimultaneousDeployments
    delete stage?.spec?.infrastructure?.infrastructureDefinition
    if (stage?.spec?.execution?.steps) {
      stage.spec.execution.steps.splice(0)
    }
    delete stage?.spec?.execution?.rollbackSteps
  }
}

export const infraDefinitionTypeMapping: { [key: string]: string } = {
  ServerlessAwsLambda: 'ServerlessAwsInfra'
}

export const getStepTypeByDeploymentType = (deploymentType: string): StepType => {
  if (isServerlessDeploymentType(deploymentType)) {
    return StepType.ServerlessAwsLambda
  }
  return StepType.K8sServiceSpec
}
export const STATIC_SERVICE_GROUP_NAME = 'static_service_group'
export const getDefaultBuildDependencies = (serviceDependencies: DependencyElement[]): PipelineGraphState => ({
  id: uuid() as string,
  identifier: STATIC_SERVICE_GROUP_NAME as string,
  name: 'Dependencies',
  type: STATIC_SERVICE_GROUP_NAME,
  nodeType: STATIC_SERVICE_GROUP_NAME,
  icon: '' as IconName,
  data: {
    canDelete: false,
    name: 'Dependencies',
    type: STATIC_SERVICE_GROUP_NAME,
    nodeType: STATIC_SERVICE_GROUP_NAME,
    steps: serviceDependencies.length ? [{ parallel: serviceDependencies.map(d => ({ step: d })) }] : []
  }
})
