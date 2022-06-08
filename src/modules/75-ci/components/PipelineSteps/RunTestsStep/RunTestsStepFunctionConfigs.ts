/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Types as TransformValuesTypes } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { Types as ValidationFieldTypes } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import type { K8sDirectInfraYaml } from 'services/ci'

export const transformValuesFieldsConfig = [
  {
    name: 'identifier',
    type: TransformValuesTypes.Text
  },
  {
    name: 'name',
    type: TransformValuesTypes.Text
  },
  {
    name: 'description',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.connectorRef',
    type: TransformValuesTypes.ConnectorRef
  },
  {
    name: 'spec.image',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.language',
    type: TransformValuesTypes.Language
  },
  {
    name: 'spec.buildEnvironment',
    type: TransformValuesTypes.BuildEnvironment
  },
  {
    name: 'spec.frameworkVersion',
    type: TransformValuesTypes.FrameworkVersion
  },
  {
    name: 'spec.buildTool',
    type: TransformValuesTypes.BuildTool
  },
  {
    name: 'spec.args',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.packages',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.namespaces',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.runOnlySelectedTests',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.testAnnotations',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.preCommand',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.postCommand',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.reportPaths',
    type: TransformValuesTypes.ReportPaths
  },
  {
    name: 'spec.envVariables',
    type: TransformValuesTypes.Map
  },
  {
    name: 'spec.outputVariables',
    type: TransformValuesTypes.OutputVariables
  },
  {
    name: 'spec.imagePullPolicy',
    type: TransformValuesTypes.ImagePullPolicy
  },
  {
    name: 'spec.shell',
    type: TransformValuesTypes.Shell
  },
  {
    name: 'spec.runAsUser',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.limitMemory',
    type: TransformValuesTypes.LimitMemory
  },
  {
    name: 'spec.limitCPU',
    type: TransformValuesTypes.LimitCPU
  },
  {
    name: 'timeout',
    type: TransformValuesTypes.Text
  }
]

export const getEditViewValidateFieldsConfig = (
  buildInfrastructureType: K8sDirectInfraYaml['type'],
  isLanguageCsharp: boolean
) => [
  {
    name: 'identifier',
    type: ValidationFieldTypes.Identifier,
    label: 'identifier',
    isRequired: true
  },
  {
    name: 'name',
    type: ValidationFieldTypes.Name,
    label: 'pipelineSteps.stepNameLabel',
    isRequired: true
  },
  {
    name: 'spec.connectorRef',
    type: ValidationFieldTypes.Text,
    label: 'pipelineSteps.connectorLabel',
    isRequired: buildInfrastructureType !== 'VM'
  },
  {
    name: 'spec.image',
    type: ValidationFieldTypes.Text,
    label: 'imageLabel',
    isRequired: buildInfrastructureType !== 'VM'
  },
  {
    name: 'spec.language',
    type: ValidationFieldTypes.Text,
    label: 'languageLabel',
    isRequired: true
  },
  {
    name: 'spec.buildEnvironment',
    type: ValidationFieldTypes.Text,
    label: 'ci.runTestsStep.buildEnvironment',
    isRequired: isLanguageCsharp
  },
  {
    name: 'spec.frameworkVersion',
    type: ValidationFieldTypes.Text,
    label: 'ci.runTestsStep.frameworkVersion',
    isRequired: isLanguageCsharp
  },
  {
    name: 'spec.buildTool',
    type: ValidationFieldTypes.Text,
    label: 'buildToolLabel',
    isRequired: true
  },
  {
    name: 'spec.args',
    type: ValidationFieldTypes.Text,
    label: 'argsLabel',
    isRequired: true
  },
  {
    name: 'spec.packages',
    type: ValidationFieldTypes.Text,
    label: 'packagesLabel'
  },
  {
    name: 'spec.namespaces',
    type: ValidationFieldTypes.Text,
    label: 'ci.runTestsStep.namespaces',
    isRequired: isLanguageCsharp
  },
  {
    name: 'spec.reportPaths',
    type: ValidationFieldTypes.List
  },
  {
    name: 'spec.envVariables',
    type: ValidationFieldTypes.Map
  },
  {
    name: 'spec.outputVariables',
    type: ValidationFieldTypes.OutputVariables
  },
  {
    label: 'pipeline.stepCommonFields.runAsUser',
    name: 'spec.runAsUser',
    type: ValidationFieldTypes.Numeric
  },
  {
    name: 'spec.limitMemory',
    type: ValidationFieldTypes.LimitMemory
  },
  {
    name: 'spec.limitCPU',
    type: ValidationFieldTypes.LimitCPU
  },
  {
    name: 'timeout',
    type: ValidationFieldTypes.Timeout
  }
]

export function getInputSetViewValidateFieldsConfig(
  isRequired = true
): Array<{ name: string; type: ValidationFieldTypes; label?: string; isRequired?: boolean }> {
  return [
    {
      name: 'spec.connectorRef',
      type: ValidationFieldTypes.Text,
      label: 'pipelineSteps.connectorLabel',
      isRequired
    },
    {
      name: 'spec.image',
      type: ValidationFieldTypes.Text,
      label: 'imageLabel',
      isRequired
    },
    {
      name: 'spec.buildEnvironment',
      type: ValidationFieldTypes.Text,
      label: 'ci.runTestsStep.buildEnvironment',
      isRequired
    },
    {
      name: 'spec.frameworkVersion',
      type: ValidationFieldTypes.Text,
      label: 'ci.runTestsStep.frameworkVersion',
      isRequired
    },
    {
      name: 'spec.buildTool',
      type: ValidationFieldTypes.Text,
      label: 'buildToolLabel',
      isRequired
    },
    {
      name: 'spec.args',
      type: ValidationFieldTypes.Text,
      label: 'argsLabel',
      isRequired
    },
    {
      name: 'spec.packages',
      type: ValidationFieldTypes.Text,
      label: 'packagesLabel'
    },
    {
      name: 'spec.namespaces',
      type: ValidationFieldTypes.Text,
      label: 'ci.runTestsStep.namespaces',
      isRequired
    },
    {
      name: 'spec.reports.spec.paths',
      type: ValidationFieldTypes.List
    },
    {
      name: 'spec.envVariables',
      type: ValidationFieldTypes.Map
    },
    {
      name: 'spec.outputVariables',
      type: ValidationFieldTypes.OutputVariables
    },
    {
      label: 'pipeline.stepCommonFields.runAsUser',
      name: 'spec.runAsUser',
      type: ValidationFieldTypes.Numeric
    },
    {
      name: 'spec.resources.limits.memory',
      type: ValidationFieldTypes.LimitMemory
    },
    {
      name: 'spec.resources.limits.cpu',
      type: ValidationFieldTypes.LimitCPU
    },
    {
      name: 'timeout',
      type: ValidationFieldTypes.Timeout
    }
  ]
}
