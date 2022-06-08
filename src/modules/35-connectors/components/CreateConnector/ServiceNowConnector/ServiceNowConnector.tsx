/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { StepWizard } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER, TESTCONNECTION_STEP_INDEX } from '@connectors/constants'
import type { ConnectorConfigDTO, ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'

import { getConnectorTitleIdByType, getConnectorIconByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useStrings } from 'framework/strings'
import { buildServiceNowPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import ServiceNowDetailsForm from './ServiceNowDetailsForm'

interface CreateServiceNowConnectorProps {
  onConnectorCreated?: (data?: ConnectorConfigDTO) => void | Promise<void>
  mock?: ResponseBoolean
  onClose: () => void
  isEditMode?: boolean
  connectorInfo?: ConnectorInfoDTO | void
  gitDetails?: IGitContextFormProps
  context?: number
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}
const ServiceNowConnector: React.FC<CreateServiceNowConnectorProps> = props => {
  const { getString } = useStrings()
  const commonProps = pick(props, ['accountId', 'orgIdentifier', 'projectIdentifier'])

  const [isEditMode, setIsEditMode] = React.useState(props?.isEditMode || false)
  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.SERVICE_NOW)}
      iconProps={{ size: 50 }}
      title={getString(getConnectorTitleIdByType(Connectors.SERVICE_NOW))}
    >
      <ConnectorDetailsStep
        type={Connectors.SERVICE_NOW}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        mock={props.mock}
        helpPanelReferenceId="ServiceNowConnectorOverview"
      />
      <ServiceNowDetailsForm
        name={getString('details')}
        identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
        {...commonProps}
        onConnectorCreated={props.onConnectorCreated}
        isEditMode={isEditMode}
        connectorInfo={props.connectorInfo}
        setIsEditMode={setIsEditMode}
      />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        buildPayload={buildServiceNowPayload}
        hideModal={props.onClose}
        onConnectorCreated={props.onConnectorCreated}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        helpPanelReferenceId="ConnectorDelegatesSetup"
      />
      <VerifyOutOfClusterDelegate
        name={getString('connectors.stepThreeName')}
        connectorInfo={props.connectorInfo}
        isStep={true}
        isLastStep={true}
        type={Connectors.SERVICE_NOW}
        onClose={props.onClose}
        stepIndex={TESTCONNECTION_STEP_INDEX}
        helpPanelReferenceId="ConnectorTest"
      />
    </StepWizard>
  )
}

export default ServiceNowConnector
