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
import type { RemoteTerraformVarFileSpec } from 'services/cd-ng'

import type { TerraformPlanData, TerraformPlanVariableStepProps } from '../../Common/Terraform/TerraformInterfaces'
import css from '@cd/components/PipelineSteps/Common/Terraform/TerraformStep.module.scss'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'
export function ConfigVariables(props: TerraformPlanVariableStepProps): React.ReactElement {
  const { variablesData = {} as TerraformPlanData, metadataMap, initialValues } = props
  const { getString } = useStrings()
  return (
    <>
      <VariablesListTable
        data={variablesData?.spec?.configuration}
        originalData={initialValues.spec?.configuration}
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      <VariablesListTable
        data={variablesData?.spec?.configuration?.configFiles}
        originalData={initialValues.spec?.configuration?.configFiles}
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      {variablesData?.spec?.configuration?.configFiles?.store?.spec?.gitFetchType && (
        <>
          <Text className={css.stepTitle}>{getString('pipelineSteps.configFiles')}</Text>
          <VariablesListTable
            data={variablesData?.spec?.configuration?.configFiles?.store?.spec}
            originalData={initialValues.spec?.configuration?.configFiles?.store?.spec}
            metadataMap={metadataMap}
            className={pipelineVariableCss.variablePaddingL4}
          />
        </>
      )}
      {variablesData?.spec?.configuration?.varFiles?.length && (
        <>
          <Text className={css.stepTitle}>{getString('cd.terraformVarFiles')}</Text>
          {variablesData?.spec?.configuration?.varFiles?.map((varFile, index) => {
            if (varFile?.varFile?.type === 'Inline') {
              return (
                <VariablesListTable
                  key={index}
                  data={variablesData?.spec?.configuration?.varFiles?.[index]?.varFile?.spec}
                  originalData={initialValues?.spec?.configuration?.varFiles?.[index]?.varFile?.spec || ({} as any)}
                  metadataMap={metadataMap}
                  className={pipelineVariableCss.variablePaddingL4}
                />
              )
            } else if (varFile?.varFile?.type === 'Remote') {
              const remoteSpec = variablesData?.spec?.configuration?.varFiles?.[index]?.varFile
                ?.spec as RemoteTerraformVarFileSpec
              const initVarSpec = initialValues?.spec?.configuration?.varFiles?.[index]?.varFile
                ?.spec as RemoteTerraformVarFileSpec
              return (
                <VariablesListTable
                  key={index}
                  data={remoteSpec?.store?.spec}
                  originalData={initVarSpec?.store?.spec || ({} as any)}
                  metadataMap={metadataMap}
                  className={pipelineVariableCss.variablePaddingL4}
                />
              )
            }
          })}
        </>
      )}
    </>
  )
}
