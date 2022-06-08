/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layout,
  Container,
  ButtonVariation,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  useToaster
} from '@wings-software/uicore'
import type { ToasterProps } from '@wings-software/uicore/dist/hooks/useToaster/useToaster'
import type {
  ConnectorInfoDTO,
  ConnectorResponse,
  ResponseJsonNode,
  ResponseYamlSnippets,
  ResponsePageSecretResponseWrapper
} from 'services/cd-ng'
import YamlBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import type { UseGetMockData } from '@common/utils/testUtils'
import { useStrings } from 'framework/strings'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import ConnectorActivityDetails from '@connectors/components/ConnectorActivityDetails/ConnectorActivityDetails'
import ConnectorYAMLEditor from '@connectors/components/ConnectorYAMLEditor/ConnectorYAMLEditor'
import SavedConnectorDetails from './views/savedDetailsView/SavedConnectorDetails'
import css from './ConnectorView.module.scss'

export interface ConnectorViewProps {
  type: ConnectorInfoDTO['type']
  response: ConnectorResponse
  refetchConnector: () => Promise<void>
  mockMetaData?: UseGetMockData<ResponseYamlSnippets>
  mockSnippetData?: UseGetMockData<ResponseJsonNode>
  mockSchemaData?: UseGetMockData<ResponseJsonNode>
  mockSecretData?: UseGetMockData<ResponsePageSecretResponseWrapper>
}

interface ConnectorViewState {
  enableEdit: boolean
  setEnableEdit: (val: boolean) => void
  connector: ConnectorInfoDTO
  setConnector: (object: ConnectorInfoDTO) => void
  selectedView: string
  setSelectedView: (selection: SelectedView) => void
}

interface ModeSwitchHandlers {
  setSelectedView: (selection: SelectedView) => void
  setConnector: (object: ConnectorInfoDTO) => void
  setConnectorForYaml: (object: ConnectorInfoDTO) => void
  showError: ToasterProps['showError']
}

const getInitialConnectorData = (response: ConnectorResponse): ConnectorInfoDTO =>
  response?.connector || ({} as ConnectorInfoDTO)

const handleModeSwitch = (
  newView: SelectedView,
  selectedView: SelectedView,
  connector: ConnectorInfoDTO,
  handlers: ModeSwitchHandlers
): boolean => {
  const { setSelectedView, setConnector, setConnectorForYaml, showError } = handlers

  if (newView === selectedView) {
    return false
  } else {
    if (newView === SelectedView.VISUAL) {
      try {
        setSelectedView(newView)
        setConnector(connector)
        setConnectorForYaml(connector)
      } /* istanbul ignore next */ catch (err) {
        showError(err.name ? `${err.name}: ${err.message}` : err)
      }
    } else {
      setSelectedView(SelectedView.YAML)
    }
    return true
  }
}

const ConnectorView: React.FC<ConnectorViewProps> = props => {
  const { showError } = useToaster()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    accountId: string
    projectIdentifier: string
    orgIdentifier: string
  }>()

  const isEntityInvalid = props.response.entityValidityDetails?.valid === false
  const [enableEdit, setEnableEdit] = useState(false)
  const [selectedView, setSelectedView] = useState<SelectedView>(
    isEntityInvalid ? SelectedView.YAML : SelectedView.VISUAL
  )
  const [connector, setConnector] = useState<ConnectorInfoDTO>(getInitialConnectorData(props.response))
  const [connectorForYaml, setConnectorForYaml] = useState<ConnectorInfoDTO>(getInitialConnectorData(props.response))

  const { getString } = useStrings()
  const isHarnessManaged = props.response?.harnessManaged

  const [canEditConnector] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.CONNECTOR,
        resourceIdentifier: connector.identifier
      },
      permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
    },
    []
  )

  const state: ConnectorViewState = {
    enableEdit,
    setEnableEdit,
    connector,
    setConnector,
    selectedView,
    setSelectedView
  }

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: data => {
      setConnector(data?.connector as ConnectorInfoDTO)
      setConnectorForYaml(data?.connector as ConnectorInfoDTO)
      state.setEnableEdit(false)
    },
    onClose: () => {
      state.setEnableEdit(false)
      props.refetchConnector()
    }
  })

  useEffect(() => {
    if (props.response?.connector) {
      setConnector(props.response.connector)
      setConnectorForYaml(props.response.connector)
    }
  }, [props.response])

  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `${connectorForYaml?.name ?? 'Connector'}.yaml`,
    entityType: 'Connectors',
    ...(!isEntityInvalid
      ? { existingJSON: { connector: connectorForYaml } }
      : { existingYaml: props.response.entityValidityDetails?.invalidYaml }),
    isReadOnlyMode: true,
    height: 'calc(100vh - 350px)',
    yamlSanityConfig: {
      removeEmptyString: false
    }
  }

  return (
    <Layout.Horizontal padding="xlarge" height="inherit">
      <Layout.Vertical width={enableEdit && selectedView === SelectedView.YAML ? '100%' : '67%'}>
        <Container className={css.buttonContainer}>
          {state.enableEdit ? null : (
            <VisualYamlToggle
              selectedView={isEntityInvalid ? SelectedView.YAML : selectedView}
              disableToggle={isEntityInvalid}
              onChange={nextMode => {
                handleModeSwitch(nextMode, selectedView, getInitialConnectorData(props.response), {
                  setSelectedView,
                  setConnector,
                  setConnectorForYaml,
                  showError
                })
              }}
            />
          )}
          {state.enableEdit || isHarnessManaged ? null : (
            <RbacButton
              id="editDetailsBtn"
              text={getString('editDetails')}
              icon="edit"
              permission={{
                permission: PermissionIdentifier.UPDATE_CONNECTOR,
                resource: {
                  resourceType: ResourceType.CONNECTOR,
                  resourceIdentifier: connector.identifier
                }
              }}
              onClick={() => {
                state.setEnableEdit(true)
                selectedView === SelectedView.VISUAL
                  ? openConnectorModal(true, props.type, {
                      connectorInfo: connector,
                      gitDetails: { ...props.response?.gitDetails, getDefaultFromOtherRepo: false }
                    })
                  : undefined
              }}
              variation={ButtonVariation.SECONDARY}
            />
          )}
        </Container>
        <Layout.Horizontal height="100%">
          {/* Edit mode */}
          {enableEdit ? (
            selectedView === SelectedView.YAML ? (
              <ConnectorYAMLEditor
                responsedata={props.response}
                connector={connector}
                setConnector={setConnector}
                yamlBuilderProps={yamlBuilderReadOnlyModeProps}
                enableEdit={enableEdit}
                setEnableEdit={setEnableEdit}
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                setConnectorForYaml={setConnectorForYaml}
                refetchConnector={props.refetchConnector}
              ></ConnectorYAMLEditor>
            ) : null
          ) : /* View-only mode */
          selectedView === SelectedView.VISUAL ? (
            <Layout.Horizontal spacing="medium" height="100%" width="100%">
              <SavedConnectorDetails connector={connector}></SavedConnectorDetails>
            </Layout.Horizontal>
          ) : (
            <Layout.Horizontal spacing="medium" className={css.fullWidth}>
              <div className={css.yamlView} data-test="yamlBuilderContainer">
                <YamlBuilder
                  {...yamlBuilderReadOnlyModeProps}
                  showSnippetSection={false}
                  onEnableEditMode={() => state.setEnableEdit(true)}
                  isEditModeSupported={canEditConnector}
                  isHarnessManaged={isHarnessManaged}
                />
              </div>
            </Layout.Horizontal>
          )}
        </Layout.Horizontal>
      </Layout.Vertical>
      {selectedView === SelectedView.VISUAL ? (
        <ConnectorActivityDetails
          responsedata={props.response}
          refetchConnector={props.refetchConnector}
        ></ConnectorActivityDetails>
      ) : null}
    </Layout.Horizontal>
  )
}

export default ConnectorView
