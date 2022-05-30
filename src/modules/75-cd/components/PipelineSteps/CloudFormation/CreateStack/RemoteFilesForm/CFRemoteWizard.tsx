/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { isNumber } from 'lodash-es'
import { useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  StepWizard,
  MultiTypeInputType,
  SelectOption,
  getMultiTypeFromValue
} from '@harness/uicore'
import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import {
  ConnectorMap,
  getBuildPayload,
  ConnectorTypes,
  GetNewConnector,
  ConnectorStepTitle,
  FileStoreTitle
} from '../../CloudFormationHelper'
import RemoteStepOne from './RemoteStepOne'
import RemoteStepTwo from './RemoteStepTwo'
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

interface CFRemoteWizardProps {
  readonly: boolean
  allowableTypes: MultiTypeInputType[]
  showModal: boolean
  onClose: () => void
  initialValues: any
  setFieldValue: (field: string, data: any) => void
  index: number | undefined
  regions: SelectOption[]
}

const CFRemoteWizard = ({
  readonly,
  allowableTypes,
  showModal,
  onClose,
  initialValues,
  setFieldValue,
  index = undefined,
  regions
}: CFRemoteWizardProps): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [isEditMode, setIsEditMode] = useState(false)
  const [showNewConnector, setShowNewConnector] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState('')
  const connectorStepTitle = getString(ConnectorStepTitle(isNumber(index)))
  const fileStoreTitle = getString(FileStoreTitle(isNumber(index)))
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
    const config = values?.spec?.configuration
    const newConnId = prevStepData?.identifier
    if (isNumber(index)) {
      let paths = config?.parameters?.store?.spec?.paths
      paths = getMultiTypeFromValue(paths[0]) === MultiTypeInputType.RUNTIME ? paths[0] : paths
      const connectorRef =
        config?.parameters?.store?.spec?.connectorRef?.value || config?.parameters?.store?.spec?.connectorRef
      const data = {
        identifier: config?.parameters?.identifier,
        store: {
          ...config?.parameters?.store,
          spec: {
            ...config?.parameters?.store?.spec,
            // if a new connector is created override the previous
            connectorRef: newConnId || connectorRef,
            paths
          }
        }
      }
      setFieldValue(`spec.configuration.parameters[${index}]`, data)
    } else {
      let paths = config?.templateFile?.spec?.store?.spec?.paths
      paths = getMultiTypeFromValue(paths[0]) === MultiTypeInputType.RUNTIME ? paths[0] : paths
      const connectorRef =
        config.templateFile.spec.store.spec?.connectorRef?.value || config.templateFile.spec.store.spec?.connectorRef
      const data = {
        ...config.templateFile.spec.store,
        spec: {
          ...config.templateFile.spec.store.spec,
          // if a new connector is created override the previous
          connectorRef: newConnId || connectorRef,
          paths
        }
      }
      setFieldValue(`spec.configuration.templateFile.spec.store`, data)
    }
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
          title={fileStoreTitle}
          className={css.configWizard}
          onStepChange={onStepChange}
          icon="service-cloudformation"
          iconProps={{
            size: 50
          }}
        >
          <RemoteStepOne
            isReadonly={readonly}
            allowableTypes={allowableTypes}
            name={connectorStepTitle}
            setShowNewConnector={setShowNewConnector}
            selectedConnector={selectedConnector}
            setSelectedConnector={setSelectedConnector}
            initialValues={initialValues}
            index={index}
            regions={regions}
          />
          {showNewConnector ? newConnector() : null}
          <RemoteStepTwo
            name={fileStoreTitle}
            allowableTypes={allowableTypes}
            initialValues={initialValues}
            onSubmit={onSubmit}
            index={index}
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

export default CFRemoteWizard
