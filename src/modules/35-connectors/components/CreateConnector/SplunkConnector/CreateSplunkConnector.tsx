/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Button, FormInput, FormikForm } from '@wings-software/uicore'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { buildSplunkPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { Connectors } from '@connectors/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { ConnectorSecretField } from '../CommonCVConnector/components/ConnectorSecretField/ConnectorSecretField'
import { initializeSplunkConnector } from './utils'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import css from '../AppDynamicsConnector/CreateAppDynamicsConnector.module.scss'

function SplunkConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { nextStep, prevStepData, connectorInfo, accountId, projectIdentifier, orgIdentifier } = props
  const { getString } = useStrings()
  const initialValues = initializeSplunkConnector({ prevStepData, accountId, projectIdentifier, orgIdentifier })

  const handleSubmit = (formData: ConnectorConfigDTO) => {
    trackEvent(ConnectorActions.CreateConnectorSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.Splunk
    })
    nextStep?.({ ...connectorInfo, ...prevStepData, ...formData })
  }
  const secretValue = prevStepData?.passwordRef?.referenceString || prevStepData?.spec?.passwordRef

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Splunk
  })

  return (
    <Formik
      initialValues={{
        ...initialValues
      }}
      validationSchema={Yup.object().shape({
        url: Yup.string().trim().required(getString('common.validation.urlIsRequired')),
        username: Yup.string().trim().required(getString('validation.username')),
        passwordRef: Yup.string().trim().required(getString('validation.password'))
      })}
      onSubmit={handleSubmit}
    >
      {formikProps => (
        <FormikForm className={css.connectionForm}>
          <Layout.Vertical spacing="large" className={css.appDContainer}>
            <StepDetailsHeader connectorTypeLabel={getString('connectors.splunkLabel')} />
            <FormInput.Text label={getString('UrlLabel')} name="url" />
            <FormInput.Text name="username" label={getString('username')} />
            <ConnectorSecretField
              secretInputProps={{ name: 'passwordRef', label: getString('password') }}
              secretFieldValue={secretValue}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              onSuccessfulFetch={result => {
                formikProps.setFieldValue('passwordRef', result)
              }}
            />
          </Layout.Vertical>
          <Layout.Horizontal spacing="large">
            <Button onClick={() => props.previousStep?.({ ...props.prevStepData })} text={getString('back')} />
            <Button type="submit" text={getString('connectors.connectAndSave')} />
          </Layout.Horizontal>
        </FormikForm>
      )}
    </Formik>
  )
}

export default cvConnectorHOC({
  connectorType: 'Splunk',
  ConnectorCredentialsStep: SplunkConfigStep,
  buildSubmissionPayload: buildSplunkPayload
})
