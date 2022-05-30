/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, omit, pick } from 'lodash-es'
import { PERCENTAGE_ROLLOUT_VALUE } from '@cf/constants'
import type { TargetManagementFlagConfigurationPanelFormRow } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import {
  getAddFlagsInstruction,
  getFlagSettingsInstructions,
  getRemovedFlagIdentifiers,
  getRemoveFlagsInstruction,
  getRuleId,
  getUpdatedFlags,
  getUpdateFlagsInstruction,
  getVariationOrServe
} from '../flagSettingsInstructions'
import {
  mockFeatures,
  mockFlagSettingsFormDataValues,
  mockSegmentFlags,
  mockTargetGroup
} from '../../../__tests__/mocks'

describe('flagSettingsInstructions', () => {
  describe('getFlagSettingsInstructions', () => {
    test('it should return no instructions when nothing changed', async () => {
      expect(
        getFlagSettingsInstructions(
          mockTargetGroup.identifier,
          mockFlagSettingsFormDataValues,
          mockFlagSettingsFormDataValues,
          mockFeatures
        )
      ).toEqual([])
    })

    test('it should return only a removeRule instruction when a flag is removed', async () => {
      const flags = omit(mockFlagSettingsFormDataValues.flags, 'f1')

      const response = getFlagSettingsInstructions(
        mockTargetGroup.identifier,
        { flags },
        mockFlagSettingsFormDataValues,
        mockFeatures
      )

      expect(response).not.toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'addRule' })]))
      expect(response).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'removeRule' })]))
    })

    test('it should return only an addRule instruction when a flag is changed', async () => {
      const flags = cloneDeep(mockFlagSettingsFormDataValues.flags)
      flags.f1.variation = 'v2'

      const response = getFlagSettingsInstructions(
        mockTargetGroup.identifier,
        { flags },
        mockFlagSettingsFormDataValues,
        mockFeatures
      )

      expect(response).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'addRule' })]))
      expect(response).not.toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'removeRule' })]))
    })

    test('it should return both removeRule and addRule instructions when a flag is removed and another changed', async () => {
      const flags = omit(cloneDeep(mockFlagSettingsFormDataValues.flags), 'f1')
      flags.f2.variation = 'v1'

      const response = getFlagSettingsInstructions(
        mockTargetGroup.identifier,
        { flags },
        mockFlagSettingsFormDataValues,
        mockFeatures
      )

      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: 'addRule' }),
          expect.objectContaining({ kind: 'removeRule' })
        ])
      )
    })
  })

  describe('getRemovedFlagIdentifiers', () => {
    test('it should return an array with the identifiers of removed flags', async () => {
      const removedFlags = ['f2', 'f4']
      const flags = omit(mockFlagSettingsFormDataValues.flags, ...removedFlags)

      expect(getRemovedFlagIdentifiers(flags, mockFlagSettingsFormDataValues.flags)).toEqual(removedFlags)
    })

    test('it should return an empty array when no flags have been removed', async () => {
      expect(
        getRemovedFlagIdentifiers(mockFlagSettingsFormDataValues.flags, mockFlagSettingsFormDataValues.flags)
      ).toEqual([])
    })
  })

  describe('getUpdatedFlags', () => {
    test('it should return an object with the rows of changed flags', async () => {
      const flags = cloneDeep(mockFlagSettingsFormDataValues.flags)
      flags.f2.variation = 'v1'
      flags.f4.variation = 'v1'

      expect(getUpdatedFlags(flags, mockFlagSettingsFormDataValues.flags)).toEqual({
        f2: { variation: 'v1' },
        f4: { variation: 'v1' }
      })
    })

    test('it should return an empty object when no flags have been changed', async () => {
      expect(getUpdatedFlags(mockFlagSettingsFormDataValues.flags, mockFlagSettingsFormDataValues.flags)).toEqual({})
    })
  })

  describe('getRemoveFlagsInstruction', () => {
    test('it should return the appropriate instruction to remove a single flag', async () => {
      const flagToRemove = mockFeatures[0]

      expect(getRemoveFlagsInstruction([flagToRemove.identifier], mockFeatures, mockTargetGroup.identifier)).toEqual({
        kind: 'removeRule',
        parameters: {
          features: [{ ruleID: flagToRemove.envProperties?.rules?.[0].ruleId }]
        }
      })
    })

    test('it should return the appropriate instruction to remove multiple flags', async () => {
      const flagsToRemove = [mockFeatures[0], mockFeatures[1]]

      expect(
        getRemoveFlagsInstruction(
          [flagsToRemove[0].identifier, flagsToRemove[1].identifier],
          mockFeatures,
          mockTargetGroup.identifier
        )
      ).toEqual({
        kind: 'removeRule',
        parameters: {
          features: [
            { ruleID: flagsToRemove[0].envProperties?.rules?.[0].ruleId },
            { ruleID: flagsToRemove[1].envProperties?.rules?.[0].ruleId }
          ]
        }
      })
    })
  })

  describe('getUpdateFlagsInstruction', () => {
    test('it should return the appropriate instruction to update a single flag', async () => {
      const flagToUpdate = cloneDeep(mockFlagSettingsFormDataValues.flags.f1)
      flagToUpdate.variation = 'v2'

      expect(getUpdateFlagsInstruction({ f1: flagToUpdate }, mockFeatures, mockTargetGroup.identifier)).toEqual({
        kind: 'addRule',
        parameters: {
          features: [
            {
              identifier: 'f1',
              variation: flagToUpdate.variation,
              ruleID: mockFeatures[0].envProperties?.rules?.[0].ruleId
            }
          ]
        }
      })
    })

    test('it should return the appropriate instruction to update multiple flags', async () => {
      const flagsToUpdate = {
        f1: cloneDeep(mockFlagSettingsFormDataValues.flags.f1),
        f2: cloneDeep(mockFlagSettingsFormDataValues.flags.f2)
      }
      flagsToUpdate.f1.variation = 'v2'
      flagsToUpdate.f2.variation = 'v1'

      expect(getUpdateFlagsInstruction(flagsToUpdate, mockFeatures, mockTargetGroup.identifier)).toEqual({
        kind: 'addRule',
        parameters: {
          features: [
            {
              identifier: 'f1',
              variation: flagsToUpdate.f1.variation,
              ruleID: mockFeatures[0].envProperties?.rules?.[0].ruleId
            },
            {
              identifier: 'f2',
              variation: flagsToUpdate.f2.variation,
              ruleID: mockFeatures[1].envProperties?.rules?.[0].ruleId
            }
          ]
        }
      })
    })
  })

  describe('getAddFlagsInstruction', () => {
    test('it should return the appropriate instruction to add a single flag', async () => {
      const flagToAdd = pick(mockSegmentFlags[0], 'identifier', 'variation')
      flagToAdd.variation = 'v2'

      expect(getAddFlagsInstruction([flagToAdd])).toEqual({
        kind: 'addRule',
        parameters: {
          features: [
            {
              identifier: flagToAdd.identifier,
              variation: flagToAdd.variation
            }
          ]
        }
      })
    })

    test('it should return the appropriate instruction to add multiple flags', async () => {
      const flagsToAdd = [
        pick(mockSegmentFlags[0], 'identifier', 'variation'),
        pick(mockSegmentFlags[1], 'identifier', 'variation')
      ]
      flagsToAdd[0].variation = 'v2'
      flagsToAdd[1].variation = 'v1'

      expect(getAddFlagsInstruction(flagsToAdd)).toEqual({
        kind: 'addRule',
        parameters: {
          features: [
            {
              identifier: flagsToAdd[0].identifier,
              variation: flagsToAdd[0].variation
            },
            {
              identifier: flagsToAdd[1].identifier,
              variation: flagsToAdd[1].variation
            }
          ]
        }
      })
    })
  })

  describe('getVariationOrServe', () => {
    test('it should return a serve object if the variation is Percentage Rollout', async () => {
      const rowValues: TargetManagementFlagConfigurationPanelFormRow = {
        variation: PERCENTAGE_ROLLOUT_VALUE,
        percentageRollout: {
          variations: [
            { variation: 'var1', weight: 60 },
            { variation: 'var2', weight: 40 }
          ]
        }
      }

      expect(getVariationOrServe(rowValues)).toEqual({
        serve: {
          distribution: {
            bucketBy: 'identifier',
            variations: [
              { variation: 'var1', weight: 60 },
              { variation: 'var2', weight: 40 }
            ]
          }
        }
      })
    })

    test('it should return variation object if the variation is not Percentage Rollout', async () => {
      const rowValues: TargetManagementFlagConfigurationPanelFormRow = {
        variation: 'var1'
      }

      expect(getVariationOrServe(rowValues)).toEqual({ variation: 'var1' })
    })
  })

  describe('getRuleId', () => {
    test('it should retrieve the first rule ID that matches the target group id', async () => {
      expect(getRuleId(mockTargetGroup.identifier, mockFeatures[0])).toEqual('ruleId1')
    })

    test('it should return undefined if no rule matches', async () => {
      expect(getRuleId('unknown', mockFeatures[0])).toBeUndefined()
    })
  })
})
