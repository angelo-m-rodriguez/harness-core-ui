/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  StepWizard,
  MultiTypeInputType,
  MultiSelectOption,
  getMultiTypeFromValue
} from '@harness/uicore'
import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import { ConnectorMap, getBuildPayload, ConnectorTypes, GetNewConnector } from '../../CloudFormationHelper'
import TagsStepOne from './TagsStepOne'
import TagsStepTwo from './TagsStepTwo'
import css from '../../CloudFormation.module.scss'

const DIALOG_PROPS = {
  usePortal: true,
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  enforceFocus: false,
  style: {
    width: 1175,
    minHeight: 640,
    borderLeft: 0,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden'
  }
}

interface StepChangeData<SharedObject> {
  prevStep?: number
  nextStep?: number
  prevStepData: SharedObject
}

interface RemoteTagsProps {
  readonly: boolean
  allowableTypes: MultiTypeInputType[]
  showModal: boolean
  onClose: () => void
  initialValues: any
  setFieldValue: (field: string, data: any) => void
  regions: MultiSelectOption[]
}

const RemoteTags = ({
  readonly,
  allowableTypes,
  showModal,
  onClose,
  initialValues,
  setFieldValue,
  regions
}: RemoteTagsProps): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [isEditMode, setIsEditMode] = useState(false)
  const [showNewConnector, setShowNewConnector] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState('')
  /* istanbul ignore next */
  const close = () => {
    setShowNewConnector(false)
    onClose()
  }
  /* istanbul ignore next */
  const onStepChange = (arg: StepChangeData<any>): void => {
    if (arg?.prevStep && arg?.nextStep && arg.prevStep > arg.nextStep && arg.nextStep <= 2) {
      setShowNewConnector(false)
    }
  }

  const newConnector = (): JSX.Element => {
    const connectorType = ConnectorMap[selectedConnector]
    const buildPayload = getBuildPayload(connectorType as ConnectorTypes)
    return (
      <StepWizard iconProps={{ size: 37 }} title={getString('connectors.createNewConnector')}>
        <ConnectorDetailsStep
          type={connectorType}
          name={getString('overview')}
          isEditMode={isEditMode}
          connectorInfo={undefined}
        />
        <GitDetailsStep
          type={connectorType}
          name={getString('details')}
          isEditMode={isEditMode}
          connectorInfo={undefined}
        />
        {GetNewConnector(
          connectorType,
          isEditMode,
          setIsEditMode,
          accountId,
          projectIdentifier,
          orgIdentifier,
          getString('credentials')
        )}
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
          type={connectorType}
        />
      </StepWizard>
    )
  }
  /* istanbul ignore next */
  const onSubmit = (values: any, prevStepData: any) => {
    const newConnId = prevStepData?.identifier
    const connectorRef = values?.spec?.store?.spec?.connectorRef
    let paths = values?.spec?.store?.spec?.paths
    paths = getMultiTypeFromValue(paths[0]) === MultiTypeInputType.RUNTIME ? paths[0] : paths
    const gitDetails = values?.spec?.store?.spec
    const data = {
      type: 'Remote',
      spec: {
        store: {
          type: values?.spec?.store?.type,
          spec: {
            connectorRef: newConnId ? newConnId : connectorRef,
            paths,
            ...(gitDetails?.repoName && { repoName: gitDetails?.repoName }),
            ...(gitDetails?.gitFetchType && { gitFetchType: gitDetails?.gitFetchType }),
            ...(gitDetails?.branch && { branch: gitDetails?.branch }),
            ...(gitDetails?.commitId && { commitId: gitDetails?.commitId }),
            ...(gitDetails?.region && { region: gitDetails?.region })
          }
        }
      }
    }
    setFieldValue('spec.configuration.tags', data)
    close()
  }

  return (
    <Dialog
      {...(DIALOG_PROPS as IDialogProps)}
      isOpen={showModal}
      isCloseButtonShown
      onClose={close}
      className={cx(css.modal, Classes.DIALOG)}
    >
      <div className={css.wizard}>
        <StepWizard
          title={getString('cd.cloudFormation.remoteTagsDetails')}
          className={css.configWizard}
          onStepChange={onStepChange}
          icon="service-cloudformation"
          iconProps={{
            size: 50
          }}
        >
          <TagsStepOne
            name={getString('cd.cloudFormation.tagsConnector')}
            isReadonly={readonly}
            allowableTypes={allowableTypes}
            setShowNewConnector={setShowNewConnector}
            selectedConnector={selectedConnector}
            setSelectedConnector={setSelectedConnector}
            initialValues={initialValues}
            regions={regions}
          />
          {showNewConnector ? newConnector() : null}
          <TagsStepTwo
            name={getString('cd.cloudFormation.tagsFileStore')}
            allowableTypes={allowableTypes}
            onSubmit={onSubmit}
            initialValues={initialValues}
          />
        </StepWizard>
      </div>
      <Button
        variation={ButtonVariation.ICON}
        icon="cross"
        iconProps={{ size: 18 }}
        onClick={close}
        className={css.crossIcon}
        data-testid="remoteClose"
      />
    </Dialog>
  )
}

export default RemoteTags
