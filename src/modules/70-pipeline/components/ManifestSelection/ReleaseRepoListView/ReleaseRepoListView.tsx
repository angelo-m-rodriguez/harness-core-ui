import React, { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'

import cx from 'classnames'

import { Layout, ButtonSize, ButtonVariation, Text, Icon, Button, StepWizard } from '@harness/uicore'
// import { getStatus, getConnectorNameFromValue } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { FontVariation, Color } from '@harness/design-system'

import { useModalHook } from '@harness/use-modal'
import { Classes, IDialogProps, Dialog } from '@blueprintjs/core'
import produce from 'immer'
import { get, set } from 'lodash-es'

import type { ConnectorInfoDTO, ManifestConfigWrapper } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { getConnectorNameFromValue, getStatus } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import type { ConnectorRefLabelType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'

import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'
import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import {
  buildGitPayload,
  buildGithubPayload,
  buildBitbucketPayload,
  buildGitlabPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'

import { useQueryParams } from '@common/hooks/useQueryParams'
import type { ManifestListViewProps, ManifestStores } from '../ManifestInterface'
import { getConnectorPath } from '../ManifestWizardSteps/ManifestUtils'
import ConnectorField from '../ManifestListView/ConnectorField'
import ReleaseRepoWizard from '../ReleaseRepoWizard/ReleaseRepoWizard'

import { allowedManifestTypes, manifestStoreTypes, ManifestToConnectorMap } from '../Manifesthelper'
import css from '../ManifestSelection.module.scss'

type ManifestType = 'ReleaseRepo'
const ReleaseRepoIcon = 'service-kubernetes'

const showAddRepoBtn = (isReadonly: boolean, allowOnlyOne: boolean, listOfManifests: Array<any>): boolean => {
  if (allowOnlyOne && listOfManifests.length === 1) {
    return false
  }
  return !isReadonly
}

interface ReleaseRepoStepInitData {
  connectorRef: string | undefined | ConnectorSelectedValue
  store: ManifestStores | string
  selectedManifest: ManifestType | null
}

function ReleaseRepoListView({
  updateStage,
  stage,
  connectors,
  refetchConnectors,
  listOfManifests,
  deploymentType,
  isReadonly,
  allowableTypes,
  allowOnlyOne = false
}: ManifestListViewProps): JSX.Element {
  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    style: { width: 1175, minHeight: 640, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }
  }
  const { getString } = useStrings()
  const [selectedManifest, setSelectedManifest] = useState<ManifestType | null>(null)
  const [connectorView, setConnectorView] = useState(false)
  const [manifestStore, setManifestStore] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const { expressions } = useVariablesExpression()
  const [manifestIndex, setEditIndex] = useState(0)

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const getLabels = (): ConnectorRefLabelType => {
    return {
      firstStepName: getString('pipeline.manifestType.specifyManifestRepoType'),
      secondStepName: `${getString('common.specify')} ${
        selectedManifest && getString('pipeline.manifestTypeLabels.K8sManifest')
      } ${getString('store')}`
    }
  }

  const handleStoreChange = (store?: ManifestStores): void => {
    setManifestStore(store || '')
  }

  const editManifest = (manifestType: ManifestType, store: ManifestStores, index: number): void => {
    setSelectedManifest(manifestType)
    setManifestStore(store)
    //   setConnectorView(false)
    setEditIndex(index)
    showReleaseRepoModal()
  }

  const getBuildPayload = (type: ConnectorInfoDTO['type']) => {
    if (type === Connectors.GIT) {
      return buildGitPayload
    }
    if (type === Connectors.GITHUB) {
      return buildGithubPayload
    }
    if (type === Connectors.BITBUCKET) {
      return buildBitbucketPayload
    }
    if (type === Connectors.GITLAB) {
      return buildGitlabPayload
    }
    return () => ({})
  }

  const getNewConnectorSteps = useCallback((): JSX.Element => {
    const buildPayload = getBuildPayload(ManifestToConnectorMap[manifestStore])

    return (
      <StepWizard title={getString('connectors.createNewConnector')}>
        <ConnectorDetailsStep
          type={ManifestToConnectorMap[manifestStore]}
          name={getString('overview')}
          isEditMode={isEditMode}
          gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
        />
        <GitDetailsStep
          type={ManifestToConnectorMap[manifestStore]}
          name={getString('details')}
          isEditMode={isEditMode}
          connectorInfo={undefined}
        />
        {ManifestToConnectorMap[manifestStore] === Connectors.GIT ? (
          <StepGitAuthentication
            name={getString('credentials')}
            onConnectorCreated={() => {
              // Handle on success
            }}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            connectorInfo={undefined}
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
          />
        ) : null}
        {ManifestToConnectorMap[manifestStore] === Connectors.GITHUB ? (
          <StepGithubAuthentication
            name={getString('credentials')}
            onConnectorCreated={() => {
              // Handle on success
            }}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            connectorInfo={undefined}
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
          />
        ) : null}
        {ManifestToConnectorMap[manifestStore] === Connectors.BITBUCKET ? (
          <StepBitbucketAuthentication
            name={getString('credentials')}
            onConnectorCreated={() => {
              // Handle on success
            }}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            connectorInfo={undefined}
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
          />
        ) : null}
        {ManifestToConnectorMap[manifestStore] === Connectors.GITLAB ? (
          <StepGitlabAuthentication
            name={getString('credentials')}
            identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
            onConnectorCreated={() => {
              // Handle on success
            }}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            connectorInfo={undefined}
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
          />
        ) : null}
        <DelegateSelectorStep
          name={getString('delegate.DelegateselectionLabel')}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          buildPayload={buildPayload}
          connectorInfo={undefined}
        />
        <VerifyOutOfClusterDelegate
          name={getString('connectors.stepThreeName')}
          connectorInfo={undefined}
          isStep={true}
          isLastStep={false}
          type={ManifestToConnectorMap[manifestStore]}
        />
      </StepWizard>
    )
  }, [connectorView, manifestStore, isEditMode])

  const handleSubmit = (manifestObj: ManifestConfigWrapper): void => {
    // const isNewManifest = manifestIndex === listOfManifests.length

    if (manifestIndex >= 0) {
      listOfManifests[manifestIndex] = manifestObj
    } else {
      listOfManifests.push(manifestObj)
    }
    // updateStageData()
    // trackEvent(
    //   isNewManifest ? ManifestActions.SaveManifestOnPipelinePage : ManifestActions.UpdateManifestOnPipelinePage,
    //   {
    //     manifest: manifestObj?.manifest?.type || selectedManifest || '',
    //     storeType: manifestObj?.manifest?.spec?.store?.type || ''
    //   }
    // )

    // hideConnectorModal()
    // setConnectorView(false)
    setSelectedManifest(null)
    setManifestStore('')
    refetchConnectors()
  }

  const getInitialValues = (): ReleaseRepoStepInitData => {
    const initValues = get(listOfManifests[manifestIndex], 'manifest.spec.store.spec', null)

    if (initValues) {
      const values = {
        ...initValues,
        store: listOfManifests[manifestIndex]?.manifest.spec?.store?.type,
        connectorRef: getConnectorPath(
          listOfManifests[manifestIndex]?.manifest.spec?.store?.type,
          listOfManifests[manifestIndex].manifest
        ),
        selectedManifest: get(listOfManifests[manifestIndex], 'manifest.type', null)
      }
      return values
    }
    return {
      store: manifestStore,
      connectorRef: undefined,
      selectedManifest: selectedManifest
    }
  }

  const addNewReleaseRepo = (): void => {
    // setEditIndex(listOfManifests.length)
    // setSelectedManifest(
    //   allowedManifestTypes[deploymentType]?.length === 1 ? allowedManifestTypes[deploymentType][0] : null
    // )
    // showConnectorModal()
    setEditIndex(-1)
    showReleaseRepoModal()
    setConnectorView(false)
    setManifestStore('')
    setIsEditMode(false)
    setSelectedManifest(null)
  }

  const handleConnectorViewChange = (isConnectorView: boolean): void => {
    setConnectorView(isConnectorView)
    setIsEditMode(false)
  }

  const [showReleaseRepoModal, hideReleaseRepoModal] = useModalHook(() => {
    const onClose = (): void => {
      // setConnectorView(false)
      hideReleaseRepoModal()
      // setManifestStore('')
      // setIsEditMode(false)
      // setSelectedManifest(null)
    }
    const manifest = get(listOfManifests[manifestIndex], 'manifest', null)

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS} className={cx(css.modal, Classes.DIALOG)}>
        <div className={css.createConnectorWizard}>
          <ReleaseRepoWizard
            types={allowedManifestTypes[deploymentType]}
            manifestStoreTypes={manifestStoreTypes}
            labels={getLabels()}
            selectedManifest={selectedManifest}
            newConnectorView={connectorView}
            expressions={expressions}
            allowableTypes={allowableTypes}
            // changeManifestType={changeManifestType}
            handleConnectorViewChange={handleConnectorViewChange}
            handleStoreChange={handleStoreChange}
            initialValues={getInitialValues()}
            manifest={manifest}
            newConnectorSteps={getNewConnectorSteps()}
            // lastSteps={getLastSteps()}
            // iconsProps={getIconProps()}
            handleSubmit={handleSubmit}
            isReadonly={isReadonly}
            stage={stage}
            updateStage={updateStage}
            onClose={onClose}
          />
        </div>
        <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
      </Dialog>
    )
  }, [
    selectedManifest,
    // connectorView,
    manifestIndex,
    manifestStore,
    expressions.length,
    expressions,
    allowableTypes
    // isEditMode
  ])

  const removeManifestConfig = (index: number): void => {
    listOfManifests.splice(index, 1)

    if (stage) {
      const newStage = produce(stage, draft => {
        set(draft, 'stage.spec.serviceConfig.serviceDefinition.spec.manifests', listOfManifests)
      }).stage

      if (newStage) {
        updateStage(newStage)
      }
    }
  }

  const renderConnectorField = useCallback(
    (
      manifestStoreType: ManifestStores,
      connectorRef: string,
      connectorName: string | undefined,
      connectorColor: string
    ): JSX.Element => {
      return (
        <ConnectorField
          manifestStore={manifestStoreType}
          connectorRef={connectorRef}
          connectorName={connectorName}
          connectorColor={connectorColor}
        />
      )
    },
    []
  )

  return (
    <Layout.Vertical style={{ width: '100%' }}>
      <Layout.Vertical spacing="small" style={{ flexShrink: 'initial' }}>
        {!!listOfManifests?.length && (
          <div className={cx(css.manifestList, css.listHeader)}>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('common.ID')}</Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipelineSteps.serviceTab.manifestList.manifestType')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipelineSteps.serviceTab.manifestList.manifestStore')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('location')}</Text>
            <span></span>
          </div>
        )}
        <Layout.Vertical style={{ flexShrink: 'initial' }}>
          <section>
            {listOfManifests &&
              listOfManifests.map((data: ManifestConfigWrapper, index: number) => {
                const manifest = data['manifest']

                const { color } = getStatus(
                  getConnectorPath(manifest?.spec?.store?.type, manifest),
                  connectors,
                  accountId
                )
                const connectorName = getConnectorNameFromValue(
                  getConnectorPath(manifest?.spec?.store?.type, manifest),
                  connectors
                )

                return (
                  <div className={css.rowItem} key={`${manifest?.identifier}-${index}`}>
                    <section className={css.manifestList}>
                      <div className={css.columnId}>
                        <Icon inline name={ReleaseRepoIcon} size={20} />
                        <Text inline width={150} className={css.type} color={Color.BLACK} lineClamp={1}>
                          {manifest?.identifier}
                        </Text>
                      </div>
                      <div>{getString('pipeline.releaseRepo')}</div>
                      {renderConnectorField(
                        manifest?.spec?.store.type,
                        getConnectorPath(manifest?.spec?.store?.type, manifest),
                        connectorName,
                        color
                      )}
                      {!!manifest?.spec?.store?.spec.paths?.length && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>
                              {typeof manifest?.spec?.store?.spec.paths === 'string'
                                ? manifest?.spec?.store?.spec.paths
                                : manifest?.spec?.store?.spec.paths.join(', ')}
                            </span>
                          </Text>
                        </span>
                      )}
                      {!!manifest?.spec?.paths?.length && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>
                              {typeof manifest?.spec.paths === 'string'
                                ? manifest?.spec.paths
                                : manifest?.spec.paths.join(', ')}
                            </span>
                          </Text>
                        </span>
                      )}
                      {!!manifest?.spec?.store?.spec.folderPath && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>{manifest.spec.store?.spec?.folderPath}</span>
                          </Text>
                        </span>
                      )}

                      {!!(manifest?.spec?.chartName && !manifest?.spec?.store?.spec.folderPath) && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>{manifest.spec.chartName}</span>
                          </Text>
                        </span>
                      )}

                      {!isReadonly && (
                        <span>
                          <Layout.Horizontal>
                            <Button
                              icon="Edit"
                              iconProps={{ size: 18 }}
                              onClick={() =>
                                editManifest(
                                  manifest?.type as ManifestType,
                                  manifest?.spec?.store?.type as ManifestStores,
                                  index
                                )
                              }
                              minimal
                            />

                            <Button
                              iconProps={{ size: 18 }}
                              icon="main-trash"
                              onClick={() => removeManifestConfig(index)}
                              minimal
                            />
                          </Layout.Horizontal>
                        </span>
                      )}
                    </section>
                  </div>
                )
              })}
          </section>
        </Layout.Vertical>
      </Layout.Vertical>
      <Layout.Vertical spacing={'medium'} flex={{ alignItems: 'flex-start' }}>
        {showAddRepoBtn(isReadonly, allowOnlyOne, listOfManifests) ? (
          <Button
            className={css.addManifest}
            id="add-release-repo"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            data-test-id="add-release-repo"
            onClick={addNewReleaseRepo}
            text={'Add Release Repo Manifest'}
          />
        ) : null}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default ReleaseRepoListView
