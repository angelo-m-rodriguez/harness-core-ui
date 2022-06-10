/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import { isEmpty } from 'lodash-es'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

export enum DeployTabs {
  OVERVIEW = 'OVERVIEW',
  SERVICE = 'SERVICE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  ENVIRONMENT = 'ENVIRONMENT',
  EXECUTION = 'EXECUTION',
  ADVANCED = 'ADVANCED'
}

export const isEmptyServiceConfigPath = (stage: DeploymentStageElementConfig): boolean => {
  return isEmpty(stage?.spec?.serviceConfig?.serviceDefinition?.type)
}
export const getServiceEntityServiceRef = (stage: any): boolean => {
  return !isEmpty((stage?.spec as any)?.service?.serviceRef)
}
