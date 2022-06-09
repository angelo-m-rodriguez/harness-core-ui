/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Types as TransformValuesTypes } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { Types as ValidationFieldTypes } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'

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
    name: 'spec.connectorRef',
    type: TransformValuesTypes.ConnectorRef
  },
  {
    name: 'spec.jobName',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.jobParameter',
    type: TransformValuesTypes.JobParameter
  },
  {
    name: 'spec.failureStrategies',
    type: TransformValuesTypes.List
  },
  {
    name: 'spec.delegateSelectors',
    type: TransformValuesTypes.List
  },
  {
    name: 'spec.unstableStatusAsSuccess',
    type: TransformValuesTypes.Boolean
  },
  {
    name: 'spec.captureEnvironmentVariable',
    type: TransformValuesTypes.Boolean
  },
  {
    name: 'timeout',
    type: TransformValuesTypes.Text
  }
]

export const editViewValidateFieldsConfig = [
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
    label: 'connectors.jenkins.jenkinsConnectorLabel',
    isRequired: true
  },
  {
    name: 'spec.jobName',
    type: ValidationFieldTypes.Text,
    label: 'connectors.jenkins.jobNameLabel',
    isRequired: true
  },
  {
    name: 'spec.jobParameter',
    type: ValidationFieldTypes.List,
    label: 'connectors.jenkins.jobParameterLabel',
    isRequired: true
  },
  {
    name: 'spec.failureStrategies',
    type: ValidationFieldTypes.List
  },
  {
    name: 'spec.delegateSelectors',
    type: ValidationFieldTypes.List,
    isRequired: true
  },
  {
    name: 'spec.unstableStatusAsSuccess',
    type: ValidationFieldTypes.Boolean
  },
  {
    name: 'spec.captureEnvironmentVariable',
    type: ValidationFieldTypes.Boolean
  },
  {
    name: 'timeout',
    type: ValidationFieldTypes.Text
  }
]

export function getInputSetViewValidateFieldsConfig(
  isRequired = true
): Array<{ name: string; type: ValidationFieldTypes; label?: string; isRequired?: boolean }> {
  return [
    {
      name: 'spec.connectorRef',
      type: ValidationFieldTypes.Text,
      label: 'connectors.jenkins.jenkinsConnectorLabel',
      isRequired
    },
    {
      name: 'spec.jobName',
      type: ValidationFieldTypes.Text,
      label: 'connectors.jenkins.jobNameLabel',
      isRequired
    },
    {
      name: 'spec.jobParameter',
      type: ValidationFieldTypes.List,
      label: 'connectors.jenkins.jobParameterLabel',
      isRequired
    },
    {
      name: 'spec.failureStrategies',
      type: ValidationFieldTypes.List
    },
    {
      name: 'spec.delegateSelectors',
      type: ValidationFieldTypes.List,
      isRequired
    },
    {
      name: 'spec.unstableStatusAsSuccess',
      type: ValidationFieldTypes.Boolean
    },
    {
      name: 'spec.captureEnvironmentVariable',
      type: ValidationFieldTypes.Boolean
    },
    {
      name: 'timeout',
      type: ValidationFieldTypes.Text
    }
  ]
}
