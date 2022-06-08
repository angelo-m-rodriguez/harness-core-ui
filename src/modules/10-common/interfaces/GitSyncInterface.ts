/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { GitSyncEntityDTO } from 'services/cd-ng'

export interface Entity {
  [key: string]: GitSyncEntityDTO['entityType']
}

export const SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED'

export const Entities: Entity = {
  APPROVAL_STAGE: 'ApprovalStage',
  CONNECTORS: 'Connectors',
  CV_CONFIG: 'CvConfig',
  CV_JOB: 'CvVerificationJob',
  CV_K8_ACTIVITY_SOURCE: 'CvKubernetesActivitySource',
  DELEGATES: 'Delegates',
  DELEGATE_CONFIGURATIONS: 'DelegateConfigurations',
  DEPLOYMENT_STAGE: 'DeploymentStage',
  DEPLOYMENT_STEPS: 'DeploymentSteps',
  ENVIRONMENT: 'Environment',
  FEATURE_FLAGS: 'FeatureFlags',
  INPUT_SETS: 'InputSets',
  INTEGRATION_STAGE: 'IntegrationStage',
  INTEGRATION_STEPS: 'IntegrationSteps',
  PIPELINES: 'Pipelines',
  PIPELINES_STEPS: 'PipelineSteps',
  PROJECTS: 'Projects',
  SECRETS: 'Secrets',
  SERVICE: 'Service',
  TEMPLATE: 'Template'
}
