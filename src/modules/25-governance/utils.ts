/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { GovernanceMetadata } from 'services/cd-ng'

interface DoesGovernanceMetaDataHasErrorOrWarningRtn {
  governanceMetaDataHasError: boolean
  governanceMetaDataHasWarning: boolean
}
export const doesGovernanceHasErrorOrWarning = (
  governanceMetadata: GovernanceMetadata | undefined
): DoesGovernanceMetaDataHasErrorOrWarningRtn => {
  let governanceMetaDataHasWarning = false
  let governanceMetaDataHasError = false
  if (governanceMetadata && governanceMetadata?.status === 'error') {
    governanceMetaDataHasError = true
  }
  if (governanceMetadata && governanceMetadata?.status === 'warning') {
    governanceMetaDataHasWarning = true
  }
  return { governanceMetaDataHasError, governanceMetaDataHasWarning }
}
