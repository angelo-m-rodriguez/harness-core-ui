/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEqual } from 'lodash-es'
import type { Distribution, Feature } from 'services/cf'
import { PERCENTAGE_ROLLOUT_VALUE } from '@cf/constants'
import type { Instruction } from '@cf/utils/instructions'
import type {
  TargetManagementFlagConfigurationPanelFormRow,
  TargetManagementFlagConfigurationPanelFormValues as FormValues
} from '@cf/components/TargetManagementFlagConfigurationPanel/types'

export function getFlagSettingsInstructions(
  targetGroupIdentifier: string,
  values: FormValues,
  initialValues: FormValues,
  flags: Feature[]
): Instruction[] {
  const instructions = []

  const removedFlagIdentifiers = getRemovedFlagIdentifiers(values.flags, initialValues.flags)
  const updatedFlags = getUpdatedFlags(values.flags, initialValues.flags)

  if (removedFlagIdentifiers.length) {
    instructions.push(getRemoveFlagsInstruction(removedFlagIdentifiers, flags, targetGroupIdentifier))
  }

  if (Object.keys(updatedFlags).length) {
    instructions.push(getUpdateFlagsInstruction(updatedFlags, flags, targetGroupIdentifier))
  }

  return instructions
}

export function getRemovedFlagIdentifiers(
  valueFlags: FormValues['flags'],
  initialValueFlags: FormValues['flags']
): string[] {
  const newKeys = Object.keys(valueFlags)
  return Object.keys(initialValueFlags).filter(oldKey => !newKeys.includes(oldKey))
}

export function getUpdatedFlags(
  valueFlags: FormValues['flags'],
  initialValueFlags: FormValues['flags']
): FormValues['flags'] {
  return Object.fromEntries(
    Object.entries(valueFlags).filter(
      ([identifier, { variation, percentageRollout }]) =>
        initialValueFlags[identifier]?.variation !== variation ||
        (variation === PERCENTAGE_ROLLOUT_VALUE &&
          !isEqual(percentageRollout, initialValueFlags[identifier].percentageRollout))
    )
  )
}

export function getRemoveFlagsInstruction(
  identifiers: string[],
  flags: Feature[],
  targetGroupIdentifier: string
): Instruction {
  return {
    kind: 'removeRule',
    parameters: {
      features: identifiers.map(identifier => ({
        ruleID: getRuleId(
          targetGroupIdentifier,
          flags.find(({ identifier: flagIdentifier }) => identifier === flagIdentifier) as Feature
        )
      }))
    }
  } as any as Instruction
}

export function getUpdateFlagsInstruction(
  updatedValues: FormValues['flags'],
  flags: Feature[],
  targetGroupIdentifier: string
): Instruction {
  return {
    kind: 'addRule',
    parameters: {
      features: Object.entries(updatedValues).map(([identifier, value]) => ({
        identifier: identifier,
        ...getVariationOrServe(value),
        ruleID: getRuleId(
          targetGroupIdentifier,
          flags.find(({ identifier: flagIdentifier }) => identifier === flagIdentifier) as Feature
        )
      }))
    }
  } as any as Instruction
}

export function getAddFlagsInstruction(flags: FormValues['flags']): Instruction {
  return {
    kind: 'addRule',
    parameters: {
      features: Object.entries(flags).map(([identifier, value]) => ({
        identifier: identifier,
        ...getVariationOrServe(value)
      }))
    }
  } as any as Instruction
}

export function getVariationOrServe(
  row: TargetManagementFlagConfigurationPanelFormRow
): { variation: string } | { serve: { distribution: Distribution } } {
  if (row.variation === PERCENTAGE_ROLLOUT_VALUE) {
    return {
      serve: {
        distribution: {
          bucketBy: 'identifier',
          variations: row.percentageRollout?.variations || []
        }
      }
    }
  }

  return { variation: row.variation }
}

export function getRuleId(targetGroupIdentifier: string, flag: Feature): string | undefined {
  return flag.envProperties?.rules?.find(({ clauses }) =>
    clauses.some(({ op, values: segmentIds }) => op === 'segmentMatch' && segmentIds.includes(targetGroupIdentifier))
  )?.ruleId
}
