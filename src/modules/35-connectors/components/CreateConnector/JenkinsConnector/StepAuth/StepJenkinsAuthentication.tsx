/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import {
  Layout,
  Button,
  Formik,
  FormInput,
  Text,
  StepProps,
  Container,
  SelectOption,
  ButtonVariation,
  PageSpinner
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { setupJenkinsFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'

import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from '../CreateJenkinsConnector.module.scss'

interface StepJenkinsAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface JenkinsAuthenticationProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo?: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface JenkinsFormInterface {
  jenkinsUrl: string
  authType: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
  bearerToken: SecretReferenceInterface | void
}

const defaultInitialFormData: JenkinsFormInterface = {
  jenkinsUrl: '',
  authType: AuthTypes.USER_PASSWORD,
  username: undefined,
  password: undefined,
  bearerToken: undefined
}

const StepJenkinsAuthentication: React.FC<StepProps<StepJenkinsAuthenticationProps> & JenkinsAuthenticationProps> =
  props => {
    const { getString } = useStrings()
    const { prevStepData, nextStep, accountId } = props
    const [initialValues, setInitialValues] = useState(defaultInitialFormData)
    const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)

    const authOptions: SelectOption[] = [
      {
        label: getString('connectors.jenkins.usernamePasswordAPIToken'),
        value: AuthTypes.USER_PASSWORD
      },
      {
        label: getString('connectors.bearerToken'),
        value: AuthTypes.BEARER_TOKEN
      }
    ]

    useEffect(() => {
      if (loadingConnectorSecrets) {
        if (props.isEditMode) {
          if (props.connectorInfo) {
            setupJenkinsFormData(props.connectorInfo, accountId).then(data => {
              setInitialValues(data as JenkinsFormInterface)
              setLoadingConnectorSecrets(false)
            })
          } else {
            setLoadingConnectorSecrets(false)
          }
        }
      }
    }, [loadingConnectorSecrets])

    const handleSubmit = (formData: ConnectorConfigDTO) => {
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepJenkinsAuthenticationProps)
    }

    return loadingConnectorSecrets ? (
      <PageSpinner />
    ) : (
      <Layout.Vertical className={css.stepDetails} spacing="small">
        <Text font={{ variation: FontVariation.H3 }}>{getString('details')}</Text>
        <Formik
          initialValues={{
            ...initialValues,
            ...prevStepData
          }}
          formName="jenkinsAuthForm"
          validationSchema={Yup.object().shape({
            jenkinsUrl: Yup.string().trim().required(getString('connectors.jenkins.jenkinsUrlRequired')),
            authType: Yup.string().trim().required(getString('validation.authType')),
            username: Yup.string().when('authType', {
              is: val => val === AuthTypes.USER_PASSWORD,
              then: Yup.string().trim().required(getString('validation.username')),
              otherwise: Yup.string().nullable()
            }),
            password: Yup.object().when('authType', {
              is: val => val === AuthTypes.USER_PASSWORD,
              then: Yup.object().required(getString('validation.password')),
              otherwise: Yup.object().nullable()
            }),
            bearerToken: Yup.object().when('authType', {
              is: val => val === AuthTypes.BEARER_TOKEN,
              then: Yup.object().required(getString('connectors.jenkins.bearerTokenRequired')),
              otherwise: Yup.object().nullable()
            })
          })}
          onSubmit={handleSubmit}
        >
          {formikProps => (
            <>
              <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.secondStep} width={'64%'}>
                <FormInput.Text
                  name="jenkinsUrl"
                  placeholder={getString('UrlLabel')}
                  label={getString('connectors.jenkins.jenkinsUrl')}
                />
                <Container className={css.authHeaderRow}>
                  <Text
                    font={{ variation: FontVariation.H6 }}
                    inline
                    tooltipProps={{ dataTooltipId: 'jenkinsConnectorAuthentication' }}
                  >
                    {getString('authentication')}
                  </Text>
                  <FormInput.Select
                    name="authType"
                    items={authOptions}
                    disabled={false}
                    className={commonStyles.authTypeSelectLarge}
                  />
                </Container>
                {formikProps.values.authType === AuthTypes.USER_PASSWORD ? (
                  <>
                    <TextReference
                      name="username"
                      stringId="username"
                      type={formikProps.values.username ? formikProps.values.username?.type : ValueType.TEXT}
                    />
                    <SecretInput name={'password'} label={getString('connectors.jenkins.passwordAPIToken')} />
                  </>
                ) : (
                  <SecretInput name={'bearerToken'} label={getString('connectors.bearerToken')} />
                )}
              </Layout.Vertical>
              <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
                <Button
                  text={getString('back')}
                  icon="chevron-left"
                  onClick={() => props?.previousStep?.(props?.prevStepData)}
                  data-name="jenkinsBackButton"
                  variation={ButtonVariation.SECONDARY}
                />
                <Button
                  type="submit"
                  variation={ButtonVariation.PRIMARY}
                  onClick={formikProps.submitForm}
                  text={getString('continue')}
                  rightIcon="chevron-right"
                />
              </Layout.Horizontal>
            </>
          )}
        </Formik>
      </Layout.Vertical>
    )
  }

export default StepJenkinsAuthentication
