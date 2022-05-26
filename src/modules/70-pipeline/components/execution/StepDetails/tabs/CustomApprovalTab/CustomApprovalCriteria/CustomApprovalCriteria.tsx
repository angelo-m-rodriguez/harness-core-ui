/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'

import { Text } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import type {
  KeyValueCriteriaSpec,
  JexlCriteriaSpec,
  ConditionDTO,
  CriteriaSpecWrapperDTO,
  CriteriaSpecDTO
} from 'services/pipeline-ng'
import { String, StringKeys } from 'framework/strings'
import { Collapse } from '@pipeline/components/execution/StepDetails/common/Collapse/Collapse'

import css from './CustomApprovalCriteria.module.scss'

const titles: Record<CustomApprovalCriteriaProps['type'], StringKeys> = {
  approval: 'pipeline.approvalCriteria.approvalCriteria',
  rejection: 'pipeline.approvalCriteria.rejectionCriteria'
}

const conditionStr: Record<ConditionDTO['operator'], StringKeys> = {
  equals: 'pipeline.customApprovalStep.execution.conditions.equals',
  'not equals': 'pipeline.customApprovalStep.execution.conditions.not_equals',
  in: 'pipeline.customApprovalStep.execution.conditions.in',
  'not in': 'pipeline.customApprovalStep.execution.conditions.not_in'
}

function isJexlCriteria(type: CriteriaSpecWrapperDTO['type'], criteria: CriteriaSpecDTO): criteria is JexlCriteriaSpec {
  return criteria && type === 'Jexl'
}

function isKeyValuesCriteria(
  type: CriteriaSpecWrapperDTO['type'],
  criteria: CriteriaSpecDTO
): criteria is KeyValueCriteriaSpec {
  return criteria && type === 'KeyValues'
}

export interface CustomApprovalCriteriaProps {
  type: 'approval' | 'rejection'
  criteria: CriteriaSpecWrapperDTO
}

export function CustomApprovalCriteria(props: CustomApprovalCriteriaProps): React.ReactElement | null {
  const { type, criteria } = props

  if (isEmpty(criteria.spec.conditions) && isEmpty(criteria.spec.expression)) {
    // Rejection criteria can be optional
    // So render nothing if we do not have conditions or expression
    return null
  }

  return (
    <Collapse className={css.customApprovalCriteria} title={<String stringID={titles[type]} />} isDefaultOpen>
      {isKeyValuesCriteria(criteria.type, criteria.spec) ? (
        <div className={css.collapseContainer}>
          <String
            tagName="div"
            stringID={
              criteria.spec.matchAnyCondition
                ? 'pipeline.commonApprovalStep.execution.anyConditionsMsg'
                : 'pipeline.commonApprovalStep.execution.allConditionsMsg'
            }
          />
          <ul className={css.conditions}>
            {(criteria.spec.conditions || []).map((condition: ConditionDTO, i: number) => (
              <li key={i}>
                <String stringID={conditionStr[condition.operator]} vars={condition} />
                <div className={css.keyWarper}>
                  {condition.value.split(',').map((key, j) => (
                    <Text lineClamp={1} font={{ variation: FontVariation.SMALL }} className={css.key} key={j}>
                      {key}
                    </Text>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isJexlCriteria(criteria.type, criteria.spec) ? (
        <div className={css.collapseContainer}>
          <String stringID="common.jexlExpression" />
          <div className={css.jexl}>{criteria.spec.expression}</div>
        </div>
      ) : null}
    </Collapse>
  )
}
