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
import { buildOCIHelmPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'

interface CreateOCIHelmConnectorProps {
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
const OCIHelmConnector: React.FC<CreateOCIHelmConnectorProps> = props => {
  const { getString } = useStrings()
  const commonProps = pick(props, ['accountId', 'orgIdentifier', 'projectIdentifier', 'isEditMode', 'setIsEditMode'])

  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.OciHelmRepo)}
      iconProps={{ size: 50, color: Color.WHITE }}
      title={getString(getConnectorTitleIdByType(Connectors.OciHelmRepo))}
    >
      <ConnectorDetailsStep
        type={Connectors.OciHelmRepo}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        mock={props.mock}
      />
      <StepHelmAuth
        name={getString('details')}
        identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
        {...commonProps}
        onConnectorCreated={props.onConnectorCreated}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        setIsEditMode={props.setIsEditMode}
        isOCIHelm={true}
      />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        isEditMode={props.isEditMode}
        setIsEditMode={props.setIsEditMode}
        buildPayload={buildOCIHelmPayload}
        hideModal={props.onClose}
        onConnectorCreated={props.onConnectorCreated}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
      />
      <VerifyOutOfClusterDelegate
        name={getString('connectors.stepThreeName')}
        connectorInfo={props.connectorInfo}
        isStep={true}
        isLastStep={true}
        type={Connectors.OciHelmRepo}
        onClose={props.onClose}
        stepIndex={TESTCONNECTION_STEP_INDEX}
      />
    </StepWizard>
  )
}

export default OCIHelmConnector
