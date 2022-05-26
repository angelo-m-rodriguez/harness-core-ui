/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiSelectOption, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import { isEmpty } from 'lodash-es'
import type {
  ServiceNowApprovalData,
  ServiceNowTicketTypeSelectOption
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/types'
import { getApprovalRejectionCriteriaForSubmit } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import {
  ApprovalRejectionCriteria,
  ApprovalRejectionCriteriaCondition,
  ApprovalRejectionCriteriaType
} from '@pipeline/components/PipelineSteps/Steps/Common/types'
import type { ServiceNowFieldNG } from 'services/cd-ng'

export const processInitialValues = (values: ServiceNowApprovalData): ServiceNowApprovalData => {
  // Convert string values in approval/rejection criteria condition to SelectOption, so that it's populated in edit
  return {
    ...values,
    spec: {
      ...values.spec,
      approvalCriteria: getApprovalRejectionCriteriaForInitialValues(values.spec.approvalCriteria),
      rejectionCriteria: getApprovalRejectionCriteriaForInitialValues(values.spec.rejectionCriteria)
    }
  }
}

export const processFormData = (values: ServiceNowApprovalData): ServiceNowApprovalData => {
  return {
    ...values,
    spec: {
      ...values.spec,
      connectorRef: values.spec.connectorRef,
      approvalCriteria: getApprovalRejectionCriteriaForSubmit(values.spec.approvalCriteria),
      rejectionCriteria: getApprovalRejectionCriteriaForSubmit(values.spec.rejectionCriteria)
    }
  }
}

export const getApprovalRejectionCriteriaForInitialValues = (
  criteria: ApprovalRejectionCriteria,
  fieldList: ServiceNowFieldNG[] = []
): ApprovalRejectionCriteria => {
  // Convert the approval/rejection criteria 'value' field to selectoption, from string/string[]
  if (!criteria) {
    return getDefaultCriterias()
  }
  return {
    ...criteria,
    spec: {
      ...criteria.spec,
      conditions: Array.isArray(criteria.spec.conditions)
        ? criteria.spec.conditions?.map((condition: ApprovalRejectionCriteriaCondition) => ({
            key: condition.key,
            operator: condition.operator,
            value:
              getMultiTypeFromValue(condition.value) === MultiTypeInputType.FIXED
                ? getInitialApprovalRejectionConditionValues(condition, fieldList)
                : condition.value
          }))
        : []
    }
  }
}
const getInitialApprovalRejectionConditionValues = (
  condition: ApprovalRejectionCriteriaCondition,
  fieldList: ServiceNowFieldNG[] = []
): string | SelectOption | MultiSelectOption[] => {
  // The value in YAML is always a string.
  // We'll figure out the component from operator and key
  const { operator, value, key } = condition
  const list = fieldList.find(field => field.name === key)?.allowedValues

  if (isEmpty(list)) {
    // Simple text input
    return value?.toString()
  }

  if ((operator === 'in' || operator === 'not in') && typeof value === 'string') {
    // Multi select
    return value.split(',').map(each => ({
      label: each,
      value: each
    }))
  }
  // Single select
  return {
    label: value.toString(),
    value: value.toString()
  }
}
export const getDefaultCriterias = (): ApprovalRejectionCriteria => ({
  type: ApprovalRejectionCriteriaType.KeyValues,
  spec: {
    matchAnyCondition: true,
    conditions: []
  }
})

export const getGenuineValue = (
  value: SelectOption | ServiceNowTicketTypeSelectOption | string
): string | undefined => {
  // This function returns true if the value is fixed
  // i.e. selected from dropdown
  // We'll use this value to make API calls for depedent fields
  if (typeof value === 'object') {
    // Either SelectOption or ServiceNowTicketTypeSelectOption - the value has been selected from the form
    return value.value.toString()
  }
  if (getMultiTypeFromValue(value) === MultiTypeInputType.FIXED && value) {
    // Value is present as string and supplied as initialValues
    return value
  }
  return undefined
}
