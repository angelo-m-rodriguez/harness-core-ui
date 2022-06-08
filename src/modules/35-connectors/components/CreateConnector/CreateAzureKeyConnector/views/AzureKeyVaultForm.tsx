/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import * as Yup from 'yup'
import { StepProps, Container, Text, Formik, FormikForm, Layout, Button, ButtonVariation } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { AzureKeyVaultConnectorDTO } from 'services/cd-ng'
import { PageSpinner } from '@common/components'
import { setupAzureKeyVaultFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import type { StepDetailsProps, ConnectorDetailsProps } from '@connectors/interfaces/ConnectorInterface'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import AzureKeyVaultFormFields from './AzureKeyVaultFormFields'
import css from '../CreateAzureKeyVaultConnector.module.scss'

export interface AzureKeyVaultFormData {
  clientId?: string
  secretKey?: SecretReference
  tenantId?: string
  subscription?: string
  default?: boolean
}

const AzureKeyVaultForm: React.FC<StepProps<StepDetailsProps> & ConnectorDetailsProps> = props => {
  const { prevStepData, previousStep, isEditMode, nextStep, connectorInfo, accountId } = props
  const { getString } = useStrings()

  const defaultInitialFormData: AzureKeyVaultFormData = {
    clientId: undefined,
    tenantId: undefined,
    subscription: undefined,
    secretKey: undefined,
    default: false
  }

  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingFormData, setLoadingFormData] = useState(isEditMode)
  useConnectorWizard({
    helpPanel: { referenceId: 'AzureKeyVaultDetails', contentWidth: 900 }
  })
  React.useEffect(() => {
    if (isEditMode && connectorInfo) {
      setupAzureKeyVaultFormData(connectorInfo, accountId).then(data => {
        setInitialValues(data as AzureKeyVaultFormData)
        setLoadingFormData(false)
      })
    }
  }, [isEditMode, connectorInfo])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.AzureKeyValueFormLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Container padding={{ top: 'medium' }}>
      <Text font={{ variation: FontVariation.H3 }} padding={{ bottom: 'xlarge' }}>
        {getString('details')}
      </Text>
      <Formik<AzureKeyVaultFormData>
        formName="azureKeyVaultForm"
        enableReinitialize
        initialValues={{ ...initialValues, ...prevStepData }}
        validationSchema={Yup.object().shape({
          clientId: Yup.string().required(getString('common.validation.clientIdIsRequired')),
          tenantId: Yup.string().required(getString('connectors.azureKeyVault.validation.tenantId')),
          subscription: Yup.string().required(getString('connectors.azureKeyVault.validation.subscription')),
          secretKey: Yup.string().when('vaultName', {
            is: () => !(prevStepData?.spec as AzureKeyVaultConnectorDTO)?.vaultName,
            then: Yup.string().trim().required(getString('common.validation.keyIsRequired'))
          })
        })}
        onSubmit={formData => {
          trackEvent(ConnectorActions.AzureKeyValueFormSubmit, {
            category: Category.CONNECTOR
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData } as StepDetailsProps)
        }}
      >
        <FormikForm>
          <Container className={css.formHeight} margin={{ top: 'medium', bottom: 'xxlarge' }}>
            <AzureKeyVaultFormFields />
          </Container>
          <Layout.Horizontal spacing="medium">
            <Button
              variation={ButtonVariation.SECONDARY}
              icon="chevron-left"
              text={getString('back')}
              onClick={() => previousStep?.(prevStepData)}
            />
            <Button
              type="submit"
              intent="primary"
              rightIcon="chevron-right"
              text={getString('continue')}
              disabled={loadingFormData}
            />
          </Layout.Horizontal>
        </FormikForm>
      </Formik>
      {loadingFormData ? <PageSpinner /> : null}
    </Container>
  )
}

export default AzureKeyVaultForm
