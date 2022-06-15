/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useParams } from 'react-router-dom'
import React, { useState } from 'react'
import { useModalHook } from '@harness/use-modal'
import { Dialog } from '@harness/uicore'
import type { IDialogProps } from '@blueprintjs/core'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings, StringKeys } from 'framework/strings'
import type { GovernanceMetadata } from 'services/cd-ng'
import { EvaluationView } from '@governance/EvaluationView'
import { useModuleInfo } from '@common/hooks/useModuleInfo'

export interface UseConnectorGovernanceModalPayload {
  conditionallyOpenGovernanceErrorModal(
    governanceMetadata: GovernanceMetadata | undefined,
    onModalCloseWhenNoErrorInGovernanceData: () => void | undefined
  ): void
}
export interface UseGovernanceModalProps {
  // Will consider warnings as error  and does not process onSuccess method
  considerWarningAsError: boolean
  warningHeaderMsg: StringKeys
  errorHeaderMsg: StringKeys
}
export const useGovernanceMetaDataModal = ({
  considerWarningAsError,
  warningHeaderMsg,
  errorHeaderMsg
}: UseGovernanceModalProps): UseConnectorGovernanceModalPayload => {
  const { getString } = useStrings()

  const { accountId: accountIdentifier } = useParams<AccountPathProps>()
  const [governanceMetadata, setGovernanceMetadata] = useState<GovernanceMetadata>()
  const [onModalCloseWhenNoErrorInGovernanceDataCall, setonModalCloseWhenNoErrorInGovernanceDataCall] =
    useState<() => void>()
  const { module } = useModuleInfo()
  const [showGovernanceErrorModal, hideGovernanceErrorModal] = useModalHook(() => {
    const confirmDialogProps: IDialogProps = {
      isOpen: true,
      autoFocus: true,
      canEscapeKeyClose: true,
      canOutsideClickClose: true,
      enforceFocus: false,
      style: { width: '70%', height: 600 }
    }
    return (
      <Dialog
        {...confirmDialogProps}
        onClose={() => {
          hideGovernanceErrorModal()
          if (
            governanceMetadata &&
            ((governanceMetadata.status === 'warning' && !considerWarningAsError) ||
              governanceMetadata.status === 'pass') &&
            onModalCloseWhenNoErrorInGovernanceDataCall
          ) {
            onModalCloseWhenNoErrorInGovernanceDataCall()
          }
        }}
      >
        <EvaluationView
          module={module}
          accountId={accountIdentifier}
          metadata={governanceMetadata}
          headingErrorMessage={getString(errorHeaderMsg)}
          headingWarningMessage={getString(warningHeaderMsg)}
        />
      </Dialog>
    )
  }, [governanceMetadata, onModalCloseWhenNoErrorInGovernanceDataCall])

  const conditionallyOpenGovernanceErrorModal = (
    governanceMetadataLocal: GovernanceMetadata | undefined,
    onModalCloseWhenNoErrorInGovernanceData: () => void
  ) => {
    if (governanceMetadataLocal) {
      setGovernanceMetadata(governanceMetadataLocal)
      if (governanceMetadataLocal?.status === 'error' || governanceMetadataLocal?.status === 'warning') {
        setonModalCloseWhenNoErrorInGovernanceDataCall(() => onModalCloseWhenNoErrorInGovernanceData)
        showGovernanceErrorModal()
      } // assuming all other cases governancemetadata status to be pass
      else {
        onModalCloseWhenNoErrorInGovernanceData()
      }
    } else {
      onModalCloseWhenNoErrorInGovernanceData()
    }
  }
  return {
    conditionallyOpenGovernanceErrorModal
  }
}
