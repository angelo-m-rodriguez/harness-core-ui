/* eslint-disable @typescript-eslint/no-shadow */
/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import {
  Layout,
  Icon,
  StepWizard,
  StepProps,
  Button,
  Text,
  ButtonSize,
  ButtonVariation,
  MultiTypeInputType
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Dialog, IDialogProps, Classes, Label } from '@blueprintjs/core'
import { defaultTo, get, set } from 'lodash-es'
import type { IconProps } from '@harness/icons'

import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import type { FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper, ServiceDefinition } from 'services/cd-ng'
import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'

import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { ManifestWizard } from '@pipeline/components/ManifestSelection/ManifestWizard/ManifestWizard'

import type { ManifestLastStepProps } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { ConnectorRefLabelType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import KustomizePatchDetails from '@pipeline/components/ManifestSelection/ManifestWizardSteps/KustomizePatchesDetails/KustomizePatchesDetails'
import K8sValuesManifest from '@pipeline/components/ManifestSelection/ManifestWizardSteps/K8sValuesManifest/K8sValuesManifest'
import OpenShiftParamWithGit from '@pipeline/components/ManifestSelection/ManifestWizardSteps/OpenShiftParam/OSWithGit'

import InlineManifest from '@pipeline/components/ManifestSelection/ManifestWizardSteps/InlineManifest/InlineManifest'
import {
  allowedManifestTypes,
  getBuildPayload,
  K8sManifestDataType,
  K8sManifestStoreMap,
  K8sManifestToConnectorMap,
  K8smanifestTypeIcons,
  K8smanifestTypeLabels,
  K8sManifestTypetoStoreMap
} from './K8shelper'
import type { K8sManifestTypes, K8sManifestStepInitData, K8sManifestStores, K8sApplyFormData } from './K8sInterface'
import css from './K8sOverrideValuesListView.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface K8sManifestListViewProps {
  listOfManifests: Array<any>
  isReadonly: boolean
  allowableTypes: MultiTypeInputType[]
  formik: FormikProps<K8sApplyFormData>
  deploymentType: ServiceDefinition['type']
}
function K8sOverrideValuesListView({
  listOfManifests,
  deploymentType,
  isReadonly,
  allowableTypes,
  formik
}: K8sManifestListViewProps): JSX.Element {
  const [selectedManifest, setSelectedManifest] = useState<K8sManifestTypes | null>(null)
  const [connectorView, setConnectorView] = useState(false)
  const [manifestStore, setManifestStore] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [manifestIndex, setEditIndex] = useState(0)
  const [removeManifest, setremoveManifest] = useState(false)
  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    style: { width: 1175, minHeight: 640, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }
  }

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const addNewManifest = (): void => {
    setEditIndex(listOfManifests.length)
    setSelectedManifest(
      allowedManifestTypes[deploymentType]?.length === 1 ? allowedManifestTypes[deploymentType][0] : null
    )
    showConnectorModal()
  }

  const removeManifestConfig = (index: number): void => {
    listOfManifests.splice(index, 1)
    set(formik, 'values.spec.overrides', listOfManifests)
    setremoveManifest(!removeManifest)
  }

  const editManifest = (manifestType: K8sManifestTypes, store: K8sManifestStores, index: number): void => {
    setSelectedManifest(manifestType)
    setManifestStore(store)
    setConnectorView(false)
    setEditIndex(index)
    showConnectorModal()
  }

  const getLastStepInitialData = (): ManifestConfig => {
    const initValues = get(listOfManifests[manifestIndex], 'manifest', null)
    /* istanbul ignore next */
    if (initValues?.type && initValues?.type !== selectedManifest) {
      return null as unknown as ManifestConfig
    }
    return initValues
  }

  const getInitialValues = useCallback((): K8sManifestStepInitData => {
    const initValues = get(listOfManifests[manifestIndex], 'manifest.spec.store.spec', null)
    /* istanbul ignore next */
    if (initValues) {
      return {
        ...initValues,
        store: listOfManifests[manifestIndex]?.manifest.spec?.store?.type,
        connectorRef: initValues?.connectorRef,
        selectedManifest: get(listOfManifests[manifestIndex], 'manifest.type', null)
      }
    }
    return {
      store: manifestStore,
      connectorRef: undefined,
      selectedManifest: selectedManifest
    }
  }, [manifestStore, selectedManifest])

  /* istanbul ignore next */
  const handleSubmit = useCallback(
    (manifestObj: ManifestConfigWrapper): void => {
      if (listOfManifests?.length > 0) {
        listOfManifests.splice(manifestIndex, 1, manifestObj)
      } else {
        listOfManifests.push(manifestObj)
      }
      hideConnectorModal()
      setConnectorView(false)
      setSelectedManifest(null)
      setManifestStore('')
      set(formik, 'values.spec.overrides', listOfManifests)
    },
    [formik, listOfManifests, manifestIndex]
  )

  const changeManifestType = useCallback((selected: K8sManifestTypes | null): void => {
    setSelectedManifest(selected)
  }, [])

  /* istanbul ignore next */
  const handleConnectorViewChange = useCallback((isConnectorView: boolean): void => {
    setConnectorView(isConnectorView)
    setIsEditMode(false)
  }, [])

  /* istanbul ignore next */
  const handleStoreChange = useCallback((store?: K8sManifestStores): void => {
    setManifestStore(defaultTo(store, ''))
  }, [])

  const lastStepProps = useCallback((): ManifestLastStepProps => {
    const manifestDetail = getString('pipeline.manifestType.manifestDetails')
    return {
      key: manifestDetail,
      name: manifestDetail,
      expressions,
      allowableTypes,
      stepName: manifestDetail,
      initialValues: getLastStepInitialData(),
      handleSubmit: handleSubmit,
      selectedManifest,
      manifestIdsList: listOfManifests.map((item: ManifestConfigWrapper) => item.manifest?.identifier as string),
      isReadonly: isReadonly
    }
  }, [selectedManifest, manifestStore, getLastStepInitialData])

  const getLabels = (): ConnectorRefLabelType => {
    return {
      firstStepName: getString('pipeline.manifestType.specifyManifestRepoType'),
      secondStepName: `${getString('common.specify')} ${
        selectedManifest && getString(K8smanifestTypeLabels[selectedManifest])
      } ${getString('store')}`
    }
  }

  const getIconProps = (): IconProps => {
    return {
      name: K8smanifestTypeIcons[selectedManifest as K8sManifestTypes]
    }
  }

  const getLastSteps = useCallback((): Array<React.ReactElement<StepProps<ConnectorConfigDTO>>> => {
    const arr: Array<React.ReactElement<StepProps<ConnectorConfigDTO>>> = []
    let manifestDetailStep = null

    /* istanbul ignore next */
    switch (true) {
      case selectedManifest === K8sManifestDataType.OpenshiftParam &&
        [
          K8sManifestStoreMap.Git,
          K8sManifestStoreMap.Github,
          K8sManifestStoreMap.GitLab,
          K8sManifestStoreMap.Bitbucket
        ].includes(manifestStore as K8sManifestStores):
        manifestDetailStep = <OpenShiftParamWithGit {...lastStepProps()} />
        break

      case selectedManifest === K8sManifestDataType.KustomizePatches &&
        [
          K8sManifestStoreMap.Git,
          K8sManifestStoreMap.Github,
          K8sManifestStoreMap.GitLab,
          K8sManifestStoreMap.Bitbucket
        ].includes(manifestStore as K8sManifestStores):
        manifestDetailStep = <KustomizePatchDetails {...lastStepProps()} />
        break
      case selectedManifest === K8sManifestDataType.Values &&
        [
          K8sManifestStoreMap.Git,
          K8sManifestStoreMap.Github,
          K8sManifestStoreMap.GitLab,
          K8sManifestStoreMap.Bitbucket
        ].includes(manifestStore as K8sManifestStores):
        manifestDetailStep = <K8sValuesManifest {...lastStepProps()} />
        break
      default:
        manifestDetailStep = <InlineManifest {...lastStepProps()} />
        break
    }

    arr.push(manifestDetailStep)
    return arr
  }, [manifestStore, selectedManifest, lastStepProps])

  const getNewConnectorSteps = useCallback((): JSX.Element => {
    const buildPayload = getBuildPayload(K8sManifestToConnectorMap[manifestStore])

    return (
      <StepWizard title={getString('connectors.createNewConnector')}>
        <ConnectorDetailsStep
          type={K8sManifestToConnectorMap[manifestStore]}
          name={getString('overview')}
          isEditMode={isEditMode}
          gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
        />
        <GitDetailsStep
          type={K8sManifestToConnectorMap[manifestStore]}
          name={getString('details')}
          isEditMode={isEditMode}
          connectorInfo={undefined}
        />
        {K8sManifestToConnectorMap[manifestStore] === Connectors.GIT ? (
          <StepGitAuthentication
            name={getString('credentials')}
            onConnectorCreated={
              /* istanbul ignore next */ () => {
                // Handle on success
              }
            }
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            connectorInfo={undefined}
            accountId={accountId}
            orgIdentifier={orgIdentifier}
            projectIdentifier={projectIdentifier}
          />
        ) : null}
        {K8sManifestToConnectorMap[manifestStore] === Connectors.GITHUB ? (
          /* istanbul ignore next */
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
        {K8sManifestToConnectorMap[manifestStore] === Connectors.BITBUCKET ? (
          /* istanbul ignore next */
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
        {K8sManifestToConnectorMap[manifestStore] === Connectors.GITLAB ? (
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
          type={K8sManifestToConnectorMap[manifestStore]}
        />
      </StepWizard>
    )
  }, [connectorView, manifestStore, isEditMode])

  const [showConnectorModal, hideConnectorModal] = useModalHook(() => {
    const onClose = (): void => {
      setConnectorView(false)
      hideConnectorModal()
      setManifestStore('')
      setIsEditMode(false)
      setSelectedManifest(null)
    }

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS} className={cx(css.modal, Classes.DIALOG)}>
        <div className={css.createConnectorWizard}>
          <ManifestWizard
            types={allowedManifestTypes[deploymentType]}
            manifestStoreTypes={K8sManifestTypetoStoreMap[selectedManifest as K8sManifestTypes]}
            labels={getLabels()}
            selectedManifest={selectedManifest}
            newConnectorView={connectorView}
            expressions={expressions}
            allowableTypes={allowableTypes}
            changeManifestType={changeManifestType}
            handleConnectorViewChange={handleConnectorViewChange}
            handleStoreChange={handleStoreChange}
            initialValues={getInitialValues()}
            newConnectorSteps={getNewConnectorSteps()}
            lastSteps={getLastSteps()}
            iconsProps={getIconProps()}
            isReadonly={isReadonly}
          />
        </div>
        <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
      </Dialog>
    )
  }, [selectedManifest, connectorView, manifestIndex, manifestStore, expressions, allowableTypes, isEditMode])

  const [list, updateList] = useState(listOfManifests)
  /* istanbul ignore next */
  const onDragEnd = (result: DropResult): unknown => {
    if (!result.destination) {
      return
    }
    const res = Array.from(formik.values.spec?.overrides ? listOfManifests : [])
    const [removed] = res.splice(result.source.index, 1)
    res.splice(result.destination.index, 0, removed)
    updateList(res)
    set(formik, 'values.spec.overrides', res)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Layout.Vertical width={'100%'}>
          <Label className={css.k8ValLabel}>
            {getString('optionalField', { name: getString('cd.overrideValue') })}
          </Label>
          <div className={cx(stepCss.formGroup, css.k8VarMargin)}>
            <Droppable droppableId="droppable-1">
              {(provided, _) => (
                <div ref={provided.innerRef}>
                  {list.map((item: ManifestConfigWrapper, i: number) => (
                    <Draggable
                      key={item.manifest?.identifier}
                      draggableId={item.manifest ? item.manifest.identifier : ''}
                      index={i}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            boxShadow: snapshot.isDragging ? '0 0 .4rem #666' : 'none'
                          }}
                        >
                          <Layout.Horizontal>
                            <Icon name="drag-handle-vertical" className={css.drag} />
                            <Text className={css.text}>{`${i + 1}.`} </Text>
                            <div className={css.configField}>
                              <Text className={css.manifestId} lineClamp={1}>
                                {item.manifest?.identifier}
                              </Text>
                              <Button
                                minimal
                                icon="Edit"
                                withoutBoxShadow
                                iconProps={{ size: 16 }}
                                onClick={() => {
                                  editManifest(
                                    item.manifest?.type as K8sManifestTypes,
                                    item.manifest?.spec?.store?.type as K8sManifestStores,
                                    i
                                  )
                                }}
                                data-name="config-edit"
                                withoutCurrentColor={true}
                              />
                            </div>
                            <Button
                              icon="main-trash"
                              className={css.deleteBtn}
                              data-testid={`remove-${item.manifest?.identifier}-${i}`}
                              onClick={() => removeManifestConfig(i)}
                              minimal
                            />
                          </Layout.Horizontal>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </Layout.Vertical>
      </DragDropContext>
      <Button
        className={css.addManifest}
        id="add-manifest"
        size={ButtonSize.SMALL}
        variation={ButtonVariation.LINK}
        data-testid="addManifest"
        onClick={addNewManifest}
        text={getString('pipelineSteps.serviceTab.manifestList.addManifest')}
      />
    </>
  )
}

export default K8sOverrideValuesListView
