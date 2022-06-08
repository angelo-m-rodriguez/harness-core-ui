/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import cx from 'classnames'
import {
  Layout,
  Button,
  Formik,
  FormInput,
  Text,
  FormikForm as Form,
  StepProps,
  Container,
  SelectOption,
  ButtonVariation,
  PageSpinner
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import type { FormikProps } from 'formik'
import { setupGithubFormData, GitConnectionType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'
import SSHSecretInput from '@secrets/components/SSHSecretInput/SSHSecretInput'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import { GitAuthTypes, GitAPIAuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { getCommonConnectorsValidationSchema } from '../../CreateConnectorUtils'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from './StepGitlabAuthentication.module.scss'
import commonCss from '../../commonSteps/ConnectorCommonStyles.module.scss'

interface StepGitlabAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface GitlabAuthenticationProps {
  onConnectorCreated: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface GitlabFormInterface {
  connectionType: string
  authType: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
  accessToken: SecretReferenceInterface | void
  installationId: string
  applicationId: string
  privateKey: SecretReferenceInterface | void
  sshKey: SecretReferenceInterface | void
  kerberosKey: SecretReferenceInterface | void
  apiAccessToken: SecretReferenceInterface | void
  enableAPIAccess: boolean
  apiAuthType: string
}

const defaultInitialFormData: GitlabFormInterface = {
  connectionType: GitConnectionType.HTTP,
  authType: GitAuthTypes.USER_PASSWORD,
  username: undefined,
  password: undefined,
  accessToken: undefined,
  installationId: '',
  applicationId: '',
  privateKey: undefined,
  sshKey: undefined,
  apiAccessToken: undefined,
  kerberosKey: undefined,
  enableAPIAccess: false,
  apiAuthType: GitAPIAuthTypes.TOKEN
}

const RenderGitlabAuthForm: React.FC<FormikProps<GitlabFormInterface>> = props => {
  const { getString } = useStrings()
  switch (props.values.authType) {
    case GitAuthTypes.USER_PASSWORD:
      return (
        <>
          <TextReference
            name="username"
            stringId="username"
            type={props.values.username ? props.values.username?.type : ValueType.TEXT}
          />
          <SecretInput name="password" label={getString('password')} />
        </>
      )
    case GitAuthTypes.USER_TOKEN:
      return (
        <>
          <TextReference
            name="username"
            stringId="username"
            type={props.values.username ? props.values.username?.type : ValueType.TEXT}
          />
          <SecretInput name="accessToken" label={getString('personalAccessToken')} />
        </>
      )
    case GitAuthTypes.KERBEROS:
      return (
        <>
          <SSHSecretInput name="kerberosKey" label={getString('kerberos')} />
        </>
      )
    default:
      return null
  }
}

const RenderAPIAccessForm: React.FC<FormikProps<GitlabFormInterface>> = props => {
  const { getString } = useStrings()
  switch (props.values.apiAuthType) {
    case GitAPIAuthTypes.TOKEN:
      return <SecretInput name="apiAccessToken" label={getString('personalAccessToken')} />
    default:
      return null
  }
}

const RenderAPIAccessFormWrapper: React.FC<FormikProps<GitlabFormInterface>> = formikProps => {
  const { getString } = useStrings()

  const apiAuthOptions: Array<SelectOption> = [
    {
      label: getString('personalAccessToken'),
      value: GitAPIAuthTypes.TOKEN
    }
  ]

  useEffect(() => {
    formikProps.setFieldValue('apiAuthType', GitAPIAuthTypes.TOKEN)
  }, [])

  return (
    <>
      <Container className={css.authHeaderRow}>
        <Text font={{ variation: FontVariation.H6 }}>{getString('common.git.APIAuthentication')}</Text>
        <FormInput.Select
          name="apiAuthType"
          items={apiAuthOptions}
          className={commonStyles.authTypeSelect}
          value={apiAuthOptions[0]}
        />
      </Container>
      <RenderAPIAccessForm {...formikProps} />
    </>
  )
}

const StepGitlabAuthentication: React.FC<StepProps<StepGitlabAuthenticationProps> & GitlabAuthenticationProps> =
  props => {
    const { getString } = useStrings()
    const { prevStepData, nextStep, accountId } = props
    const [initialValues, setInitialValues] = useState(defaultInitialFormData)
    const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)

    const authOptions: Array<SelectOption> = [
      {
        label: getString('usernamePassword'),
        value: GitAuthTypes.USER_PASSWORD
      },
      {
        label: getString('usernameToken'),
        value: GitAuthTypes.USER_TOKEN
      }
      // Disabling temp:
      // {
      //   label: getString('kerberos'),
      //   value: GitAuthTypes.KERBEROS
      // }
    ]

    useEffect(() => {
      if (loadingConnectorSecrets) {
        if (props.isEditMode) {
          if (props.connectorInfo) {
            setupGithubFormData(props.connectorInfo, accountId).then(data => {
              setInitialValues(data as GitlabFormInterface)
              setLoadingConnectorSecrets(false)
            })
          } else {
            setLoadingConnectorSecrets(false)
          }
        }
      }
    }, [loadingConnectorSecrets])

    const handleSubmit = (formData: ConnectorConfigDTO) => {
      trackEvent(ConnectorActions.AuthenticationStepSubmit, {
        category: Category.CONNECTOR,
        connector_type: Connectors.GitLab
      })
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepGitlabAuthenticationProps)
    }
    const { trackEvent } = useTelemetry()
    useTrackEvent(ConnectorActions.AuthenticationStepLoad, {
      category: Category.CONNECTOR,
      connector_type: Connectors.GitLab
    })

    return loadingConnectorSecrets ? (
      <PageSpinner />
    ) : (
      <Layout.Vertical width="60%" style={{ minHeight: 460 }} className={cx(css.secondStep, commonCss.stepContainer)}>
        <Text font={{ variation: FontVariation.H3 }}>{getString('credentials')}</Text>

        <Formik
          initialValues={{
            ...initialValues,
            ...prevStepData
          }}
          formName="stepGitlabAuth"
          validationSchema={getCommonConnectorsValidationSchema(getString).concat(
            Yup.object().shape({
              kerberosKey: Yup.object().when('authType', {
                is: val => val === GitAuthTypes.KERBEROS,
                then: Yup.object().required(getString('validation.kerberosKey')),
                otherwise: Yup.object().nullable()
              }),
              accessToken: Yup.object().when(['connectionType', 'authType'], {
                is: (connectionType, authType) =>
                  connectionType === GitConnectionType.HTTP && authType === GitAuthTypes.USER_TOKEN,
                then: Yup.object().required(getString('connectors.validation.personalAccessToken')),
                otherwise: Yup.object().nullable()
              }),
              apiAuthType: Yup.string().when('enableAPIAccess', {
                is: val => val,
                then: Yup.string().trim().required(getString('validation.authType'))
              }),
              apiAccessToken: Yup.object().when(['enableAPIAccess', 'apiAuthType'], {
                is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAPIAuthTypes.TOKEN,
                then: Yup.object().required(getString('connectors.validation.personalAccessToken')),
                otherwise: Yup.object().nullable()
              })
            })
          )}
          onSubmit={handleSubmit}
        >
          {formikProps => (
            <Form className={cx(commonCss.fullHeight, commonCss.fullHeightDivsWithFlex)}>
              <Container className={cx(css.stepFormWrapper, commonCss.paddingTop8)}>
                {formikProps.values.connectionType === GitConnectionType.SSH ? (
                  <Layout.Horizontal spacing="medium" flex={{ alignItems: 'baseline' }}>
                    <Text font={{ variation: FontVariation.H6 }}>{getString('authentication')}</Text>
                    <SSHSecretInput name="sshKey" label={getString('SSH_KEY')} />
                  </Layout.Horizontal>
                ) : (
                  <Container>
                    <Container className={css.authHeaderRow} flex={{ alignItems: 'baseline' }}>
                      <Text font={{ variation: FontVariation.H6 }}>{getString('authentication')}</Text>
                      <FormInput.Select
                        name="authType"
                        items={authOptions}
                        disabled={false}
                        className={commonStyles.authTypeSelect}
                      />
                    </Container>

                    <RenderGitlabAuthForm {...formikProps} />
                  </Container>
                )}

                <FormInput.CheckBox
                  name="enableAPIAccess"
                  label={getString('common.git.enableAPIAccess')}
                  padding={{ left: 'xxlarge' }}
                />
                <Text font="small" className={commonCss.bottomMargin4}>
                  {getString('common.git.APIAccessDescription')}
                </Text>
                {formikProps.values.enableAPIAccess ? <RenderAPIAccessFormWrapper {...formikProps} /> : null}
              </Container>

              <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
                <Button
                  text={getString('back')}
                  icon="chevron-left"
                  onClick={() => props?.previousStep?.(props?.prevStepData)}
                  data-name="gitlabBackButton"
                  variation={ButtonVariation.SECONDARY}
                />
                <Button
                  type="submit"
                  intent="primary"
                  text={getString('continue')}
                  rightIcon="chevron-right"
                  variation={ButtonVariation.PRIMARY}
                />
              </Layout.Horizontal>
            </Form>
          )}
        </Formik>
      </Layout.Vertical>
    )
  }

export default StepGitlabAuthentication
