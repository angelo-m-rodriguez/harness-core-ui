/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// This is used in ConnectorView for connector details page
import React, { useState } from 'react'
import {
  Button,
  Layout,
  ButtonVariation,
  shouldShowError,
  VisualYamlSelectedView,
  PageSpinner,
  useToaster,
  useConfirmationDialog
} from '@wings-software/uicore'
import { parse } from 'yaml'
import { useParams } from 'react-router-dom'
import { isEmpty, noop, omit } from 'lodash-es'
import type { ToasterProps } from '@wings-software/uicore/dist/hooks/useToaster/useToaster'
import YamlBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { useStrings } from 'framework/strings'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import {
  Connector,
  ConnectorInfoDTO,
  ConnectorResponse,
  CreateConnectorQueryParams,
  EntityGitDetails,
  ResponseJsonNode,
  useGetYamlSchema,
  useUpdateConnector
} from 'services/cd-ng'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { UseGetMockData } from '@common/utils/testUtils'
import { isSMConnector } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import {
  UseSaveSuccessResponse,
  useSaveToGitDialog,
  UseSaveToGitDialogReturn
} from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { FeatureFlag } from '@common/featureFlags'
import { doesGovernanceHasErrorOrWarning } from '@governance/utils'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import css from './ConnectorYAMLEditor.module.scss'

interface ConnectorYAMLEditorProp {
  responsedata: ConnectorResponse
  connector: ConnectorInfoDTO
  setConnector: (object: ConnectorInfoDTO) => void
  yamlBuilderProps: YamlBuilderProps
  enableEdit: boolean
  setEnableEdit: (enableEdit: boolean) => void
  selectedView: VisualYamlSelectedView
  setSelectedView: (view: VisualYamlSelectedView) => void
  setConnectorForYaml: (connectorInfo: ConnectorInfoDTO) => void
  refetchConnector: () => Promise<void>
  mockSchemaData?: UseGetMockData<ResponseJsonNode>
}

interface SaveYamlhandlerProps {
  isGitSyncEnabled: boolean
  connector: ConnectorInfoDTO
  openSaveToGitDialog: UseSaveToGitDialogReturn<Connector>['openSaveToGitDialog']
  responsedata: ConnectorResponse
  yamlHandler: YamlBuilderHandlerBinding | undefined
  handleSaveYaml: (
    connectorData?: {
      gitData?: SaveToGitFormInterface
      payload?: Connector
    },
    objectId?: EntityGitDetails['objectId']
  ) => Promise<UseSaveSuccessResponse>
  showSuccess: ToasterProps['showSuccess']
  showError: ToasterProps['showError']
  successText: string
}

const saveYamlhandler = (handler: SaveYamlhandlerProps): void => {
  const {
    isGitSyncEnabled,
    connector,
    openSaveToGitDialog,
    responsedata,
    yamlHandler,
    handleSaveYaml,
    showSuccess,
    showError,
    successText
  } = handler
  if (isGitSyncEnabled && !isSMConnector(connector.type)) {
    openSaveToGitDialog({
      isEditing: true,
      resource: {
        type: 'Connectors',
        name: responsedata.connector?.name || '',
        identifier: responsedata.connector?.identifier || '',
        gitDetails: responsedata.gitDetails
      },
      payload: parse(yamlHandler?.getLatestYaml?.() || '')
    })
  } else {
    handleSaveYaml()
      .then(res => {
        if (res.status === 'SUCCESS') {
          res.nextCallback?.()
          showSuccess(successText)
        } else {
          /* Todo handle error with API status 200 */
        }
      })
      .catch(e => {
        if (shouldShowError(e)) {
          showError(e.data?.message || e.message)
        }
      })
  }
}

const showLoader = (isFetchingSchema: boolean, updating: boolean, isGitSyncEnabled: boolean): boolean =>
  isFetchingSchema || (!isGitSyncEnabled && updating)

const getConnectorJSON = (payload: Connector | undefined, latestYaml?: string): Connector =>
  !isEmpty(payload) ? payload : parse(latestYaml || '')

const ConnectorYAMLEditor: React.FC<ConnectorYAMLEditorProp> = props => {
  const { showSuccess, showError } = useToaster()
  const { getString } = useStrings()
  const {
    responsedata,
    connector,
    setConnector,
    yamlBuilderProps,
    enableEdit = false,
    setEnableEdit,
    selectedView,
    setSelectedView,
    setConnectorForYaml,
    refetchConnector
  } = props
  const { isGitSyncEnabled } = useAppStore()
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [hasConnectorChanged, setHasConnectorChanged] = useState<boolean>(false)

  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    accountId: string
    projectIdentifier: string
    orgIdentifier: string
  }>()

  const {
    data: connectorSchema,
    loading: isFetchingSchema,
    refetch
  } = useGetYamlSchema({
    queryParams: {
      entityType: 'Connectors',
      identifier: connector.identifier,
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    },
    mock: props.mockSchemaData,
    lazy: true
  })

  const { mutate: updateConnector, loading: updating } = useUpdateConnector({
    queryParams: { accountIdentifier: accountId }
  })
  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)

  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())

  const { openSaveToGitDialog } = useSaveToGitDialog<Connector>({
    onSuccess: (
      gitDetails: SaveToGitFormInterface,
      payload?: Connector,
      objectId?: string
    ): Promise<UseSaveSuccessResponse> => handleSaveYaml({ gitData: gitDetails, payload }, objectId),
    onClose: noop
  })

  const { openDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('continueWithoutSavingText'),
    titleText: getString('continueWithoutSavingTitle'),
    confirmButtonText: getString('confirm'),
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        setEnableEdit(false)
        setConnectorForYaml(responsedata.connector || ({} as ConnectorInfoDTO))
        setHasConnectorChanged(false)
        setSelectedView(VisualYamlSelectedView.VISUAL)
      }
    }
  })

  const onConnectorChange = (isEditorDirty: boolean): void => {
    setHasConnectorChanged(isEditorDirty)
  }

  const resetEditor = (event: React.MouseEvent<Element, MouseEvent>): void => {
    event.preventDefault()
    event.stopPropagation()
    openDialog()
  }

  React.useEffect(() => {
    if (selectedView === VisualYamlSelectedView.YAML && enableEdit) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableEdit])

  /* excluding below method from coverage since it's called only by YAMLBuilder */
  /* istanbul ignore next */
  const handleSaveYaml = async (
    connectorData?: {
      gitData?: SaveToGitFormInterface
      payload?: Connector
    },
    objectId?: EntityGitDetails['objectId']
  ): Promise<UseSaveSuccessResponse> => {
    const { gitData, payload } = connectorData || {}
    const connectorJSONEq = getConnectorJSON(payload, yamlHandler?.getLatestYaml?.())
    const errorMap = yamlHandler?.getYAMLValidationErrorMap?.()
    if (errorMap && errorMap.size > 0) {
      showError(getString('yamlBuilder.yamlError'))
      return {
        status: 'ERROR'
      }
    } else {
      let queryParams: CreateConnectorQueryParams = {}
      if (gitData) {
        queryParams = {
          accountIdentifier: accountId,
          ...omit(gitData, 'sourceBranch')
        }
      }
      const response = await updateConnector(connectorJSONEq, {
        queryParams: {
          ...queryParams,
          lastObjectId: objectId ?? responsedata.gitDetails?.objectId,
          baseBranch: responsedata.gitDetails?.branch
        }
      })
      let { governanceMetaDataHasError, governanceMetaDataHasWarning } = doesGovernanceHasErrorOrWarning(
        response.data?.governanceMetadata
      )
      if (!opaFlagEnabled) {
        governanceMetaDataHasError = false
        governanceMetaDataHasWarning = false
      }
      if (opaFlagEnabled && response.data?.governanceMetadata) {
        conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
          setEnableEdit(false)
          refetchConnector()
        })
      }
      if (response.status === 'SUCCESS' && response?.data?.connector && !governanceMetaDataHasError) {
        if (!governanceMetaDataHasWarning) {
          setEnableEdit(false)
        }
        setConnector(response?.data?.connector)
        setConnectorForYaml(response?.data?.connector)
      }

      return {
        status: !governanceMetaDataHasError ? response.status : 'FAILURE',
        nextCallback: async () => {
          if (!governanceMetaDataHasError && !governanceMetaDataHasWarning) {
            refetchConnector()
          }
        },
        governanceMetaData: response.data?.governanceMetadata
      }
    }
  }

  return (
    <>
      {showLoader(isFetchingSchema, updating, !!isGitSyncEnabled) ? (
        <PageSpinner
          message={updating ? getString('connectors.updating', { name: connector?.name }) : getString('loading')}
        />
      ) : null}
      <div className={css.fullWidth}>
        <YamlBuilder
          {...yamlBuilderProps}
          // snippets={snippetMetaData?.data?.yamlSnippets}
          // onSnippetCopy={onSnippetCopy}
          // snippetFetchResponse={snippetFetchResponse}
          schema={connectorSchema?.data}
          isReadOnlyMode={false}
          bind={setYamlHandler}
          onChange={onConnectorChange}
          showSnippetSection={false}
        />
        <Layout.Horizontal spacing="small">
          <Button
            id="saveYAMLChanges"
            intent="primary"
            text={getString('saveChanges')}
            onClick={() =>
              saveYamlhandler({
                isGitSyncEnabled: !!isGitSyncEnabled,
                connector,
                openSaveToGitDialog,
                responsedata,
                yamlHandler,
                handleSaveYaml,
                showSuccess,
                showError,
                successText: getString('connectors.updatedSuccessfully')
              })
            }
            margin={{ top: 'large' }}
            disabled={!isGitSyncEnabled && !hasConnectorChanged}
            variation={ButtonVariation.PRIMARY}
          />
          <Button
            text={getString('cancel')}
            margin={{ top: 'large' }}
            onClick={resetEditor}
            variation={ButtonVariation.TERTIARY}
          />
        </Layout.Horizontal>
      </div>
    </>
  )
}

export default ConnectorYAMLEditor
