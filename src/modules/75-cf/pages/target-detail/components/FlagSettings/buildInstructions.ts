/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import type { Instruction } from '@cf/utils/instructions'

export default function buildInstructions(values: FormValues, initialValues: FormValues): Instruction[] {
  const instructions = []

  const updateInstruction = buildUpdateInstruction(values, initialValues)
  if (updateInstruction) {
    instructions.push(updateInstruction)
  }

  const removeInstruction = buildRemoveInstruction(values, initialValues)
  if (removeInstruction) {
    instructions.push(removeInstruction)
  }

  const addInstruction = buildAddInstruction(values, initialValues)
  if (addInstruction) {
    instructions.push(addInstruction)
  }

  return instructions
}

function buildUpdateInstruction(values: FormValues, initialValues: FormValues): Instruction | undefined {
  const updated = Object.entries(values.flags)
    .filter(([identifier]) => identifier in initialValues.flags)
    .filter(([identifier, { variation }]) => initialValues.flags[identifier].variation !== variation)

  if (updated.length) {
    return {
      kind: 'addTargetToFlagsVariationTargetMap',
      parameters: {
        features: updated.map(([identifier, { variation }]) => ({ identifier, variation }))
      }
    } as unknown as Instruction
  }
}

function buildRemoveInstruction(values: FormValues, initialValues: FormValues): Instruction | undefined {
  const removed = Object.entries(initialValues.flags).filter(([identifier]) => !(identifier in values.flags))

  if (removed.length) {
    return {
      kind: 'removeTargetFromFlagsVariationTargetMap',
      parameters: {
        features: removed.map(([identifier, { variation }]) => ({ identifier, variation }))
      }
    } as unknown as Instruction
  }
}

function buildAddInstruction(values: FormValues, initialValues: FormValues): Instruction | undefined {
  const added = Object.entries(values.flags).filter(([identifier]) => !(identifier in initialValues.flags))

  if (added.length) {
    return {
      kind: 'addTargetToFlagsVariationTargetMap',
      parameters: {
        features: added.map(([identifier, { variation }]) => ({ identifier, variation }))
      }
    } as unknown as Instruction
  }
}
