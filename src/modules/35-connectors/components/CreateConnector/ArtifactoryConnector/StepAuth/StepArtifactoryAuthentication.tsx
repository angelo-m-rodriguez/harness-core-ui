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
  ButtonVariation
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { setupArtifactoryFormData, useGetHelpPanel } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { ConnectorConfigDTO, ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { ValueType, TextReferenceInterface } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { PageSpinner } from '@common/components'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from '../../NexusConnector/StepAuth/StepNexusConnector.module.scss'

interface StepArtifactoryAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface ArtifactoryAuthenticationProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface ArtifactoryFormInterface {
  artifactoryServerUrl: string
  authType: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
}

const defaultInitialFormData: ArtifactoryFormInterface = {
  artifactoryServerUrl: '',
  authType: AuthTypes.USER_PASSWORD,
  username: undefined,
  password: undefined
}

const StepArtifactoryAuthentication: React.FC<
  StepProps<StepArtifactoryAuthenticationProps> & ArtifactoryAuthenticationProps
> = props => {
  const { prevStepData, nextStep, accountId } = props
  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)
  const { getString } = useStrings()

  const authOptions: SelectOption[] = [
    {
      label: getString('usernamePassword'),
      value: AuthTypes.USER_PASSWORD
    },
    {
      label: getString('anonymous'),
      value: AuthTypes.ANNONYMOUS
    }
  ]

  useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupArtifactoryFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as ArtifactoryFormInterface)
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
      connector_type: Connectors.Artifactory
    })
    nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepArtifactoryAuthenticationProps)
  }
  useGetHelpPanel('AritfactoryDetails', 900)

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.AuthenticationStepLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Artifactory
  })

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Layout.Vertical spacing="small" className={css.stepDetails}>
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'artifactRepositoryDetails' }}>
        {getString('details')}
      </Text>
      <Formik
        initialValues={{
          ...initialValues,
          ...prevStepData
        }}
        formName="stepArtifactoryAuthForm"
        validationSchema={Yup.object().shape({
          artifactoryServerUrl: Yup.string().trim().required(getString('validation.artifactoryServerURL')),
          username: Yup.string()
            .nullable()
            .when('authType', {
              is: authType => authType === AuthTypes.USER_PASSWORD,
              then: Yup.string().required(getString('validation.username'))
            }),
          password: Yup.object().when('authType', {
            is: authType => authType === AuthTypes.USER_PASSWORD,
            then: Yup.object().required(getString('validation.password')),
            otherwise: Yup.object().nullable()
          })
        })}
        onSubmit={handleSubmit}
      >
        {formikProps => (
          <>
            <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.secondStep}>
              <Container className={css.formRow}>
                <FormInput.Text
                  className={css.urlInput}
                  name="artifactoryServerUrl"
                  placeholder={getString('UrlLabel')}
                  label={getString('connectors.artifactory.artifactoryServerUrl')}
                />
              </Container>

              <Container className={css.authHeaderRow}>
                <Text
                  font={{ variation: FontVariation.H6 }}
                  inline
                  tooltipProps={{ dataTooltipId: 'artifactRepositoryAuthentication' }}
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
                <Container className={css.formWrapper}>
                  <TextReference
                    name="username"
                    stringId="username"
                    type={formikProps.values.username ? formikProps.values.username?.type : ValueType.TEXT}
                  />
                  <SecretInput name={'password'} label={getString('password')} />
                </Container>
              ) : null}
            </Layout.Vertical>
            <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
              <Button
                text={getString('back')}
                icon="chevron-left"
                variation={ButtonVariation.SECONDARY}
                onClick={() => props?.previousStep?.(props?.prevStepData)}
                data-name="artifactoryBackButton"
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

export default StepArtifactoryAuthentication
