/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import * as Yup from 'yup'
import { Formik, FormInput } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { NameSchema } from '@common/utils/Validation'
import { useQueryParams } from '@common/hooks'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { AzureTrafficShiftProps } from './AzureTrafficShiftInterface'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const AzureTrafficShiftRef = (
  { allowableTypes, isNewStep = true, readonly = false, initialValues, onUpdate, onChange }: AzureTrafficShiftProps,
  formikRef: StepFormikFowardRef
): JSX.Element => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const query = useQueryParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionId = (query as any).sectionId || ''

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName={`AzureTrafficShift-${sectionId}`}
      validate={values => {
        const payload = {
          ...values
        }
        onChange?.(payload)
      }}
      onSubmit={values => {
        const payload = {
          ...values
        }
        onUpdate?.(payload)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        return (
          <>
            <div className={cx(stepCss.formGroup, stepCss.lg)}>
              <FormInput.InputWithIdentifier
                inputLabel={getString('name')}
                isIdentifierEditable={isNewStep}
                inputGroupProps={{
                  disabled: readonly
                }}
              />
            </div>
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                disabled={readonly}
              />
            </div>
          </>
        )
      }}
    </Formik>
  )
}
