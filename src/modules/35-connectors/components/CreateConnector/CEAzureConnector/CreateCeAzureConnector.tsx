import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { Connectors, CreateConnectorModalProps } from '@connectors/constants'
import { getConnectorIconByType, getConnectorTitleIdByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { useStrings } from 'framework/strings'
import CreateServicePrincipal from './CreateServicePrincipal'

// This is an old implementation of the overview page of the Azure Connector creation process
// We will get rid of it once the new one is finalised.
// Contact me for any questions - akash.bhardwaj@harness.io
// import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
// import AzureBillingInfo from './AzureBillingInfo'
// Below is the new one:
import Overview from './Steps/Overview/AzureConnectorOverview'
import Billing from './Steps/Billing/AzureConnectorBilling'

import css from './CreateCeAzureConnector.module.scss'

const CreateCeAzureConnector: React.FC<CreateConnectorModalProps> = props => {
  const { getString } = useStrings()
  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.CE_AZURE)}
      iconProps={{ size: 40 }}
      title={getString(getConnectorTitleIdByType(Connectors.CE_AZURE))}
      className={css.azureConnector}
    >
      <Billing name={'Azure Billing Export'} />
      <Overview
        type={Connectors.CE_AZURE}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
      />
      <CreateServicePrincipal name={'Create Service Principal'} />
      <VerifyOutOfClusterDelegate
        name={getString('connectors.verifyConnection')}
        onClose={props.onClose}
        isStep
        isLastStep
        type={Connectors.CE_AZURE}
        connectorInfo={props.connectorInfo}
      />
    </StepWizard>
  )
}

export default CreateCeAzureConnector

{
  /* <AzureBillingInfo {...props} name={'Azure Connection Details'} onSuccess={props.onSuccess} /> */
}
