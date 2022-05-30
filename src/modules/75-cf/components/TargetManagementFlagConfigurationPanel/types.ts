/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { WeightedVariation } from 'services/cf'

export enum STATUS {
  noFlags,
  noSearchResults,
  noFlagsRemaining,
  ok,
  submitting
}

export interface TargetManagementFlagConfigurationPanelFormRow {
  variation: string
  percentageRollout?: {
    variations: WeightedVariation[]
  }
}

export interface TargetManagementFlagConfigurationPanelFormValues {
  flags: Record<string, TargetManagementFlagConfigurationPanelFormRow>
}
