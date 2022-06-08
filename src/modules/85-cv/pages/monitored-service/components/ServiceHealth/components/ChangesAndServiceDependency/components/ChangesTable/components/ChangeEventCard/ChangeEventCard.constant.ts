/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export enum VerificationStatus {
  IGNORED = 'IGNORED',
  NOT_STARTED = 'NOT_STARTED',
  VERIFICATION_PASSED = 'VERIFICATION_PASSED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  ERROR = 'ERROR',
  ABORTED = 'ABORTED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export const TWO_HOURS_IN_MILLISECONDS = 1000 * 60 * 60 * 2

export const StageStatusMapper = {
  IgnoreFailed: 'Failed'
}
