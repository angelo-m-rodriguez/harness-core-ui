/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { ContinousVerificationData } from '@cv/components/PipelineSteps/ContinousVerification/types'
import type { HealthSource, MonitoredServiceDTO } from 'services/cv'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { PipelineInfoConfig } from 'services/cd-ng'

export const getNewSpecs = (
  monitoredServiceData: MonitoredServiceDTO | undefined,
  formValues: ContinousVerificationData
): ContinousVerificationData['spec'] => {
  const healthSources =
    monitoredServiceData?.sources?.healthSources?.map(el => {
      return { identifier: (el as HealthSource)?.identifier as string }
    }) || []

  return { ...formValues.spec, monitoredServiceRef: monitoredServiceData?.identifier, healthSources }
}

export const isAnExpression = (value: string): boolean => {
  return value.startsWith('<+') && value !== RUNTIME_INPUT_VALUE
}

export const getServiceIdFromStage = (stage: StageElementWrapper<DeploymentStageElementConfig>): string => {
  return stage?.stage?.spec?.serviceConfig?.service?.identifier || stage?.stage?.spec?.serviceConfig?.serviceRef || ''
}

export function getServiceIdentifier(
  selectedStage: StageElementWrapper<DeploymentStageElementConfig> | undefined,
  pipeline: PipelineInfoConfig
): string {
  let serviceId = ''
  if (selectedStage?.stage?.spec?.serviceConfig?.useFromStage) {
    const stageIdToDeriveServiceFrom = selectedStage?.stage?.spec?.serviceConfig?.useFromStage?.stage
    const stageToDeriveServiceFrom = pipeline?.stages?.find(el => el?.stage?.identifier === stageIdToDeriveServiceFrom)
    serviceId = getServiceIdFromStage(stageToDeriveServiceFrom as StageElementWrapper<DeploymentStageElementConfig>)
  } else {
    serviceId = getServiceIdFromStage(selectedStage as StageElementWrapper<DeploymentStageElementConfig>)
  }
  return serviceId
}
