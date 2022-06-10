/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import {
  Connectors,
  CONNECTOR_CREDENTIALS_STEP_IDENTIFIER,
  CreateConnectorModalProps,
  GIT_TESTCONNECTION_STEP_INDEX
} from '@connectors/constants'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { useStrings } from 'framework/strings'
import { getConnectorIconByType, getConnectorTitleIdByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import { buildAzureRepoPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import GitDetailsStep from '../commonSteps/GitDetailsStep'
import StepAzureRepoAuthentication from './StepAuth/StepAzureRepoAuthentication'
import css from './CreateAzureRepoConnector.module.scss'

const CreateAzureRepoConnector = (props: CreateConnectorModalProps): JSX.Element => {
  const { getString } = useStrings()
  const commonProps = pick(props, [
    'isEditMode',
    'connectorInfo',
    'gitDetails',
    'setIsEditMode',
    'accountId',
    'orgIdentifier',
    'projectIdentifier'
  ])

  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.AZURE_REPO)}
      iconProps={{ size: 50 }}
      className={css.azureRepoConnector}
      title={getString(getConnectorTitleIdByType(Connectors.AZURE_REPO))}
    >
      <ConnectorDetailsStep
        type={Connectors.AZURE_REPO}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        mock={props.mock}
      />
      <GitDetailsStep
        type={Connectors.AZURE_REPO}
        name={getString('details')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        mock={props.mock}
      />
      <StepAzureRepoAuthentication
        name={getString('credentials')}
        identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
        {...commonProps}
        onConnectorCreated={props.onSuccess}
      />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        isEditMode={props.isEditMode}
        setIsEditMode={props.setIsEditMode}
        buildPayload={buildAzureRepoPayload}
        hideModal={props.onClose}
        onConnectorCreated={props.onSuccess}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
      />
      <VerifyOutOfClusterDelegate
        type={Connectors.AZURE_REPO}
        name={getString('connectors.stepThreeName')}
        connectorInfo={props.connectorInfo}
        isStep={true}
        isLastStep={true}
        onClose={props.onClose}
        stepIndex={GIT_TESTCONNECTION_STEP_INDEX}
      />
    </StepWizard>
  )
}

export default CreateAzureRepoConnector
