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
