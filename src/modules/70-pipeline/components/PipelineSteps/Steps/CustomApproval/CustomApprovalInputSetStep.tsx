/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { getMultiTypeFromValue, MultiTypeInputType, FormInput, FormikForm } from '@wings-software/uicore'
import { isEmpty, get, isArray } from 'lodash-es'
import cx from 'classnames'

import { FieldArray } from 'formik'
import { useStrings } from 'framework/strings'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { ShellScriptMonacoField, ScriptType } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeTextAreaField } from '@common/components'
import { isApprovalStepFieldDisabled } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { scriptInputType, scriptOutputType, CustomApprovalData, CustomApprovalFormData } from './types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './CustomApproval.module.scss'

export interface CustomApprovalInputSetStepProps {
  initialValues: CustomApprovalFormData
  onUpdate?: (data: CustomApprovalFormData) => void
  onChange?: (data: CustomApprovalFormData) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  readonly?: boolean
  template?: CustomApprovalData
  path?: string
}

export default function CustomApprovalInputSetStep(props: CustomApprovalInputSetStepProps): React.ReactElement {
  const { template, path, readonly, initialValues, allowableTypes } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const scriptType: ScriptType = get(initialValues, 'spec.shell') || 'Bash'
  const prefix = isEmpty(path) ? '' : `${path}.`

  return (
    <FormikForm>
      {getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipelineSteps.timeoutLabel')}
            name={`${prefix}timeout`}
            disabled={readonly}
          />
        </div>
      )}

      {getMultiTypeFromValue(template?.spec?.source?.spec?.script) === MultiTypeInputType.RUNTIME ? (
        <div className={cx(stepCss.formGroup, stepCss.alignStart, stepCss.md)}>
          <MultiTypeFieldSelector
            name={`${prefix}spec.source.spec.script`}
            label={getString('script')}
            defaultValueToReset=""
            disabled={readonly}
            allowedTypes={allowableTypes}
            disableTypeSelection={readonly}
            skipRenderValueInExpressionLabel
            expressionRender={() => {
              return (
                <ShellScriptMonacoField
                  name={`${prefix}spec.source.spec.script`}
                  scriptType={scriptType}
                  disabled={readonly}
                  expressions={expressions}
                />
              )
            }}
          >
            <ShellScriptMonacoField
              name={`${prefix}spec.source.spec.script`}
              scriptType={scriptType}
              disabled={readonly}
              expressions={expressions}
            />
          </MultiTypeFieldSelector>
        </div>
      ) : null}

      {getMultiTypeFromValue(template?.spec?.retryInterval) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipeline.customApprovalStep.retryInterval')}
            name={`${prefix}spec.retryInterval`}
            disabled={readonly}
          />
        </div>
      )}

      {getMultiTypeFromValue(template?.spec?.scriptTimeout) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormMultiTypeDurationField
            multiTypeDurationProps={{
              enableConfigureOptions: false,
              allowableTypes,
              expressions,
              disabled: readonly
            }}
            label={getString('pipeline.customApprovalStep.scriptTimeout')}
            name={`${prefix}spec.scriptTimeout`}
            disabled={readonly}
          />
        </div>
      )}

      {isArray(template?.spec?.outputVariables) && template?.spec?.outputVariables ? (
        <div className={stepCss.formGroup}>
          <MultiTypeFieldSelector
            name="spec.outputVariables"
            label={getString('pipeline.scriptOutputVariables')}
            defaultValueToReset={[]}
            disableTypeSelection
            isOptional={false}
          >
            <FieldArray
              name="spec.outputVariables"
              render={() => {
                return (
                  <div className={css.panel}>
                    <div className={css.outputVarHeader}>
                      <span className={css.label}>Name</span>
                      <span className={css.label}>Type</span>
                      <span className={css.label}>Value</span>
                    </div>
                    {template.spec.outputVariables?.map((output, i: number) => {
                      return (
                        <div className={css.outputVarHeader} key={output.name}>
                          <FormInput.Text
                            name={`${prefix}spec.outputVariables[${i}].name`}
                            placeholder={getString('name')}
                            disabled={true}
                          />
                          <FormInput.Select
                            items={scriptOutputType}
                            name={`${prefix}spec.outputVariables[${i}].type`}
                            placeholder={getString('typeLabel')}
                            disabled={true}
                          />

                          <FormInput.MultiTextInput
                            name={`${prefix}spec.outputVariables[${i}].value`}
                            multiTextInputProps={{
                              allowableTypes,
                              expressions,
                              disabled: readonly
                            }}
                            label=""
                            disabled={readonly}
                            placeholder={getString('valueLabel')}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
          </MultiTypeFieldSelector>
        </div>
      ) : null}

      {getMultiTypeFromValue(template?.spec?.approvalCriteria?.spec?.expression) === MultiTypeInputType.RUNTIME ? (
        <FormMultiTypeTextAreaField
          className={css.deploymentViewMedium}
          label={getString('pipeline.approvalCriteria.jexlExpressionLabelApproval')}
          name={`${prefix}spec.approvalCriteria.spec.expression`}
          disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeTextArea={{
            expressions,
            allowableTypes
          }}
        />
      ) : null}

      {isArray(template?.spec?.environmentVariables) && template?.spec?.environmentVariables ? (
        <div className={stepCss.formGroup}>
          <MultiTypeFieldSelector
            name="spec.environmentVariables"
            label={getString('pipeline.scriptInputVariables')}
            defaultValueToReset={[]}
            disableTypeSelection
          >
            <FieldArray
              name="spec.environmentVariables"
              render={() => {
                return (
                  <div className={css.panel}>
                    <div className={css.environmentVarHeader}>
                      <span className={css.label}>Name</span>
                      <span className={css.label}>Type</span>
                      <span className={css.label}>Value</span>
                    </div>
                    {template.spec.environmentVariables?.map((type, i: number) => {
                      return (
                        <div className={css.environmentVarHeader} key={type.value}>
                          <FormInput.Text
                            name={`${prefix}spec.environmentVariables[${i}].name`}
                            placeholder={getString('name')}
                            disabled={true}
                          />
                          <FormInput.Select
                            items={scriptInputType}
                            name={`${prefix}spec.environmentVariables[${i}].type`}
                            placeholder={getString('typeLabel')}
                            disabled={true}
                          />
                          <FormInput.MultiTextInput
                            name={`${prefix}spec.environmentVariables[${i}].value`}
                            multiTextInputProps={{
                              allowableTypes,
                              expressions,
                              disabled: readonly
                            }}
                            label=""
                            disabled={readonly}
                            placeholder={getString('valueLabel')}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
          </MultiTypeFieldSelector>
        </div>
      ) : null}

      {getMultiTypeFromValue(template?.spec?.rejectionCriteria?.spec?.expression) === MultiTypeInputType.RUNTIME ? (
        <FormMultiTypeTextAreaField
          className={css.deploymentViewMedium}
          label={getString('pipeline.approvalCriteria.jexlExpressionLabelRejection')}
          name={`${prefix}spec.rejectionCriteria.spec.expression`}
          disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeTextArea={{
            expressions,
            allowableTypes
          }}
        />
      ) : null}
    </FormikForm>
  )
}
