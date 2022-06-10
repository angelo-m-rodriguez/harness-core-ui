/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEqual } from 'lodash-es'
import type { Instruction } from '@cf/utils/instructions'
import type { Feature } from 'services/cf'
import patch from '../../utils/instructions'

export function getVariationInstructions(
  initialValues: Feature['variations'],
  values: Feature['variations']
): Instruction[] {
  return [
    ...getRemovedInstructions(initialValues, values),
    ...getAddedInstructions(initialValues, values),
    ...getUpdatedInstructions(initialValues, values)
  ]
}

export function getRemovedInstructions(
  initialValues: Feature['variations'],
  values: Feature['variations']
): Instruction[] {
  const newIds = values.map(({ identifier }) => identifier)
  return initialValues
    .filter(({ identifier }) => !newIds.includes(identifier))
    .map(({ identifier }) => patch.creators.deleteVariant(identifier))
}

export function getAddedInstructions(
  initialValues: Feature['variations'],
  values: Feature['variations']
): Instruction[] {
  const currentIds = initialValues.map(({ identifier }) => identifier)
  return values.filter(({ identifier }) => !currentIds.includes(identifier)).map(patch.creators.addVariation)
}

export function getUpdatedInstructions(
  initialValues: Feature['variations'],
  values: Feature['variations']
): Instruction[] {
  return values
    .filter(variation => {
      const initialVariation = initialValues.find(({ identifier }) => identifier === variation.identifier)
      return !!initialVariation && !isEqual(variation, initialVariation)
    })
    .map(patch.creators.updateVariation)
}
