/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { CreateStackVariableStepProps, CreateStackData } from '../../CloudFormationInterfaces.types'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'
import css from './VariableView.module.scss'

export function CreateStackVariableStep({
  variablesData = {} as CreateStackData,
  initialValues = {} as CreateStackData,
  metadataMap
}: CreateStackVariableStepProps): React.ReactElement {
  const { getString } = useStrings()

  return (
    <>
      <VariablesListTable
        data={variablesData.spec?.configuration}
        originalData={initialValues.spec?.configuration}
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      <VariablesListTable
        data={variablesData.spec?.configuration}
        originalData={initialValues.spec?.configuration}
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      {variablesData.spec?.configuration?.templateFile && (
        <Text className={css.title}>{getString('cd.cloudFormation.templateFile')}</Text>
      )}
      <VariablesListTable
        data={
          variablesData.spec?.configuration?.templateFile?.spec?.store?.spec ||
          variablesData.spec?.configuration?.templateFile?.spec
        }
        originalData={
          initialValues.spec?.configuration?.templateFile?.spec?.store?.spec ||
          initialValues.spec?.configuration?.templateFile?.spec
        }
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      {variablesData.spec?.configuration?.parameters?.length && (
        <Text className={css.title}>{getString('cd.cloudFormation.parameterFileDetails')}</Text>
      )}
      {((variablesData.spec?.configuration?.parameters as []) || [])?.map((_, index) => (
        <VariablesListTable
          key={`parameters${index}`}
          data={variablesData.spec?.configuration?.parameters?.[index]?.store?.spec}
          originalData={initialValues.spec?.configuration?.parameters?.[index]?.store?.spec}
          metadataMap={metadataMap}
          className={pipelineVariableCss.variablePaddingL3}
        />
      ))}
      {variablesData.spec?.configuration?.parameterOverrides?.length && (
        <Text className={css.title}>{getString('cd.cloudFormation.inlineParameterFiles')}</Text>
      )}
      {((variablesData.spec?.configuration?.parameterOverrides as []) || [])?.map((_, index) => (
        <VariablesListTable
          key={`parameterOverrides${index}`}
          data={variablesData.spec?.configuration?.parameterOverrides?.[index]}
          originalData={initialValues.spec?.configuration?.parameterOverrides?.[index]}
          metadataMap={metadataMap}
          className={pipelineVariableCss.variablePaddingL3}
        />
      ))}
      {variablesData.spec?.configuration?.tags && (
        <>
          <Text className={css.title}>{getString('tagsLabel')}</Text>
          <VariablesListTable
            data={variablesData.spec?.configuration?.tags?.spec}
            originalData={initialValues.spec?.configuration?.tags?.spec}
            metadataMap={metadataMap}
            className={pipelineVariableCss.variablePaddingL3}
          />
        </>
      )}
    </>
  )
}
