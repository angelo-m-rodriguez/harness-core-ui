/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export enum AddTargetToTargetGroupsDialogStatus {
  error,
  loading,
  initialLoading,
  noTargetGroups,
  noSearchResults,
  ok,
  submitting
}

export enum FlagSettingsStatus {
  error,
  loading,
  initialLoading,
  noFlags,
  noSearchResults,
  ok,
  submitting
}

export interface AddTargetToTargetGroupsDialogFormValues {
  targetGroups: Record<string, string>
}

export interface TargetFlagSettingsFormValues {
  flags: Record<string, { variation: string }>
}
