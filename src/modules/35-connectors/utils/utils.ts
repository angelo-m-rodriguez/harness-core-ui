import type { UseGovernanceModalProps } from '@governance/hooks/useGovernanceMetaDataModal'

export const connectorGovernanceModalProps = (): UseGovernanceModalProps => {
  return {
    errorHeaderMsg: 'connectors.policyEvaluations.failedToSave',
    warningHeaderMsg: 'connectors.policyEvaluations.warning',
    considerWarningAsError: false
  }
}
