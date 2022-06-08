/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import * as Yup from 'yup'
import { StepProps, Container, Text, Formik, FormikForm, FormInput, Layout, Button } from '@wings-software/uicore'
import type {
  ConnectorDetailsProps,
  StepDetailsProps,
  GcpKmsConfigFormData
} from '@connectors/interfaces/ConnectorInterface'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import { PageSpinner } from '@common/components'
import { useStrings } from 'framework/strings'
import { setupGcpKmsFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { Connectors } from '@connectors/constants'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import css from '../CreateGcpKmsConnector.module.scss'

const defaultInitialFormData: GcpKmsConfigFormData = {
  projectId: '',
  region: '',
  keyRing: '',
  keyName: '',
  default: false
}

const GcpKmsConfig: React.FC<StepProps<StepDetailsProps> & ConnectorDetailsProps> = ({
  isEditMode,
  prevStepData,
  nextStep,
  connectorInfo,
  previousStep,
  accountId
}) => {
  const { getString } = useStrings()
  const [loadingFormData, setLoadingFormData] = useState(isEditMode)
  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  useConnectorWizard({ helpPanel: { referenceId: 'GCPKeyManagementServiceDetails', contentWidth: 900 } })

  useEffect(() => {
    if (isEditMode && connectorInfo && accountId) {
      setupGcpKmsFormData(connectorInfo, accountId).then(data => {
        setInitialValues(data as GcpKmsConfigFormData)
        setLoadingFormData(false)
      })
    }
  }, [isEditMode, connectorInfo, accountId])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ConfigLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.GcpKms
  })

  return loadingFormData ? (
    <PageSpinner />
  ) : (
    <Container padding={{ top: 'medium' }}>
      <Text font={{ size: 'medium' }} padding={{ bottom: 'xlarge' }}>
        {getString('details')}
      </Text>
      <Formik
        formName="gcpKmsConfig"
        enableReinitialize
        initialValues={{ ...initialValues, ...prevStepData }}
        validationSchema={Yup.object().shape({
          projectId: Yup.string().trim().required(getString('validation.projectIDRequired')),
          region: Yup.string().trim().required(getString('validation.regionRequired')),
          keyRing: Yup.string().trim().required(getString('connectors.gcpKms.keyRingRequired')),
          keyName: Yup.string().trim().required(getString('connectors.gcpKms.keyNameRequired')),
          credentials: Yup.object().required(getString('connectors.gcpKms.credentialsFileRequired'))
        })}
        onSubmit={formData => {
          trackEvent(ConnectorActions.ConfigSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.GcpKms
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData } as StepDetailsProps)
        }}
      >
        <FormikForm>
          <Container margin={{ top: 'medium', bottom: 'xxlarge' }} className={css.container}>
            <FormInput.Text name="projectId" label={getString('pipelineSteps.projectIDLabel')} />
            <FormInput.Text name="region" label={getString('regionLabel')} />
            <FormInput.Text name="keyRing" label={getString('connectors.gcpKms.keyRing')} />
            <FormInput.Text name="keyName" label={getString('connectors.gcpKms.keyName')} />
            <SecretInput
              name="credentials"
              label={getString('connectors.gcpKms.credentialsFile')}
              type="SecretFile"
              connectorTypeContext={Connectors.GCP_KMS}
            />
            <FormInput.CheckBox
              name="default"
              label={getString('connectors.hashiCorpVault.defaultVault')}
              padding={{ left: 'xxlarge' }}
            />
          </Container>
          <Layout.Horizontal spacing="medium">
            <Button text={getString('back')} onClick={() => previousStep?.(prevStepData)} />
            <Button type="submit" intent="primary" rightIcon="chevron-right" text={getString('continue')} />
          </Layout.Horizontal>
        </FormikForm>
      </Formik>
    </Container>
  )
}

export default GcpKmsConfig
