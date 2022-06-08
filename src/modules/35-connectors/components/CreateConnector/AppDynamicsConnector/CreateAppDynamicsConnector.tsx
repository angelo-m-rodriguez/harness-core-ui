/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Color } from '@harness/design-system'
import { Layout, Button, Text, FormInput, FormikForm, Container } from '@wings-software/uicore'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import { AppDynamicsAuthType, buildAppDynamicsPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import {
  ConnectorSecretField,
  ConnectorSecretFieldProps
} from '../CommonCVConnector/components/ConnectorSecretField/ConnectorSecretField'
import { initializeAppDConnector } from './utils'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import { Connectors } from '../../../constants'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import styles from './CreateAppDynamicsConnector.module.scss'

interface UsernamePasswordAndApiClientOptionProps extends Omit<ConnectorSecretFieldProps, 'secretInputProps'> {
  onAuthTypeChange: (authType: string) => void
  authTypeValue?: string
}

function UsernamePasswordAndApiClientOption(props: UsernamePasswordAndApiClientOptionProps): JSX.Element {
  const {
    onAuthTypeChange,
    authTypeValue,
    accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    onSuccessfulFetch,
    secretFieldValue
  } = props
  const { getString } = useStrings()
  const authOptions = useMemo(
    () => [
      { label: getString('usernamePassword'), value: AppDynamicsAuthType.USERNAME_PASSWORD },
      { label: getString('connectors.appD.apiClient'), value: AppDynamicsAuthType.API_CLIENT_TOKEN }
    ],
    []
  )

  const fieldProps =
    authTypeValue === AppDynamicsAuthType.API_CLIENT_TOKEN
      ? [
          { name: 'clientId', label: getString('connectors.appD.clientId'), key: 'clientId' },
          { name: 'clientSecretRef', label: getString('common.clientSecret'), key: 'clientSecretRef' }
        ]
      : [
          { name: 'username', label: getString('username'), key: 'username' },
          { name: 'password', label: getString('password'), key: 'password' }
        ]
  return (
    <Container>
      <Container flex style={{ alignItems: 'baseline' }}>
        <Text color={Color.BLACK} font={{ weight: 'bold' }}>
          {getString('authentication')}
        </Text>
        <FormInput.Select
          name="authType"
          items={authOptions}
          className={commonStyles.authTypeSelect}
          onChange={updatedAuth => onAuthTypeChange(updatedAuth.value as string)}
        />
      </Container>
      <FormInput.Text {...fieldProps[0]} />
      <ConnectorSecretField
        secretInputProps={fieldProps[1]}
        accountIdentifier={accountIdentifier}
        projectIdentifier={projectIdentifier}
        orgIdentifier={orgIdentifier}
        secretFieldValue={secretFieldValue}
        onSuccessfulFetch={onSuccessfulFetch}
      />
    </Container>
  )
}

function AppDynamicsConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { getString } = useStrings()
  const { nextStep, prevStepData, connectorInfo, accountId, projectIdentifier, orgIdentifier } = props
  const initialValues = initializeAppDConnector({ prevStepData, projectIdentifier, accountId, orgIdentifier })
  const handleSubmit = (formData: ConnectorConfigDTO) => {
    trackEvent(ConnectorActions.CreateConnectorSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.AppDynamics
    })
    nextStep?.({ ...connectorInfo, ...prevStepData, ...formData })
  }

  const { spec, ...prevData } = props.prevStepData || {}
  let secretFieldValue: any
  if (initialValues.authType === AppDynamicsAuthType.USERNAME_PASSWORD) {
    secretFieldValue = prevData?.password?.referenceString || spec?.passwordRef
  } else if (initialValues.authType === AppDynamicsAuthType.API_CLIENT_TOKEN) {
    secretFieldValue = prevData?.clientSecretRef?.referenceString || spec?.clientSecretRef
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.AppDynamics
  })

  return (
    <>
      <StepDetailsHeader connectorTypeLabel={getString('connectors.appdLabel')} />
      <Formik
        enableReinitialize
        initialValues={{
          ...initialValues
        }}
        validationSchema={Yup.object().shape({
          url: Yup.string().trim().required(getString('connectors.appD.validation.controllerURL')),
          accountName: Yup.string().trim().required(getString('validation.accountName')),
          authType: Yup.string().trim(),
          username: Yup.string()
            .nullable()
            .when('authType', {
              is: AppDynamicsAuthType.USERNAME_PASSWORD,
              then: Yup.string().required(getString('validation.username'))
            }),
          password: Yup.string()
            .nullable()
            .when('authType', {
              is: AppDynamicsAuthType.USERNAME_PASSWORD,
              then: Yup.string().required(getString('validation.password'))
            }),
          clientId: Yup.string()
            .nullable()
            .when('authType', {
              is: AppDynamicsAuthType.API_CLIENT_TOKEN,
              then: Yup.string().required(getString('connectors.appD.validation.clientId'))
            }),
          clientSecretRef: Yup.string()
            .nullable()
            .when('authType', {
              is: AppDynamicsAuthType.API_CLIENT_TOKEN,
              then: Yup.string().required(getString('connectors.appD.validation.clientSecret'))
            })
        })}
        onSubmit={handleSubmit}
      >
        {formikProps => (
          <FormikForm className={styles.connectionForm}>
            <Layout.Vertical spacing="large" className={styles.appDContainer}>
              <FormInput.Text label={getString('connectors.appD.controllerURL')} name="url" />
              <FormInput.Text label={getString('connectors.appD.accountName')} name="accountName" />
              <UsernamePasswordAndApiClientOption
                accountIdentifier={props.accountId}
                projectIdentifier={props.projectIdentifier}
                orgIdentifier={props.orgIdentifier}
                secretFieldValue={secretFieldValue}
                onSuccessfulFetch={result => {
                  if (initialValues.authType === AppDynamicsAuthType.API_CLIENT_TOKEN) {
                    formikProps.setFieldValue('clientSecretRef', result)
                  } else if (initialValues.authType === AppDynamicsAuthType.USERNAME_PASSWORD) {
                    formikProps.setFieldValue('password', result)
                  }
                }}
                authTypeValue={formikProps.values.authType}
                onAuthTypeChange={updatedAuth => {
                  if (updatedAuth === AppDynamicsAuthType.API_CLIENT_TOKEN) {
                    formikProps.setValues({
                      ...formikProps.values,
                      authType: updatedAuth,
                      username: null,
                      password: null
                    })
                  } else if (updatedAuth === AppDynamicsAuthType.USERNAME_PASSWORD) {
                    formikProps.setValues({
                      ...formikProps.values,
                      authType: updatedAuth,
                      clientId: null,
                      clientSecretRef: null
                    })
                  }
                }}
              />
            </Layout.Vertical>
            <Layout.Horizontal spacing="large">
              <Button onClick={() => props.previousStep?.({ ...props.prevStepData })} text={getString('back')} />
              <Button type="submit" intent="primary" text={getString('continue')} />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </>
  )
}

export default cvConnectorHOC({
  connectorType: 'AppDynamics',
  ConnectorCredentialsStep: AppDynamicsConfigStep,
  buildSubmissionPayload: buildAppDynamicsPayload
})
