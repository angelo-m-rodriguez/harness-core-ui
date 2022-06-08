/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { Container, Formik, FormikForm, Button, Layout, FormInput } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { buildDynatracePayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { Connectors } from '@connectors/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import { initializeDynatraceConnectorWithStepData } from './utils'
import { ConnectorSecretField } from '../CommonCVConnector/components/ConnectorSecretField/ConnectorSecretField'
import css from './CreateDynatraceConnector.module.scss'

export function DynatraceConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { nextStep, prevStepData, connectorInfo, projectIdentifier, orgIdentifier, accountId } = props
  const { getString } = useStrings()
  const initialValues = initializeDynatraceConnectorWithStepData({
    prevStepData,
    accountId,
    projectIdentifier,
    orgIdentifier
  })
  const secretValue = prevStepData?.apiTokenRef?.referenceString || prevStepData?.spec?.apiTokenRef

  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Dynatrace
  })

  return (
    <Container className={css.credentials}>
      <StepDetailsHeader connectorTypeLabel={getString('connectors.dynatraceLabel')} />
      <Formik
        formName="createDynatraceConnectorForm"
        initialValues={{ ...initialValues }}
        validationSchema={Yup.object().shape({
          url: Yup.string().trim().required(getString('connectors.dynatrace.urlValidation')),
          apiTokenRef: Yup.string().trim().required(getString('connectors.dynatrace.apiTokenValidation'))
        })}
        onSubmit={(formData: ConnectorConfigDTO) => {
          trackEvent(ConnectorActions.CreateConnectorSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.Dynatrace
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData })
        }}
      >
        {formikProps => (
          <FormikForm className={css.form}>
            <FormInput.Text label={getString('UrlLabel')} name="url" />
            <ConnectorSecretField
              secretFieldValue={secretValue}
              secretInputProps={{ label: getString('connectors.dynatrace.apiToken'), name: 'apiTokenRef' }}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              onSuccessfulFetch={result => formikProps.setFieldValue('apiTokenRef', result)}
            />
            <Layout.Horizontal spacing="large" className={css.buttonContainer}>
              <Button onClick={() => props.previousStep?.({ ...props.prevStepData })} text={getString('back')} />
              <Button type="submit" text={getString('next')} intent="primary" />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}

export default cvConnectorHOC({
  connectorType: 'Dynatrace',
  ConnectorCredentialsStep: DynatraceConfigStep,
  buildSubmissionPayload: buildDynatracePayload
})
