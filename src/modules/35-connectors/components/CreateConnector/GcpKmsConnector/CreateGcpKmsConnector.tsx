/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { getConnectorIconByType, getConnectorTitleIdByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useStrings } from 'framework/strings'
import { buildGcpKmsPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import {
  Connectors,
  CONNECTOR_CREDENTIALS_STEP_IDENTIFIER,
  CreateConnectorModalProps,
  TESTCONNECTION_STEP_INDEX
} from '@connectors/constants'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import GcpKmsConfig from './views/GcpKmsConfig'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'

const CreateGcpKmsConnector: React.FC<CreateConnectorModalProps> = props => {
  const { getString } = useStrings()

  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.GCP_KMS)}
      iconProps={{ size: 37 }}
      title={getString(getConnectorTitleIdByType(Connectors.GCP_KMS))}
    >
      <ConnectorDetailsStep
        type={Connectors.GCP_KMS}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        mock={props.mock}
        gitDetails={props.gitDetails}
        disableGitSync
        helpPanelReferenceId="GCPKeyManagementServiceOverview"
      />
      <GcpKmsConfig name={getString('details')} identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER} {...props} />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        buildPayload={buildGcpKmsPayload}
        disableGitSync
        {...props}
        helpPanelReferenceId="ConnectorDelegatesSetup"
      />
      <VerifyOutOfClusterDelegate
        name={getString('connectors.stepThreeName')}
        connectorInfo={props.connectorInfo}
        isStep
        onClose={props.onClose}
        isLastStep
        type={Connectors.GCP_KMS}
        stepIndex={TESTCONNECTION_STEP_INDEX}
        helpPanelReferenceId="ConnectorTest"
      />
    </StepWizard>
  )
}

export default CreateGcpKmsConnector
