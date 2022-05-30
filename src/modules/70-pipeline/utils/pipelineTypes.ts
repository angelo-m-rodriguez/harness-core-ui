/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type {
  StageElementConfig,
  ApprovalStageConfig,
  DeploymentStageConfig,
  FeatureFlagStageConfig,
  StageElementWrapperConfig,
  CustomStageConfig
} from 'services/cd-ng'
import type { IntegrationStageConfig, K8sDirectInfraYaml, UseFromStageInfraYaml, VmPoolYaml } from 'services/ci'

export type AllStageConfig =
  | ApprovalStageConfig
  | DeploymentStageConfig
  | FeatureFlagStageConfig
  | IntegrationStageConfig

export interface ApprovalStageElementConfig extends StageElementConfig {
  spec?: ApprovalStageConfig
}

export interface CustomStageElementConfig extends StageElementConfig {
  spec?: CustomStageConfig
}

export interface DeploymentStageElementConfig extends StageElementConfig {
  spec?: DeploymentStageConfig
}

export interface FeatureFlagStageElementConfig extends StageElementConfig {
  spec?: FeatureFlagStageConfig
  environment?: string
  featureType?: string
  featureFlag?: string
}

export interface BuildStageElementConfig extends StageElementConfig {
  spec?: IntegrationStageConfig & {
    infrastructure: K8sDirectInfraYaml | UseFromStageInfraYaml | VmPoolYaml
  }
}

export interface PipelineStageWrapper<T extends StageElementConfig = StageElementConfig> {
  stage?: StageElementWrapper<T>
  parent?: StageElementWrapperConfig
}

export interface StageElementWrapper<T extends StageElementConfig = StageElementConfig>
  extends StageElementWrapperConfig {
  stage?: T
}

export interface DeploymentStageElementConfigWrapper {
  stage: DeploymentStageElementConfig
  parallel: DeploymentStageElementConfigWrapper[]
}
