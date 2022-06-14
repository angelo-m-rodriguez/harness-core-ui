/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  VisualYamlSelectedView as SelectedView,
  useToaster,
  SplitButton,
  SplitButtonOption,
  PopoverProps
} from '@wings-software/uicore'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, noop, omit } from 'lodash-es'
import { parse } from 'yaml'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useFeature } from '@common/hooks/useFeatures'
import { savePipeline, usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { UseSaveSuccessResponse, useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import { DefaultNewPipelineId } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { PipelineActions } from '@common/constants/TrackingConstants'
import { validateCICodebaseConfiguration } from '@pipeline/components/PipelineStudio/StepUtil'
import { useQueryParams } from '@common/hooks'
import type {
  GitQueryParams,
  PathFn,
  PipelinePathProps,
  PipelineStudioQueryParams,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useSaveAsTemplate } from '@pipeline/components/PipelineStudio/SaveTemplateButton/useSaveAsTemplate'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { PipelineInfoConfig } from 'services/cd-ng'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { GovernanceMetadata } from 'services/pipeline-ng'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import type { AccessControlCheckError } from 'services/rbac'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { EvaluationModal } from '@governance/EvaluationModal'
import type { SaveToGitFormV2Interface } from '@common/components/SaveToGitFormV2/SaveToGitFormV2'
import { SCHEMA_VALIDATION_FAILED } from '@common/interfaces/GitSyncInterface'
import usePipelineErrors from '../PipelineCanvas/PipelineErrors/usePipelineErrors'

export interface SavePipelinePopoverProps extends PopoverProps {
  toPipelineStudio: PathFn<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>
}

interface SavePipelineObj {
  pipeline: PipelineInfoConfig
}

export function SavePipelinePopover({ toPipelineStudio }: SavePipelinePopoverProps): React.ReactElement {
  const { isGitSyncEnabled, isGitSimplificationEnabled } = useAppStore()

  const {
    state: { pipeline, yamlHandler, storeMetadata, gitDetails, isUpdated },
    deletePipelineCache,
    fetchPipeline,
    view,
    setSchemaErrorView,
    isReadonly
  } = usePipelineContext()
  const [loading, setLoading] = React.useState<boolean>()
  const { branch, repoName, connectorRef, storeType, repoIdentifier } = useQueryParams<GitQueryParams>()
  const { trackEvent } = useTelemetry()
  const { showSuccess, showError, clear } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const {
    OPA_PIPELINE_GOVERNANCE,
    NG_TEMPLATES: templatesFeatureFlagEnabled,
    NG_PIPELINE_TEMPLATE: pipelineTemplatesFeatureFlagEnabled
  } = useFeatureFlags()
  const history = useHistory()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, module } =
    useParams<PipelineType<PipelinePathProps>>()
  const isYaml = view === SelectedView.YAML
  const [governanceMetadata, setGovernanceMetadata] = React.useState<GovernanceMetadata>()

  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE

  const [showOPAErrorModal, closeOPAErrorModal] = useModalHook(
    () => (
      <EvaluationModal
        accountId={accountId}
        metadata={governanceMetadata}
        headingErrorMessage={getString('pipeline.policyEvaluations.failedToSavePipeline')}
        closeModal={() => {
          closeOPAErrorModal()
          const { status, newPipelineId, updatedGitDetails } = governanceMetadata as GovernanceMetadata
          if (status === 'warning') {
            publishPipeline(newPipelineId, updatedGitDetails)
          }
        }}
      />
    ),
    [governanceMetadata]
  )
  const { enabled: templatesFeatureEnabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.TEMPLATE_SERVICE
    }
  })

  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.TEMPLATE
    },
    permissions: [PermissionIdentifier.EDIT_TEMPLATE]
  })

  const isTemplatesEnabled =
    templatesFeatureEnabled &&
    templatesFeatureFlagEnabled &&
    pipelineTemplatesFeatureFlagEnabled &&
    canEdit &&
    !pipeline?.template

  const isSaveEnabled = !isReadonly && isUpdated

  const { save } = useSaveAsTemplate({ data: pipeline, type: 'Pipeline', fireSuccessEvent: true })
  const { openPipelineErrorsModal } = usePipelineErrors()
  const navigateToLocation = (newPipelineId: string, updatedGitDetails?: SaveToGitFormInterface): void => {
    history.replace(
      toPipelineStudio({
        projectIdentifier,
        orgIdentifier,
        pipelineIdentifier: newPipelineId,
        accountId,
        module,
        repoIdentifier: defaultTo(updatedGitDetails?.repoIdentifier, repoIdentifier),
        branch: updatedGitDetails?.branch,
        ...(isPipelineRemote
          ? {
              repoName: updatedGitDetails?.repoName || repoName,
              connectorRef,
              storeType
            }
          : {})
      })
    )
  }

  const publishPipeline = async (newPipelineId: string, updatedGitDetails?: SaveToGitFormInterface) => {
    if (pipelineIdentifier === DefaultNewPipelineId) {
      await deletePipelineCache(gitDetails)

      showSuccess(getString('pipelines-studio.publishPipeline'))

      navigateToLocation(newPipelineId, updatedGitDetails)
      // note: without setTimeout does not redirect properly after save
      await fetchPipeline({ forceFetch: true, forceUpdate: true, newPipelineId })
    } else if (!updatedGitDetails || updatedGitDetails?.isNewBranch === false) {
      await fetchPipeline({ forceFetch: true, forceUpdate: true })
    }
    if (updatedGitDetails?.isNewBranch) {
      navigateToLocation(newPipelineId, updatedGitDetails)
      location.reload()
    }
  }

  const saveAndPublishPipeline = async (
    latestPipeline: PipelineInfoConfig,
    currStoreMetadata?: StoreMetadata,
    updatedGitDetails?: SaveToGitFormInterface,
    lastObject?: { lastObjectId?: string; lastCommitId?: string }
  ): Promise<UseSaveSuccessResponse> => {
    setLoading(true)
    setSchemaErrorView(false)
    const isEdit = pipelineIdentifier !== DefaultNewPipelineId
    const response = await savePipeline(
      {
        accountIdentifier: accountId,
        projectIdentifier,
        orgIdentifier,
        ...(currStoreMetadata?.storeType ? { storeType: currStoreMetadata?.storeType } : {}),
        ...(currStoreMetadata?.storeType === 'REMOTE' ? { connectorRef: currStoreMetadata?.connectorRef } : {}),
        ...(updatedGitDetails ?? {}),
        ...(lastObject ?? {}),
        ...(updatedGitDetails && currStoreMetadata?.storeType !== 'REMOTE' && updatedGitDetails?.isNewBranch
          ? { baseBranch: branch }
          : {})
      },
      omit(latestPipeline, 'repo', 'branch'),
      isEdit,
      !!OPA_PIPELINE_GOVERNANCE
    )
    setLoading(false)
    const newPipelineId = latestPipeline?.identifier

    if (response && response.status === 'SUCCESS') {
      const governanceData: GovernanceMetadata | undefined = get(response, 'data.governanceMetadata')
      setGovernanceMetadata({ ...governanceData, newPipelineId, updatedGitDetails })
      if (OPA_PIPELINE_GOVERNANCE && (governanceData?.status === 'error' || governanceData?.status === 'warning')) {
        showOPAErrorModal()
      }
      // Handling cache and page navigation only when Governance is disabled, or Governance Evaluation is successful
      // Otherwise, keep current pipeline editing states, and show Governance evaluation error
      if (governanceData?.status !== 'error' && governanceData?.status !== 'warning') {
        await publishPipeline(newPipelineId, updatedGitDetails)
      }
      if (isEdit) {
        trackEvent(isYaml ? PipelineActions.PipelineUpdatedViaYAML : PipelineActions.PipelineUpdatedViaVisual, {})
      } else {
        trackEvent(isYaml ? PipelineActions.PipelineCreatedViaYAML : PipelineActions.PipelineCreatedViaVisual, {})
      }
    } else {
      clear()
      setSchemaErrorView(true)
      if ((response as any)?.metadata?.schemaErrors?.length) {
        openPipelineErrorsModal(response)
        if (isGitSyncEnabled || currStoreMetadata?.storeType === StoreType.REMOTE) {
          // isGitSyncEnabled true
          throw { code: SCHEMA_VALIDATION_FAILED }
        }
      } else if (isGitSyncEnabled || currStoreMetadata?.storeType === StoreType.REMOTE) {
        throw response
      } else {
        showError(
          getRBACErrorMessage({ data: response as AccessControlCheckError }) || getString('errorWhileSaving'),
          undefined,
          'pipeline.save.pipeline.error'
        )
      }
    }
    return { status: response?.status }
  }

  const saveAngPublishWithGitInfo = async (
    updatedGitDetails: SaveToGitFormInterface | SaveToGitFormV2Interface,
    payload?: SavePipelineObj,
    objectId?: string,
    commitId?: string
  ): Promise<UseSaveSuccessResponse> => {
    let latestPipeline: PipelineInfoConfig = payload?.pipeline || pipeline

    if (isYaml && yamlHandler) {
      try {
        latestPipeline = payload?.pipeline || (parse(yamlHandler.getLatestYaml()).pipeline as PipelineInfoConfig)
      } /* istanbul ignore next */ catch (err) {
        showError(err.message || err, undefined, 'pipeline.save.gitinfo.error')
      }
    }

    const response = await saveAndPublishPipeline(
      latestPipeline,
      storeMetadata,
      {
        ...updatedGitDetails,
        repoName: gitDetails.repoName,
        filePath: isGitSyncEnabled ? updatedGitDetails.filePath : defaultTo(gitDetails.filePath, '')
      },
      pipelineIdentifier !== DefaultNewPipelineId ? { lastObjectId: objectId, lastCommitId: commitId } : {}
    )

    return {
      status: response?.status
    }
  }

  const { openSaveToGitDialog } = useSaveToGitDialog<SavePipelineObj>({
    onSuccess: (
      gitData: SaveToGitFormV2Interface,
      payload?: SavePipelineObj,
      objectId?: string
    ): Promise<UseSaveSuccessResponse> =>
      saveAngPublishWithGitInfo(gitData, payload, objectId || gitDetails?.objectId || '', gitDetails.commitId)
  })

  const saveAndPublish = React.useCallback(async () => {
    window.dispatchEvent(new CustomEvent('SAVE_PIPELINE_CLICKED'))

    let latestPipeline: PipelineInfoConfig = pipeline

    if (isYaml && yamlHandler) {
      if (!parse(yamlHandler.getLatestYaml())) {
        clear()
        showError(getString('invalidYamlText'))
        return
      }
      try {
        latestPipeline = parse(yamlHandler.getLatestYaml()).pipeline as PipelineInfoConfig
      } /* istanbul ignore next */ catch (err) {
        showError(err.message || err, undefined, 'pipeline.save.pipeline.error')
      }
    }

    const ciCodeBaseConfigurationError = validateCICodebaseConfiguration({ pipeline: latestPipeline, getString })
    if (ciCodeBaseConfigurationError) {
      clear()
      showError(ciCodeBaseConfigurationError)
      return
    }

    // if Git sync enabled then display modal
    if (isGitSyncEnabled || storeMetadata?.storeType === 'REMOTE') {
      if ((storeMetadata?.storeType !== 'REMOTE' && isEmpty(gitDetails.repoIdentifier)) || isEmpty(gitDetails.branch)) {
        clear()
        showError(getString('pipeline.gitExperience.selectRepoBranch'))
        return
      }
      openSaveToGitDialog({
        isEditing: pipelineIdentifier !== DefaultNewPipelineId,
        resource: {
          type: 'Pipelines',
          name: latestPipeline.name,
          identifier: latestPipeline.identifier,
          gitDetails: gitDetails ?? {},
          storeMetadata: storeMetadata?.storeType ? storeMetadata : undefined
        },
        payload: { pipeline: omit(latestPipeline, 'repo', 'branch') }
      })
    } else {
      await saveAndPublishPipeline(latestPipeline, storeMetadata)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deletePipelineCache,
    accountId,
    history,
    toPipelineStudio,
    projectIdentifier,
    orgIdentifier,
    pipeline,
    fetchPipeline,
    showError,
    pipelineIdentifier,
    isYaml,
    yamlHandler
  ])

  if (loading) {
    return (
      <Button
        variation={ButtonVariation.PRIMARY}
        rightIcon="chevron-down"
        text={getString('save')}
        onClick={noop}
        loading={true}
      />
    )
  }

  if (!isTemplatesEnabled) {
    if (!isReadonly) {
      return (
        <Button
          variation={ButtonVariation.PRIMARY}
          text={getString('save')}
          onClick={saveAndPublish}
          icon="send-data"
          disabled={!isUpdated}
        />
      )
    } else {
      return <></>
    }
  }

  return (
    <SplitButton
      disabled={!isSaveEnabled}
      variation={ButtonVariation.PRIMARY}
      text={getString('save')}
      loading={loading}
      onClick={saveAndPublish}
    >
      <SplitButtonOption onClick={save} text={getString('common.saveAsTemplate')} />
    </SplitButton>
  )
}
