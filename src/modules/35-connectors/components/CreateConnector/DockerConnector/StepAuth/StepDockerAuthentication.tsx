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
import type { IOptionProps } from '@blueprintjs/core'
import { setupDockerFormData, DockerProviderType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'

import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions, ConnectorTypes } from '@common/constants/TrackingConstants'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useConnectorWizard } from '../../../CreateConnectorWizard/ConnectorWizardContext'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from '../CreateDockerConnector.module.scss'

interface StepDockerAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface DockerAuthenticationProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo?: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface DockerFormInterface {
  dockerRegistryUrl: string
  authType: string
  dockerProviderType: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
}

const defaultInitialFormData: DockerFormInterface = {
  dockerRegistryUrl: '',
  authType: AuthTypes.USER_PASSWORD,
  dockerProviderType: DockerProviderType.DOCKERHUB,
  username: undefined,
  password: undefined
}

const StepDockerAuthentication: React.FC<StepProps<StepDockerAuthenticationProps> & DockerAuthenticationProps> =
  props => {
    const { getString } = useStrings()
    const { prevStepData, nextStep, accountId } = props
    const [initialValues, setInitialValues] = useState(defaultInitialFormData)
    const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)

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

    const dockerProviderTypeOptions: IOptionProps[] = [
      {
        label: getString('connectors.docker.dockerHub'),
        value: DockerProviderType.DOCKERHUB
      },
      {
        label: getString('connectors.docker.harbour'),
        value: DockerProviderType.HARBOUR
      },
      {
        label: getString('connectors.docker.quay'),
        value: DockerProviderType.QUAY
      },
      {
        label: getString('connectors.docker.other'),
        value: DockerProviderType.OTHER
      }
    ]

    useEffect(() => {
      if (loadingConnectorSecrets) {
        if (props.isEditMode) {
          if (props.connectorInfo) {
            setupDockerFormData(props.connectorInfo, accountId).then(data => {
              setInitialValues(data as DockerFormInterface)
              setLoadingConnectorSecrets(false)
            })
          } else {
            setLoadingConnectorSecrets(false)
          }
        }
      }
    }, [loadingConnectorSecrets])

    const { trackEvent } = useTelemetry()

    const handleSubmit = (formData: ConnectorConfigDTO) => {
      trackEvent(ConnectorActions.AuthenticationStepSubmit, {
        category: Category.CONNECTOR,
        connector_type: ConnectorTypes.Docker
      })
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepDockerAuthenticationProps)
    }
    useConnectorWizard({ helpPanel: { referenceId: 'DockerConnectorDetails', contentWidth: 900 } })

    useTrackEvent(ConnectorActions.AuthenticationStepLoad, {
      category: Category.CONNECTOR,
      connector_type: ConnectorTypes.Docker
    })

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
          formName="dockerAuthForm"
          validationSchema={Yup.object().shape({
            dockerRegistryUrl: Yup.string().trim().required(getString('validation.dockerRegistryUrl')),
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
            })
          })}
          onSubmit={handleSubmit}
        >
          {formikProps => (
            <>
              <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.secondStep} width={'64%'}>
                <FormInput.Text
                  name="dockerRegistryUrl"
                  placeholder={getString('UrlLabel')}
                  label={getString('connectors.docker.dockerRegistryURL')}
                />
                <Text tooltipProps={{ dataTooltipId: 'dockerConnectorProviderType' }}>
                  {getString('connectors.docker.dockerProvideType')}
                </Text>
                <FormInput.RadioGroup
                  className={css.dockerProviderType}
                  inline
                  name="dockerProviderType"
                  radioGroup={{ inline: true }}
                  items={dockerProviderTypeOptions}
                  disabled={false}
                ></FormInput.RadioGroup>
                <Container className={css.authHeaderRow}>
                  <Text
                    font={{ variation: FontVariation.H6 }}
                    inline
                    tooltipProps={{ dataTooltipId: 'dockerConnectorAuthentication' }}
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
                    <SecretInput name={'password'} label={getString('password')} />
                  </>
                ) : null}
              </Layout.Vertical>
              <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
                <Button
                  text={getString('back')}
                  icon="chevron-left"
                  onClick={() => props?.previousStep?.(props?.prevStepData)}
                  data-name="dockerBackButton"
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

export default StepDockerAuthentication
