/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty } from 'lodash-es'
import type { UseStringsReturn } from 'framework/strings'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { TemplateSummaryResponse } from 'services/template-ng'

export enum TemplateType {
  Step = 'Step',
  Stage = 'Stage',
  Pipeline = 'Pipeline',
  Service = 'Service',
  Infrastructure = 'Infrastructure',
  StepGroup = 'StepGroup',
  Execution = 'Execution',
  MonitoredService = 'MonitoredService'
}

export const AllTemplatesTypes = 'All'

export interface TemplateTypeOption {
  label: string
  value: string
  disabled?: boolean
}

export const getScopeBasedQueryParams = (
  { accountId, projectIdentifier, orgIdentifier }: ProjectPathProps,
  scope: Scope
) => {
  return {
    accountIdentifier: accountId,
    projectIdentifier: scope === Scope.PROJECT ? projectIdentifier : undefined,
    orgIdentifier: scope === Scope.PROJECT || scope === Scope.ORG ? orgIdentifier : undefined
  }
}

export const getAllowedTemplateTypes = (
  getString: UseStringsReturn['getString'],
  module?: string,
  isPipelineTemplateEnabled?: boolean
): TemplateTypeOption[] => {
  const AllowedTemplateTypes = [
    {
      label: getString('step'),
      value: TemplateType.Step,
      disabled: false
    },
    {
      label: getString('common.stage'),
      value: TemplateType.Stage,
      disabled: false
    },
    {
      label: getString('common.pipeline'),
      value: TemplateType.Pipeline,
      disabled: !isPipelineTemplateEnabled
    },
    {
      label: getString('service'),
      value: TemplateType.Service,
      disabled: true
    },
    {
      label: getString('infrastructureText'),
      value: TemplateType.Infrastructure,
      disabled: true
    },
    {
      label: getString('stepGroup'),
      value: TemplateType.StepGroup,
      disabled: true
    },
    {
      label: getString('executionText'),
      value: TemplateType.Execution,
      disabled: true
    }
  ]
  if (module === 'cv') {
    return [
      {
        label: getString('connectors.cdng.monitoredService.label'),
        value: TemplateType.MonitoredService,
        disabled: false
      }
    ]
  }
  return AllowedTemplateTypes
}

export const getVersionLabelText = (template: TemplateSummaryResponse, getString: UseStringsReturn['getString']) => {
  return isEmpty(template.versionLabel)
    ? getString('templatesLibrary.alwaysUseStableVersion')
    : template.stableTemplate
    ? getString('templatesLibrary.stableVersion', { entity: template.versionLabel })
    : template.versionLabel
}

export const getTemplateRuntimeInputsCount = (templateInfo: { [key: string]: any }): number =>
  (JSON.stringify(templateInfo).match(/<\+input>/g) || []).length
