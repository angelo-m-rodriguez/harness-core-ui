/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { defaultTo, get, isNil } from 'lodash-es'
import type { FormikProps } from 'formik'

import { FormInput, getMultiTypeFromValue, MultiTypeInputType, SelectOption } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { EnvironmentResponse, EnvironmentResponseDTO } from 'services/cd-ng'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import type { PipelineInfrastructureV2 } from '../utils'

interface DeployEnvironmentInEnvGroupProps {
  formikRef: React.MutableRefObject<FormikProps<unknown> | null>
  readonly: boolean
  initialValues?: PipelineInfrastructureV2
  selectedEnvironmentGroup: any
  allowableTypes: MultiTypeInputType[]
  setSelectedEnvironment: any
}

export default function DeployEnvironmentInEnvGroup({
  formikRef,
  readonly,
  // initialValues,
  selectedEnvironmentGroup,
  allowableTypes,
  setSelectedEnvironment
}: DeployEnvironmentInEnvGroupProps) {
  // const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  // const { showError } = useToaster()
  // const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()

  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue((formikRef.current as any)?.values?.infrastructureRef)
  )

  const infrastructuresLoading = false

  const [environments, setEnvironments] = useState<EnvironmentResponseDTO[]>()
  const [environmentsSelectOptions, setEnvironmentsSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (get(selectedEnvironmentGroup, 'envResponse')) {
      setEnvironments(
        defaultTo(
          get(selectedEnvironmentGroup, 'envResponse', [])?.map((environmentObj: EnvironmentResponse) => ({
            ...environmentObj.environment
          })),
          []
        )
      )
    }
  }, [selectedEnvironmentGroup])

  useEffect(() => {
    if (!isNil(environments)) {
      setEnvironmentsSelectOptions(
        environments.map(environment => {
          return { label: defaultTo(environment.name, ''), value: defaultTo(environment.identifier, '') }
        })
      )
    }
  }, [environments])

  // useEffect(() => {
  //   if (
  //     !isEmpty(infrastructuresSelectOptions) &&
  //     !isNil(infrastructuresSelectOptions) &&
  //     (initialValues as any)?.infrastructureRef
  //   ) {
  //     if (getMultiTypeFromValue((initialValues as any)?.infrastructureRef) === MultiTypeInputType.FIXED) {
  //       const doesExist =
  //         infrastructuresSelectOptions.filter(
  //           infra => infra.value === ((initialValues as any)?.infrastructureRef as unknown as string)
  //         ).length > 0
  //       if (!doesExist) {
  //         if (!readonly) {
  //           formikRef.current?.setFieldValue('infrastructureRef', '')
  //         } else {
  //           const options = [...infrastructuresSelectOptions]
  //           options.push({
  //             label: (initialValues as any)?.infrastructureRef,
  //             value: (initialValues as any)?.infrastructureRef
  //           })
  //           setInfrastructuresSelectOptions(options)
  //         }
  //       }
  //     }
  //   }
  // }, [infrastructuresSelectOptions])

  return (
    <FormInput.MultiTypeInput
      label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
      tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
      name="environmentInEnvGrouRef"
      disabled={readonly || (infrastructureRefType === MultiTypeInputType.FIXED && infrastructuresLoading)}
      placeholder={
        infrastructuresLoading
          ? getString('loading')
          : getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')
      }
      multiTypeInputProps={{
        onTypeChange: setInfrastructureRefType,
        width: 280,
        onChange: item => {
          if ((item as SelectOption).value !== (formikRef.current?.values as any)?.environmentRef2) {
            formikRef.current?.setFieldValue('environmentRef2', item)
            setSelectedEnvironment(
              environments?.find(environment => environment.identifier === (item as SelectOption).value)
            )
          }
        },
        selectProps: {
          addClearBtn: !readonly,
          items: defaultTo(environmentsSelectOptions, [])
        },
        expressions,
        allowableTypes
      }}
      selectItems={defaultTo(environmentsSelectOptions, [])}
    />
  )
}
