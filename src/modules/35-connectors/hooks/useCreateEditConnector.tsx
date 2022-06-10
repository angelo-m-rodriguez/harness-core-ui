/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useState } from 'react'
import { omit, noop } from 'lodash-es'
import { shouldShowError } from '@wings-software/uicore'
import { useToaster } from '@common/exports'
import { UseSaveSuccessResponse, useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import {
  Connector,
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  CreateConnectorQueryParams,
  EntityGitDetails,
  useCreateConnector,
  useUpdateConnector
} from 'services/cd-ng'
import type { ConnectorCreateEditProps } from '@connectors/constants'
import { Entities } from '@common/interfaces/GitSyncInterface'
import { useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { doesGovernanceHasErrorOrWarning } from '@governance/utils'
export interface BuildPayloadProps {
  projectIdentifier?: string
  orgIdentifier?: string
  branch?: string
  repo?: string
}

interface UseCreateEditConnector {
  accountId: string
  isEditMode: boolean
  isGitSyncEnabled: boolean
  afterSuccessHandler: (data: UseSaveSuccessResponse) => void
  gitDetails?: EntityGitDetails
}
interface OnInitiateConnectorCreateEditProps<T> {
  buildPayload: (data: T & BuildPayloadProps) => Connector
  connectorFormData: T & BuildPayloadProps
  customHandleCreate?: (payload: ConnectorConfigDTO) => Promise<ConnectorInfoDTO | undefined>
  customHandleUpdate?: (payload: ConnectorConfigDTO) => Promise<ConnectorInfoDTO | undefined>
}

export default function useCreateEditConnector<T>(props: UseCreateEditConnector) {
  const { showError, showSuccess } = useToaster()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()

  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())
  const [connectorPayload, setConnectorPayload] = useState<Connector>({})
  const [connectorResponse, setConnectorResponse] = useState<UseSaveSuccessResponse>()
  const [connectorData, setConnectorData] = useState<T & BuildPayloadProps>({} as T & BuildPayloadProps)
  let gitDetails = props.gitDetails

  const { mutate: createConnector, loading: creating } = useCreateConnector({
    queryParams: { accountIdentifier: props.accountId }
  })
  const { mutate: updateConnector, loading: updating } = useUpdateConnector({
    queryParams: { accountIdentifier: props.accountId }
  })

  const handleGitSyncEnabled = (
    gitDetailsObject: EntityGitDetails | undefined,
    connectorFormData: T & BuildPayloadProps,
    payload: Connector
  ): void => {
    // Using git context set at 1st step while creating new connector
    if (!props.isEditMode) {
      gitDetails = { ...gitDetailsObject, branch: connectorFormData?.branch, repoIdentifier: connectorFormData?.repo }
    }
    openSaveToGitDialog({
      isEditing: props.isEditMode,
      resource: {
        type: Entities.CONNECTORS,
        name: payload.connector?.name || '',
        identifier: payload.connector?.identifier || '',
        gitDetails: { ...gitDetailsObject, branch: connectorFormData?.branch, repoIdentifier: connectorFormData?.repo }
      },
      payload
    })
  }

  const handleCreateOrEdit = async (
    connectorFormData: T & BuildPayloadProps,
    payload: ConnectorCreateEditProps,
    objectId?: EntityGitDetails['objectId']
  ): Promise<UseSaveSuccessResponse> => {
    const { gitData } = payload
    const data = payload.payload || connectorPayload
    let queryParams: CreateConnectorQueryParams = {}
    if (gitData) {
      queryParams = {
        accountIdentifier: props.accountId,
        ...omit(gitData, 'sourceBranch')
      }
      if (gitData.isNewBranch) {
        queryParams.baseBranch = connectorFormData?.branch
      }
    }

    const response = props.isEditMode
      ? await updateConnector(data, {
          queryParams: {
            ...queryParams,
            lastObjectId: objectId ?? gitDetails?.objectId
          }
        })
      : await createConnector(data, { queryParams: queryParams })
    setConnectorResponse(response)
    let { governanceMetaDataHasError, governanceMetaDataHasWarning } = doesGovernanceHasErrorOrWarning(
      response.data?.governanceMetadata
    )
    if (!opaFlagEnabled) {
      governanceMetaDataHasError = false
      governanceMetaDataHasWarning = false
    }
    const onSuccessGovernanceCall = () => {
      props.afterSuccessHandler(response)
    }
    if (opaFlagEnabled && response.data?.governanceMetadata) {
      conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, onSuccessGovernanceCall)
    }
    const returnVal: UseSaveSuccessResponse = {
      status: !governanceMetaDataHasError ? response.status : 'FAILURE',
      nextCallback: () => {
        if (!governanceMetaDataHasError && !governanceMetaDataHasWarning) {
          props.afterSuccessHandler(response)
        }
      },
      governanceMetaData: response.data?.governanceMetadata
    }
    return returnVal
  }

  const { openSaveToGitDialog } = useSaveToGitDialog<Connector>({
    onSuccess: (
      gitData: SaveToGitFormInterface,
      payload?: Connector,
      objectId?: string
    ): Promise<UseSaveSuccessResponse> =>
      handleCreateOrEdit(connectorData, { gitData, payload: payload || connectorPayload }, objectId),
    onClose: noop
  })

  return {
    connectorResponse,
    gitDetails,
    connectorPayload,
    loading: creating || updating,
    onInitiate: ({
      connectorFormData,
      buildPayload,
      customHandleCreate,
      customHandleUpdate
    }: OnInitiateConnectorCreateEditProps<T & BuildPayloadProps>) => {
      setConnectorData(connectorFormData)
      const payload = buildPayload(connectorFormData)
      setConnectorPayload(payload)
      if (props.isGitSyncEnabled) {
        handleGitSyncEnabled(gitDetails, connectorFormData, payload)
      } else {
        {
          if (customHandleUpdate || customHandleCreate) {
            props.isEditMode ? customHandleUpdate?.(payload) : customHandleCreate?.(payload)
          } else {
            handleCreateOrEdit(connectorFormData, { payload: payload }) /* Handling non-git flow */
              .then(res => {
                if (res.status === 'SUCCESS') {
                  props.isEditMode
                    ? showSuccess(getString('connectors.updatedSuccessfully'))
                    : showSuccess(getString('connectors.createdSuccessfully'))
                  res.nextCallback?.()
                }
              })
              .catch(e => {
                if (shouldShowError(e)) {
                  showError(getRBACErrorMessage(e))
                }
              })
          }
        }
      }
    }
  }
}
