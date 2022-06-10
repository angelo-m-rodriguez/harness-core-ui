/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Container, FormInput, getMultiTypeFromValue, MultiTypeInputType, Text } from '@harness/uicore'
import type { FormikContextType } from 'formik'
import React from 'react'
import { get } from 'lodash-es'
import List from '@common/components/List/List'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { K8sApplyProps } from './K8sInterface'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export function K8sOverrideValuesRuntimeFields(
  props: K8sApplyProps & {
    overrideValue: any
    index: number
    formik?: FormikContextType<any>
  }
): React.ReactElement {
  const { overrideValue, index, allowableTypes, initialValues, inputSetData, readonly } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  return (
    <>
      <Container flex width={150}>
        <Text font={{ size: 'small' }} margin={{ bottom: 'small' }}>
          {getString('cd.manifestId')}: {overrideValue?.manifest?.identifier}
        </Text>
      </Container>

      {getMultiTypeFromValue(overrideValue.manifest?.spec?.store?.spec?.connectorRef) ===
        MultiTypeInputType.RUNTIME && (
        <FormMultiTypeConnectorField
          accountIdentifier={accountId}
          selected={get(
            initialValues,
            `${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.connectorRef`,
            ''
          )}
          multiTypeProps={{ allowableTypes, expressions }}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          width={400}
          type={overrideValue?.manifest?.spec?.type}
          name={`${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.connectorRef`}
          label={getString('connector')}
          disabled={readonly}
          placeholder={getString('select')}
          setRefValue
        />
      )}
      {getMultiTypeFromValue(overrideValue.manifest?.spec?.store?.spec?.branch) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.branch`}
            label={getString('pipelineSteps.deploy.inputSet.branch')}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(overrideValue.manifest?.spec?.store?.spec?.paths) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <List
            label={getString('filePaths')}
            name={`${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.paths`}
            disabled={readonly}
            style={{ marginBottom: 'var(--spacing-small)' }}
            isNameOfArrayType
          />
        </div>
      )}
      {getMultiTypeFromValue(overrideValue.manifest?.spec?.store?.spec?.commitId) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.commitId`}
            label={getString('pipeline.manifestType.commitId')}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}

      {getMultiTypeFromValue(overrideValue.manifest?.spec?.store?.spec?.content) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${inputSetData?.path}.spec.overrides[${index}].spec.store.spec.content`}
            label={getString('pipelineSteps.content')}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
    </>
  )
}
