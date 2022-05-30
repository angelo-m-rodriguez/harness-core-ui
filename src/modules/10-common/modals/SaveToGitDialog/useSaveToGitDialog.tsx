/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, getErrorInfoFromErrorObject } from '@wings-software/uicore'
import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { defaultTo, noop } from 'lodash-es'
import { useModalHook } from '@harness/use-modal'
import { Entities, SCHEMA_VALIDATION_FAILED } from '@common/interfaces/GitSyncInterface'
import SaveToGitForm, {
  GitResourceInterface,
  SaveToGitFormInterface
} from '@common/components/SaveToGitForm/SaveToGitForm'
import SaveToGitFormV2, { SaveToGitFormV2Interface } from '@common/components/SaveToGitFormV2/SaveToGitFormV2'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { getEntityNameFromType } from '@common/utils/StringUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { StoreType } from '@common/constants/GitSyncTypes'
import { EntityGitDetails, ResponseMessage, useCreatePR, useCreatePRV2 } from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'
import type { GovernanceMetadata } from 'services/cd-ng'
import { ProgressOverlay, StepStatus } from '../ProgressOverlay/ProgressOverlay'
import { useGitDiffEditorDialog } from '../GitDiffEditor/useGitDiffEditorDialog'
import css from './useSaveToGitDialog.module.scss'

export interface UseSaveSuccessResponse {
  status?: 'SUCCESS' | 'FAILURE' | 'ERROR'
  nextCallback?: () => void
  governanceMetaData?: GovernanceMetadata
}

export interface UseSaveToGitDialogProps<T> {
  onSuccess?: (
    data: SaveToGitFormInterface | SaveToGitFormV2Interface,
    payload?: T,
    objectId?: EntityGitDetails['objectId'],
    isEdit?: boolean
  ) => Promise<UseSaveSuccessResponse>
  onClose?: () => void
  onProgessOverlayClose?: () => void
}

export interface OpenSaveToGitDialogValue<T> {
  isEditing: boolean
  resource: GitResourceInterface
  payload: T
  _modalProps?: IDialogProps
}

export interface UseSaveToGitDialogReturn<T> {
  openSaveToGitDialog: (args: OpenSaveToGitDialogValue<T>) => void
  hideSaveToGitDialog: () => void
}

export function useSaveToGitDialog<T = Record<string, string>>(
  props: UseSaveToGitDialogProps<T>
): UseSaveToGitDialogReturn<T> {
  const [isEditMode, setIsEditMode] = useState(false)
  const [payloadData, setPayloadData] = useState<T>()
  const [resource, setResource] = useState<GitResourceInterface>({
    type: Entities.CONNECTORS,
    name: '',
    identifier: ''
  })
  const { getString } = useStrings()
  const [modalProps, setModalProps] = useState<IDialogProps>({
    isOpen: true,
    enforceFocus: false,
    style: {
      width: 720,
      minHeight: 540,
      borderLeft: 0,
      paddingBottom: 0,
      position: 'relative',
      overflow: 'hidden'
    }
  })
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  /* Progress dialog states */
  const [prCreateStatus, setPRCreateStatus] = useState<StepStatus>()
  const [prMetaData, setPRMetaData] =
    useState<Pick<SaveToGitFormInterface, 'branch' | 'targetBranch' | 'isNewBranch'>>()
  const [nextCallback, setNextCallback] = useState<UseSaveSuccessResponse['nextCallback']>()
  /* TODO Don't see proper types for this new errors format, replace Record<string, any> with more stricter type when available */
  const [error, setError] = useState<Record<string, any>>({})
  const [createUpdateStatus, setCreateUpdateStatus] = useState<StepStatus>()
  const { mutate: createPullRequest, loading: creatingPR } = useCreatePR({})
  const { mutate: createPullRequestV2, loading: creatingPRV2 } = useCreatePRV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  /* Stages for an entity updated/created and/or saved to git */
  const entityCreateUpdateStage = {
    status: createUpdateStatus,
    intermediateLabel: (
      <String
        stringID={isEditMode ? 'common.updating' : 'common.creating'}
        vars={{ name: resource.name, entity: getEntityNameFromType(resource.type) }}
      />
    ),
    finalLabel: getErrorInfoFromErrorObject(error),
    error: error?.data
  }
  const fromBranch = defaultTo(prMetaData?.branch, '')
  const toBranch = defaultTo(prMetaData?.targetBranch, '')
  const setupBranchStage = {
    status: createUpdateStatus,
    intermediateLabel: (
      <String
        stringID="common.gitSync.settingUpNewBranch"
        vars={{
          branch: fromBranch
        }}
        useRichText
      />
    )
  }
  const pushingChangesToBranch = {
    status: createUpdateStatus,
    intermediateLabel: (
      <String
        stringID="common.gitSync.pushingChangestoBranch"
        vars={{
          branch: fromBranch
        }}
        useRichText
      />
    )
  }
  const createPRStage = {
    status: prCreateStatus,
    intermediateLabel: (
      <String
        stringID="common.gitSync.creatingPR"
        vars={{
          fromBranch,
          toBranch
        }}
        useRichText
      />
    ),
    finalLabel: getString('common.gitSync.unableToCreatePR')
  }

  const handleCreateUpdateSuccess = (status?: string): void => {
    if (status === 'SUCCESS') {
      nextCallback?.()
    }
  }

  const handleCreateUpdateError = (e: any, data: SaveToGitFormInterface | SaveToGitFormV2Interface): void => {
    if (e.code === SCHEMA_VALIDATION_FAILED) {
      hideCreateUpdateModal()
      return
    }
    setError(e)
    setCreateUpdateStatus('ERROR')
    if (data?.createPr) {
      setPRCreateStatus('ABORTED')
    }
    if (
      ((e?.responseMessages as ResponseMessage[]) || (e.data?.responseMessages as ResponseMessage[]) || [])?.findIndex(
        (mssg: ResponseMessage) => mssg.code === 'SCM_CONFLICT_ERROR'
      ) !== -1
    ) {
      const conflictCommitId = defaultTo(e?.metadata?.conflictCommitId, e?.data?.metadata?.conflictCommitId)

      openGitDiffDialog(payloadData, {
        ...(data as SaveToGitFormInterface),
        resolvedConflictCommitId: defaultTo(conflictCommitId, '')
      })
    }
  }

  // Dialogs
  // Modal to show when a git conflict occurs
  const { openGitDiffDialog } = useGitDiffEditorDialog({
    onSuccess: (payload, objectId: EntityGitDetails['objectId'], gitData?: SaveToGitFormInterface): void => {
      try {
        if (gitData) {
          handleSuccess(gitData, payload as T, objectId)
        }
      } catch (e) {
        //ignore error
      }
    },
    onClose: noop
  })

  // Modal to show while creating/updating an entity and creating a PR
  const [showCreateUpdateWithPRCreationModal, hideCreateUpdateWithPRCreationModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        className={Classes.DIALOG}
        style={{
          minWidth: 600,
          paddingBottom: 0,
          maxHeight: 500
        }}
        enforceFocus={false}
      >
        <ProgressOverlay
          preFirstStage={prMetaData?.isNewBranch ? setupBranchStage : undefined}
          firstStage={entityCreateUpdateStage}
          postFirstStage={pushingChangesToBranch}
          secondStage={createPRStage}
          onClose={() => {
            hideCreateUpdateWithPRCreationModal()
            handleCreateUpdateSuccess(createUpdateStatus)
            props.onProgessOverlayClose?.()
          }}
        />
      </Dialog>
    )
  }, [creatingPR, creatingPRV2, createUpdateStatus, error, prCreateStatus, prMetaData])

  // Modal to show while only creating/updating an entity
  const [showCreateUpdateModal, hideCreateUpdateModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        className={Classes.DIALOG}
        style={{
          minWidth: 600,
          paddingBottom: 0,
          maxHeight: 500
        }}
      >
        <ProgressOverlay
          firstStage={entityCreateUpdateStage}
          postFirstStage={pushingChangesToBranch}
          onClose={() => {
            hideCreateUpdateModal()
            handleCreateUpdateSuccess(createUpdateStatus)
            props.onProgessOverlayClose?.()
          }}
        />
      </Dialog>
    )
  }, [createUpdateStatus, error])

  const createPR = (data: SaveToGitFormInterface & SaveToGitFormV2Interface): void => {
    const params =
      resource?.storeMetadata?.storeType === StoreType.REMOTE
        ? {
            orgIdentifier,
            projectIdentifier,
            connectorRef: resource?.storeMetadata?.connectorRef,
            repoName: resource?.gitDetails?.repoName,
            sourceBranch: defaultTo(data?.branch, ''),
            targetBranch: defaultTo(data?.targetBranch, ''),
            sourceBranchName: defaultTo(data?.branch, ''),
            targetBranchName: defaultTo(data?.targetBranch, ''),
            title: defaultTo(data?.commitMsg, ''),
            yamlGitConfigRef: defaultTo(data?.repoIdentifier, '')
          }
        : {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            sourceBranch: defaultTo(data?.branch, ''),
            targetBranch: defaultTo(data?.targetBranch, ''),
            title: defaultTo(data?.commitMsg, ''),
            useUserFromToken: true,
            yamlGitConfigRef: defaultTo(data?.repoIdentifier, '')
          }

    const cretePrPromise =
      resource?.storeMetadata?.storeType === StoreType.REMOTE ? createPullRequestV2(params) : createPullRequest(params)

    cretePrPromise
      .then(_response => {
        setPRCreateStatus(_response?.status)
      })
      .catch(() => setPRCreateStatus('ERROR'))
  }

  const abortPR = (errorResponse: UseSaveSuccessResponse, data: SaveToGitFormInterface): void => {
    if (data?.createPr) {
      setPRCreateStatus('ABORTED')
    }
    throw errorResponse
  }

  const createPRHandler = async (data: SaveToGitFormInterface, response: UseSaveSuccessResponse): Promise<void> => {
    setNextCallback(() => response?.nextCallback)
    setCreateUpdateStatus(response.status)

    // if entity creation/update succeeds, raise a PR, if specified
    if (response.status === 'SUCCESS' && data?.createPr) {
      createPR(data)
    } else if (data?.createPr) {
      // if entity creation/update fails, abort PR creation
      abortPR(response, data)
    }
  }

  const createPRHandlerV2 = async (data: SaveToGitFormV2Interface, response: UseSaveSuccessResponse): Promise<void> => {
    setNextCallback(() => response?.nextCallback)
    setCreateUpdateStatus(response.status)

    // if entity creation/update succeeds, raise a PR, if specified
    if (response.status === 'SUCCESS' && data?.createPr) {
      createPR(data)
    } else if (data?.createPr) {
      // if entity creation/update fails, abort PR creation
      abortPR(response, data)
    }
  }

  const handleSuccess = (data: SaveToGitFormInterface, diffData?: T, objectId?: EntityGitDetails['objectId']): void => {
    setPRMetaData({ branch: data?.branch, targetBranch: data?.targetBranch, isNewBranch: data?.isNewBranch })
    setCreateUpdateStatus('IN_PROGRESS')
    if (data?.createPr) {
      setPRCreateStatus('IN_PROGRESS')
      showCreateUpdateWithPRCreationModal()
    } else {
      showCreateUpdateModal()
    }
    props
      .onSuccess?.(data, diffData, objectId, isEditMode)
      .then(async response => {
        createPRHandler(data, response)
      })
      .catch(e => {
        handleCreateUpdateError(e, data)
      })
  }

  const handleSuccessV2 = (
    data: SaveToGitFormV2Interface,
    diffData?: T,
    objectId?: EntityGitDetails['objectId']
  ): void => {
    setPRMetaData({ branch: data?.branch, targetBranch: data?.targetBranch, isNewBranch: data?.isNewBranch })
    setCreateUpdateStatus('IN_PROGRESS')
    if (data?.createPr) {
      setPRCreateStatus('IN_PROGRESS')
      showCreateUpdateWithPRCreationModal()
    } else {
      showCreateUpdateModal()
    }
    props
      .onSuccess?.(data, diffData, objectId, isEditMode)
      .then(async response => {
        createPRHandlerV2(data, response)
      })
      .catch(e => {
        handleCreateUpdateError(e, data)
      })
  }

  const [showModal, hideModal] = useModalHook(() => {
    const closeHandler = (): void => {
      props.onClose?.()
      hideModal()
    }
    return (
      <Dialog className={css.gitDialog} {...modalProps}>
        {resource?.storeMetadata?.storeType === StoreType.REMOTE ? (
          <SaveToGitFormV2
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
            isEditing={isEditMode}
            resource={resource}
            onSuccess={data => {
              handleSuccessV2(data, payloadData, resource.gitDetails?.objectId)
              hideModal()
            }}
            onClose={closeHandler}
          />
        ) : (
          <GitSyncStoreProvider>
            <SaveToGitForm
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              isEditing={isEditMode}
              resource={resource}
              onSuccess={data => {
                handleSuccess(data, payloadData, resource.gitDetails?.objectId)
                hideModal()
              }}
              onClose={closeHandler}
            />
          </GitSyncStoreProvider>
        )}
        <Button minimal icon="cross" iconProps={{ size: 18 }} className={css.crossIcon} onClick={closeHandler} />
      </Dialog>
    )
  }, [isEditMode, resource])

  return {
    openSaveToGitDialog: ({ isEditing, resource: resourceData, _modalProps, payload }: OpenSaveToGitDialogValue<T>) => {
      setIsEditMode(isEditing)
      setPayloadData(payload)
      setResource(resourceData)
      setModalProps(defaultTo(_modalProps, modalProps))
      showModal()
    },
    hideSaveToGitDialog: hideModal
  }
}
