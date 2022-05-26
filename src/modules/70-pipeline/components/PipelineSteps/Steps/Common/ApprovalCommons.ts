/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

// Common helpers and types for approval forms
import { flatMap } from 'lodash-es'
import { getMultiTypeFromValue, MultiSelectOption, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import {
  ApprovalRejectionCriteria,
  ApprovalRejectionCriteriaCondition,
  ApprovalRejectionCriteriaType
} from '@pipeline/components/PipelineSteps/Steps/Common/types'

const getEntries = function <T>(object: T, prefix = ''): Array<any> {
  return flatMap(Object.entries(object), ([k, v]: { k: string; v: any }[]) =>
    Object(v) === v ? getEntries(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  )
}

export function flatObject(object: Record<string, any>): Record<string, unknown> {
  return getEntries(object).reduce((o, k) => ((o[k[0]] = k[1]), o), {})
}

// returns if an approval form field is disabled.
// More params might be added in the future
// readonly denotes RBAC
export const isApprovalStepFieldDisabled = (readonly = false, fetching = false): boolean => {
  if (readonly) {
    return true
  }
  if (fetching) {
    return true
  }
  return false
}

const getApprovalRejectionConditionValuesForSubmit = (values: string | SelectOption | MultiSelectOption[]): string => {
  // The selected values can be string, selectoption or multiselect options
  if (typeof values === 'string') {
    // Simple text input
    return values
  }
  if (Array.isArray(values)) {
    // Multi select
    return values.map(v => v.value?.toString()).join(',')
  }
  // Single select
  return values.value.toString()
}

const filterNonEmptyConditions = (condition: ApprovalRejectionCriteriaCondition) => condition.key && condition.value

export const getApprovalRejectionCriteriaForSubmit = (
  criteria: ApprovalRejectionCriteria
): ApprovalRejectionCriteria => {
  // Convert the approval/rejection criteria 'value' field to string/string[], from selectoption
  const criteriaToReturn: ApprovalRejectionCriteria = {
    type: criteria.type,
    spec: {
      matchAnyCondition: criteria.spec.matchAnyCondition,
      expression: criteria.spec.expression,
      conditions: criteria.spec.conditions
        ?.filter(filterNonEmptyConditions)
        .map((condition: ApprovalRejectionCriteriaCondition) => {
          return {
            key: condition.key,
            operator: condition.operator,
            value:
              getMultiTypeFromValue(condition.value) !== MultiTypeInputType.EXPRESSION
                ? getApprovalRejectionConditionValuesForSubmit(condition.value)
                : condition.value
          }
        })
    }
  }
  if (criteriaToReturn.type === ApprovalRejectionCriteriaType.Jexl) {
    delete criteriaToReturn.spec.conditions
    delete criteriaToReturn.spec.matchAnyCondition
  } else if (criteriaToReturn.type === ApprovalRejectionCriteriaType.KeyValues) {
    delete criteriaToReturn.spec.expression
  }
  return criteriaToReturn
}
