/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikErrors, FormikProps } from 'formik'
import { defaultTo } from 'lodash-es'

import { Button, FormError } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { FormGroup, IFormGroupProps, Intent } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'

import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import type { PolicyStepFormData } from '../../PolicyStepTypes'
import { PolicySetModal } from '../PolicySetModal/PolicySetModal'
import { MiniPolicySetsRenderer } from '../PolicySetListRenderer/MiniPolicySetsRenderer'

import css from './PolicySetsFormField.module.scss'

interface PolicySetsFormFieldInterface extends Omit<IFormGroupProps, 'label'> {
  name: string
  formikProps?: FormikProps<PolicyStepFormData>
  error?: string | FormikErrors<any> | undefined
  stepViewType?: StepViewType
}

const PolicySetsFormField = ({
  formikProps,
  name,
  error,
  disabled,
  stepViewType,
  ...rest
}: PolicySetsFormFieldInterface) => {
  const { getString } = useStrings()

  const setPolicySetIds = (list: string[]) => {
    formikProps?.setFieldValue(name, list)
  }

  const policySetIds = defaultTo(formikProps?.values?.spec?.policySets, [])

  const [showModal, closeModal] = useModalHook(
    () => (
      <PolicySetModal
        closeModal={closeModal}
        policySetIds={policySetIds}
        setPolicySetIds={setPolicySetIds}
        stepViewType={stepViewType}
      />
    ),
    [policySetIds, setPolicySetIds, stepViewType]
  )

  const helperText = error ? <FormError name={name} errorMessage={error} /> : undefined
  const intent = error ? Intent.DANGER : Intent.NONE

  return (
    <FormGroup
      {...rest}
      helperText={helperText}
      intent={intent}
      className={css.formGroup}
      label={getString('common.policiesSets.policyset')}
    >
      <MiniPolicySetsRenderer policySetIds={policySetIds} />
      <Button
        minimal
        text={getString('common.policiesSets.addOrModifyPolicySet')}
        className={css.addModifyButton}
        withoutCurrentColor={true}
        iconProps={{ size: 14 }}
        disabled={disabled}
        onClick={showModal}
      />
    </FormGroup>
  )
}

export default PolicySetsFormField
