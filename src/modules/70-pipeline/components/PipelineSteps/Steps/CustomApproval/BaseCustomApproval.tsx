/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FieldArray, FormikProps } from 'formik'
import cx from 'classnames'
import { v4 as uuid } from 'uuid'
import {
  Button,
  ButtonVariation,
  Container,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  SelectOption
} from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ShellScriptMonacoField, ScriptType } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import {
  CustomApprovalOutputStepVariable,
  scriptOutputType
} from '@pipeline/components/PipelineSteps/Steps/CustomApproval/types'
import { ApprovalRejectionCriteria } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalRejectionCriteria'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { CustomApprovalFormData } from './types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './CustomApproval.module.scss'

export const customApprovalType: SelectOption[] = [
  { label: 'Bash', value: 'Bash' },
  { label: 'PowerShell', value: 'PowerShell' }
]

export default function BaseCustomApproval(props: {
  formik: FormikProps<CustomApprovalFormData>
  isNewStep: boolean
  readonly?: boolean
  stepViewType?: StepViewType
  allowableTypes: MultiTypeInputType[]
}): React.ReactElement {
  const { formik, isNewStep, readonly, stepViewType, allowableTypes } = props
  const { values: formValues, setFieldValue } = formik
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const scriptType: ScriptType = formValues.spec?.shell || 'Bash'

  return (
    <Container className={css.customApprovalContainer}>
      {stepViewType !== StepViewType.Template && (
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.InputWithIdentifier
            inputLabel={getString('name')}
            isIdentifierEditable={isNewStep && !readonly}
            inputGroupProps={{
              placeholder: getString('pipeline.stepNamePlaceholder'),
              disabled: readonly
            }}
          />
        </div>
      )}
      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField
          name="timeout"
          label={getString('pipelineSteps.timeoutLabel')}
          multiTypeDurationProps={{ enableConfigureOptions: false, expressions, disabled: readonly, allowableTypes }}
          className={stepCss.duration}
          disabled={readonly}
        />
        {getMultiTypeFromValue(formValues?.timeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formValues?.timeout as string}
            type="String"
            variableName="timeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => {
              setFieldValue('timeout', value)
            }}
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={stepCss.divider} />
      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormInput.Select
          items={customApprovalType}
          name="spec.shell"
          label={getString('scriptType')}
          placeholder={getString('scriptType')}
          disabled
        />
      </div>
      <div className={cx(stepCss.formGroup)}>
        <MultiTypeFieldSelector
          name="spec.source.spec.script"
          label={getString('script')}
          defaultValueToReset=""
          disabled={readonly}
          allowedTypes={allowableTypes}
          disableTypeSelection={readonly}
          skipRenderValueInExpressionLabel
          expressionRender={() => {
            return (
              <ShellScriptMonacoField
                name="spec.source.spec.script"
                scriptType={scriptType}
                disabled={readonly}
                expressions={expressions}
              />
            )
          }}
        >
          <ShellScriptMonacoField
            name="spec.source.spec.script"
            scriptType={scriptType}
            disabled={readonly}
            expressions={expressions}
          />
        </MultiTypeFieldSelector>

        {getMultiTypeFromValue(formValues.spec.source?.spec?.script) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formValues.spec.source?.spec?.script as string}
            type="String"
            variableName="spec.source.spec.script"
            className={css.minConfigBtn}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => setFieldValue('spec.source.spec.script', value)}
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField
          name="spec.retryInterval"
          label={getString('pipeline.customApprovalStep.retryInterval')}
          multiTypeDurationProps={{ enableConfigureOptions: false, expressions, disabled: readonly, allowableTypes }}
          className={stepCss.duration}
          disabled={readonly}
        />
        {getMultiTypeFromValue(formValues?.spec?.retryInterval) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formValues?.spec?.retryInterval as string}
            type="String"
            variableName="spec.retryInterval"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => {
              setFieldValue('spec.retryInterval', value)
            }}
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField
          name="spec.scriptTimeout"
          label={getString('pipeline.customApprovalStep.scriptTimeout')}
          multiTypeDurationProps={{ enableConfigureOptions: false, expressions, disabled: readonly, allowableTypes }}
          className={stepCss.duration}
          disabled={readonly}
        />
        {getMultiTypeFromValue(formValues?.spec?.scriptTimeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formValues?.spec?.scriptTimeout as string}
            type="String"
            variableName="spec.scriptTimeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => {
              setFieldValue('spec.scriptTimeout', value)
            }}
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={cx(stepCss.formGroup)}>
        <MultiTypeFieldSelector
          name="spec.outputVariables"
          label={getString('pipeline.scriptOutputVariables')}
          defaultValueToReset={[]}
          disableTypeSelection
        >
          <FieldArray
            name="spec.outputVariables"
            render={({ push, remove }) => {
              return (
                <div className={css.panel}>
                  <div className={css.outputVarHeader}>
                    <span className={css.label}>Name</span>
                    <span className={css.label}>Type</span>
                    <span className={css.label}>Value</span>
                  </div>
                  {formValues.spec.outputVariables?.map(({ id }: CustomApprovalOutputStepVariable, i: number) => {
                    return (
                      <div className={css.outputVarHeader} key={id}>
                        <FormInput.Text
                          name={`spec.outputVariables[${i}].name`}
                          placeholder={getString('name')}
                          disabled={readonly}
                        />
                        <FormInput.Select
                          items={scriptOutputType}
                          name={`spec.outputVariables[${i}].type`}
                          placeholder={getString('typeLabel')}
                          disabled={readonly}
                        />

                        <FormInput.MultiTextInput
                          name={`spec.outputVariables[${i}].value`}
                          placeholder={getString('valueLabel')}
                          multiTextInputProps={{
                            allowableTypes,
                            expressions,
                            disabled: readonly
                          }}
                          label=""
                          disabled={readonly}
                        />

                        <Button minimal icon="main-trash" onClick={() => remove(i)} disabled={readonly} />
                      </div>
                    )
                  })}
                  <Button
                    icon="plus"
                    variation={ButtonVariation.LINK}
                    onClick={() => push({ name: '', type: 'String', value: '', id: uuid() })}
                    disabled={readonly}
                    className={css.addButton}
                  >
                    {getString('addOutputVar')}
                  </Button>
                </div>
              )
            }}
          />
        </MultiTypeFieldSelector>
      </div>

      <ApprovalRejectionCriteria
        statusList={[]}
        fieldList={[]}
        title={getString('pipeline.approvalCriteria.approvalCriteria')}
        isFetchingFields={false}
        mode="approvalCriteria"
        values={formik.values?.spec?.approvalCriteria}
        onChange={values => setFieldValue('spec.approvalCriteria', values)}
        formik={formik}
        readonly={readonly}
        stepType={StepType.CustomApproval}
      />
    </Container>
  )
}
