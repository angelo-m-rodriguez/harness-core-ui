/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ApprovalRejectionCriteria } from '@pipeline/components/PipelineSteps/Steps/Common/types'
import { ApprovalRejectionCriteriaType } from '@pipeline/components/PipelineSteps/Steps/Common/types'
import { handleOperatorChange } from '@pipeline/components/PipelineSteps/Steps/JiraApproval/helper'
import { getApprovalRejectionCriteriaForSubmit } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import { resetForm } from '../types'

describe('Approval Rejection criteria for submit tests', () => {
  test('if criteria is set properly', () => {
    const inputCriteria: ApprovalRejectionCriteria = {
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        matchAnyCondition: true,
        conditions: [{ key: 'state', operator: 'eq', value: { label: 'Done', value: 'Done' } }]
      }
    }

    const outputCriteria = getApprovalRejectionCriteriaForSubmit(inputCriteria)
    const value = outputCriteria.spec.conditions?.[0].value
    expect(value).toBe('Done')
  })

  test('if empty keys are filtered', () => {
    const inputCriteria: ApprovalRejectionCriteria = {
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        matchAnyCondition: true,
        conditions: [
          { key: 'Status', operator: 'eq', value: { label: 'Done', value: 'Done' } },
          { key: '', operator: 'eq', value: { label: 'Done', value: 'Done' } }
        ]
      }
    }

    const outputCriteria = getApprovalRejectionCriteriaForSubmit(inputCriteria)
    expect(outputCriteria.spec.conditions?.length).toBe(1)
  })

  test('if empty values are filtered', () => {
    const inputCriteria: ApprovalRejectionCriteria = {
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        matchAnyCondition: true,
        conditions: [{ key: 'Status', operator: 'eq', value: '' }]
      }
    }

    const outputCriteria = getApprovalRejectionCriteriaForSubmit(inputCriteria)
    expect(outputCriteria.spec.conditions?.length).toBe(0)
  })

  test('if multiselect works', () => {
    const inputCriteria: ApprovalRejectionCriteria = {
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        matchAnyCondition: true,
        conditions: [
          {
            key: 'state',
            operator: 'eq',
            value: [
              { label: 'Done', value: 'Done' },
              { label: 'S2', value: 'S2' }
            ]
          }
        ]
      }
    }

    const outputCriteria = getApprovalRejectionCriteriaForSubmit(inputCriteria)
    const value = outputCriteria.spec.conditions?.[0].value
    expect(value).toBe('Done,S2')
  })
})

describe('Operator onchange tests', () => {
  test('if on change is called if selected operator is multiselect', () => {
    const selectedOperator = { label: 'in', value: 'in' },
      onChange = jest.fn(),
      values = {
        type: ApprovalRejectionCriteriaType.KeyValues,
        spec: {
          conditions: [
            {
              key: 'state',
              operator: 'equals',
              value: { label: 'Done', value: 'Done' }
            }
          ],
          matchAnyCondition: true
        }
      },
      index = 0

    handleOperatorChange(selectedOperator, onChange, values, index)

    expect(onChange).toBeCalledWith({
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        conditions: [
          {
            key: 'state',
            operator: 'in',
            value: []
          }
        ],
        matchAnyCondition: true
      }
    })
  })

  test('if on change is called if selected operator is not in', () => {
    const selectedOperator = { label: 'not in', value: 'not in' },
      onChange = jest.fn(),
      values = {
        type: ApprovalRejectionCriteriaType.KeyValues,
        spec: {
          conditions: [
            {
              key: 'state',
              operator: 'equals',
              value: { label: 'Done', value: 'Done' }
            }
          ],
          matchAnyCondition: true
        }
      },
      index = 0

    handleOperatorChange(selectedOperator, onChange, values, index)

    expect(onChange).toBeCalledWith({
      type: ApprovalRejectionCriteriaType.KeyValues,
      spec: {
        conditions: [
          {
            key: 'state',
            operator: 'not in',
            value: []
          }
        ],
        matchAnyCondition: true
      }
    })
  })

  test('if on change is not called if current value is empty', () => {
    const selectedOperator = { label: 'in', value: 'in' },
      onChange = jest.fn(),
      values = {
        type: ApprovalRejectionCriteriaType.KeyValues,
        spec: {
          conditions: [
            {
              key: 'state',
              operator: 'equals',
              value: ''
            }
          ],
          matchAnyCondition: true
        }
      },
      index = 0

    handleOperatorChange(selectedOperator, onChange, values, index)

    expect(onChange).toBeCalledTimes(1)
  })

  test('if on change is not called if operator is not for multiselect', () => {
    const selectedOperator = { label: 'eq', value: 'eq' },
      onChange = jest.fn(),
      values = {
        type: ApprovalRejectionCriteriaType.KeyValues,
        spec: {
          conditions: [
            {
              key: 'state',
              operator: 'equals',
              value: { label: 'Done', value: 'Done' }
            }
          ],
          matchAnyCondition: true
        }
      },
      index = 0

    handleOperatorChange(selectedOperator, onChange, values, index)

    expect(onChange).not.toBeCalled()
  })
})

describe('Reset form Test', () => {
  test('Reset form for connetorRef and ticketType', () => {
    const formValues = {
      values: {
        name: 'serviceNowApprovalTest',
        identifier: 'snow',
        timeout: '10m',
        type: 'ServiceNowApproval',
        spec: {
          connectorRef: '',
          delegateSelectors: undefined,
          ticketNumber: '',
          ticketType: '',
          approvalCriteria: { spec: {}, type: ApprovalRejectionCriteriaType.Jexl },
          rejectionCriteria: { spec: {}, type: ApprovalRejectionCriteriaType.Jexl }
        }
      },
      setFieldValue: jest.fn()
    } as any

    expect(resetForm(formValues, 'connectorRef')).toBe(undefined)
    expect(resetForm(formValues, 'ticketType')).toBe(undefined)
  })
})
