/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import type { IconName, SelectOption } from '@harness/uicore'
import type { ConnectorInfoDTO } from 'services/cd-ng'

import type { UseStringsReturn } from 'framework/strings'

export const EXPRESSION_STRING = '<+expression>' // TODO: this needs to be exported from uicore for best use.

export enum CardVariant {
  Default = 'Default',
  Minimal = 'Minimal',
  MinimalWithActions = 'MinimalWithActions'
}

export const ConnectorRefWidth = {
  DeploymentFormView: 320,
  DeploymentForm: 320, // matches StepViewType key for getConnectorRefWidth function
  InputSetView: 310,
  DefaultView: 385,
  EditStageView: 366,
  EditStageViewInputSet: 308,
  RightBarView: 460,
  TemplateBuilder: 361,
  TemplateDetailDrawer: 313,
  Trigger: 433
}

// more keys that aren't StepViewType
export const ConnectorRefWidthKeys = {
  TemplateBuilder: 'TemplateBuilder',
  TemplateDetailDrawer: 'TemplateDetailDrawer',
  Trigger: 'Trigger',
  DefaultView: 'DefaultView'
}

export const connectorTypes: { [key: string]: ConnectorInfoDTO['type'] } = {
  Aws: 'Aws',
  Gcp: 'Gcp',
  Pdc: 'Pdc'
}
export const stageTypeToIconMap: Record<string, IconName> = {
  Deployment: 'cd-main',
  CI: 'ci-main',
  SecurityTests: 'sto-color-filled',
  Pipeline: 'pipeline',
  Custom: 'custom-stage-icon',
  Approval: 'approval-stage-icon',
  FeatureFlag: 'cf-main'
}

export const getPrCloneStrategyOptions = (getString: UseStringsReturn['getString']): SelectOption[] => [
  { label: getString('pipeline.rightBar.mergeCommit'), value: 'MergeCommit' }, // should keep as index 0 for default value
  { label: getString('common.sourceBranch'), value: 'SourceBranch' }
]

export const sslVerifyOptions = [
  {
    label: 'True',
    value: true
  },
  {
    label: 'False',
    value: false
  }
]
