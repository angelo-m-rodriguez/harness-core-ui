/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { Container, FormikForm, Layout, FormInput, Formik, Button, Text } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { buildPrometheusPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { initializePrometheusConnectorWithStepData } from './utils'
import { CustomHealthKeyValueMapper } from '../CustomHealthConnector/components/CustomHealthKeyValueMapper/CustomHealthKeyValueMapper'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import { HeadersKey } from './CreatePrometheusConnector.constants'
import css from './CreatePrometheusConnector.module.scss'

export function PrometheusConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { nextStep, prevStepData, connectorInfo, projectIdentifier, orgIdentifier, accountId } = props
  const { getString } = useStrings()

  const DefaultInitialValues = {
    url: undefined,
    username: undefined,
    passwordRef: undefined,
    accountId,
    projectIdentifier,
    orgIdentifier
  }

  const [initialValues, setInitialValues] = useState<ConnectorConfigDTO>(DefaultInitialValues)

  useEffect(() => {
    initializePrometheusConnectorWithStepData(prevStepData, {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    })
      .then(updatedInitialValues => {
        if (updatedInitialValues) {
          setInitialValues({ ...updatedInitialValues })
        }
      })
      .catch(() => setInitialValues(DefaultInitialValues))
  }, [accountId, orgIdentifier, prevStepData, projectIdentifier])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Prometheus
  })

  return (
    <Container className={css.credentials}>
      <StepDetailsHeader connectorTypeLabel={getString('connectors.prometheusLabel')} />
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        validationSchema={Yup.object().shape({
          url: Yup.string().trim().required(getString('connectors.prometheus.urlValidation'))
        })}
        formName="prometheusConnForm"
        onSubmit={(formData: ConnectorConfigDTO) => {
          trackEvent(ConnectorActions.CreateConnectorSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.Prometheus
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData })
        }}
      >
        {formik => (
          <FormikForm className={css.form}>
            <FormInput.Text label={getString('UrlLabel')} name="url" />
            <Text margin={{ bottom: 'medium' }} font={{ variation: FontVariation.CARD_TITLE }}>
              {getString('connectors.optionalAuthentication')}
            </Text>
            <FormInput.Text label={getString('username')} name="username" />
            <SecretInput name={'passwordRef'} label={getString('password')} />
            <Text margin={{ bottom: 'medium' }} font={{ variation: FontVariation.CARD_TITLE }}>
              {getString('common.headers')}
            </Text>
            <CustomHealthKeyValueMapper
              name={HeadersKey}
              formik={formik}
              prevStepData={prevStepData as ConnectorConfigDTO}
              addRowButtonLabel={getString('connectors.addHeader')}
              className={css.keyValue}
            />
            <Layout.Horizontal spacing="large">
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
  connectorType: 'Prometheus',
  ConnectorCredentialsStep: PrometheusConfigStep,
  buildSubmissionPayload: buildPrometheusPayload
})
