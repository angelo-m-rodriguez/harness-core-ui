/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { StepWizard } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import { Color } from '@harness/design-system'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER, TESTCONNECTION_STEP_INDEX } from '@connectors/constants'
import type { ConnectorConfigDTO, ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'

import { getConnectorTitleIdByType, getConnectorIconByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useStrings } from 'framework/strings'
import StepHelmAuth from '@connectors/components/CreateConnector/HelmRepoConnector/StepHelmRepoAuth'
import { buildHelmPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'

interface CreateHelmConnectorProps {
  onConnectorCreated?: (data?: ConnectorConfigDTO) => void | Promise<void>
  mock?: ResponseBoolean
  onClose: () => void
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo?: ConnectorInfoDTO | void
  gitDetails?: IGitContextFormProps
  context?: number
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}
const HelmRepoConnector: React.FC<CreateHelmConnectorProps> = props => {
  const { getString } = useStrings()
  const commonProps = pick(props, ['accountId', 'orgIdentifier', 'projectIdentifier', 'isEditMode', 'setIsEditMode'])

  // const [isEditMode, setIsEditMode] = React.useState(props?.isEditMode || true)
  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.HttpHelmRepo)}
      iconProps={{ size: 50, color: Color.WHITE }}
      title={getString(getConnectorTitleIdByType(Connectors.HttpHelmRepo))}
    >
      <ConnectorDetailsStep
        type={Connectors.HttpHelmRepo}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        mock={props.mock}
        helpPanelReferenceId="HTTPHelmServerOverview"
      />
      <StepHelmAuth
        name={getString('details')}
        identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
        {...commonProps}
        onConnectorCreated={props.onConnectorCreated}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        setIsEditMode={props.setIsEditMode}
      />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        isEditMode={props.isEditMode}
        setIsEditMode={props.setIsEditMode}
        buildPayload={buildHelmPayload}
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
        type={Connectors.HttpHelmRepo}
        onClose={props.onClose}
        stepIndex={TESTCONNECTION_STEP_INDEX}
        helpPanelReferenceId="ConnectorTest"
      />
    </StepWizard>
  )
}

export default HelmRepoConnector
