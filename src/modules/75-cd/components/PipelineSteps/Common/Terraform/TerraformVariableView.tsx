/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { TerraformData, TerraformVariableStepProps, TerraformStoreTypes } from './TerraformInterfaces'
import { ConfigVariables } from './Variableview/ConfigSection'
import css from './TerraformStep.module.scss'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export function TerraformVariableStep(props: TerraformVariableStepProps): React.ReactElement {
  const { variablesData = {} as TerraformData, metadataMap, initialValues } = props

  const { getString } = useStrings()

  if (initialValues?.spec?.configuration?.type === 'Inline') {
    return (
      <>
        <VariablesListTable
          data={variablesData.spec?.provisionerIdentifier}
          originalData={initialValues.spec?.provisionerIdentifier}
          metadataMap={metadataMap}
          className={pipelineVariableCss.variablePaddingL3}
        />
        <ConfigVariables {...props} />

        {variablesData?.spec?.configuration?.spec?.backendConfig?.spec && (
          <>
            <Text className={css.stepTitle}>{getString('pipelineSteps.backendConfig')}</Text>
            <VariablesListTable
              data={variablesData.spec?.configuration?.spec?.backendConfig?.spec}
              originalData={initialValues.spec?.configuration?.spec?.backendConfig?.spec}
              metadataMap={metadataMap}
              className={pipelineVariableCss.variablePaddingL4}
            />
          </>
        )}
        {variablesData.spec?.configuration?.spec?.environmentVariables && (
          <Text className={css.stepTitle}>{getString('environmentVariables')}</Text>
        )}
        {((variablesData?.spec?.configuration?.spec?.environmentVariables as []) || [])?.map((envVar, index) => {
          return (
            <VariablesListTable
              key={envVar}
              data={variablesData.spec?.configuration?.spec?.environmentVariables?.[index]}
              originalData={initialValues.spec?.configuration?.spec?.environmentVariables?.[index]}
              metadataMap={metadataMap}
              className={pipelineVariableCss.variablePaddingL4}
            />
          )
        })}
      </>
    )
  } else if (initialValues?.spec?.configuration?.type !== TerraformStoreTypes.Inline) {
    return (
      <>
        <VariablesListTable
          className={pipelineVariableCss.variablePaddingL3}
          data={variablesData.spec}
          originalData={initialValues.spec}
          metadataMap={metadataMap}
        />

        <VariablesListTable
          data={variablesData.spec?.configuration?.type}
          originalData={initialValues.spec?.configuration?.type}
          metadataMap={metadataMap}
          className={pipelineVariableCss.variablePaddingL3}
        />
      </>
    )
  }
  /* istanbul ignore next */
  return <div />
}
