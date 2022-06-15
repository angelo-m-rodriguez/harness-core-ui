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
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  Container,
  SelectOption,
  ButtonVariation,
  PageSpinner
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { setupHelmFormData, useGetHelpPanel } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'

import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions, ConnectorTypes } from '@common/constants/TrackingConstants'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from './HelmRepoConnector.module.scss'

interface StepHelmRepoAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface AuthenticationProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  isOCIHelm?: boolean
}

interface HelmFormInterface {
  helmRepoUrl: string
  authType: string

  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
}

const defaultInitialFormData: HelmFormInterface = {
  helmRepoUrl: '',
  authType: AuthTypes.USER_PASSWORD,
  username: undefined,
  password: undefined
}

const StepHelmAuthentication: React.FC<StepProps<StepHelmRepoAuthenticationProps> & AuthenticationProps> = props => {
  const { getString } = useStrings()

  const { prevStepData, nextStep, accountId, isOCIHelm = false } = props

  const [, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [loadConnector] = useState(false)
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

  useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupHelmFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as HelmFormInterface)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setLoadingConnectorSecrets(false)
        }
      }
    }
  }, [loadingConnectorSecrets])
  useGetHelpPanel('HTTPHelmServerDetails', 900)

  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.AuthenticationStepLoad, {
    category: Category.CONNECTOR,
    connector_type: ConnectorTypes.Helm
  })

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Layout.Vertical spacing="small" className={css.stepDetails}>
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'helmRepoAuthenticationDetails' }}>
        {getString('details')}
      </Text>
      <Formik
        initialValues={{
          ...initialValues,
          ...prevStepData
        }}
        formName="helmRepoAuthForm"
        validationSchema={Yup.object().shape({
          helmRepoUrl: Yup.string().trim().required(getString('validation.helmRepoUrl')),
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
        onSubmit={stepData => {
          trackEvent(ConnectorActions.AuthenticationStepSubmit, {
            category: Category.CONNECTOR,
            connector_type: ConnectorTypes.Helm
          })
          nextStep?.({ ...props.connectorInfo, ...prevStepData, ...stepData } as StepHelmRepoAuthenticationProps)
          // const connectorData = {
          //   ...prevStepData,
          //   ...stepData,
          //   projectIdentifier: projectIdentifier,
          //   orgIdentifier: orgIdentifier
          // }
          // const data = buildHelmPayload(connectorData)
          // if (props.isEditMode) {
          //   handleUpdate(data, stepData)
          // } else {
          //   handleCreate(data, stepData)
          // }
        }}
      >
        {formikProps => (
          <>
            <ModalErrorHandler bind={setModalErrorHandler} />

            <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} className={css.secondStep} width={'56%'}>
              <FormInput.Text
                name="helmRepoUrl"
                placeholder={getString('UrlLabel')}
                label={getString('connectors.helmRepo.helmRepoUrl')}
              />

              <Container className={css.authHeaderRow}>
                <Text
                  font={{ variation: FontVariation.H6 }}
                  inline
                  tooltipProps={{ dataTooltipId: 'helmConnectorAuthentication' }}
                >
                  {getString('authentication')}
                </Text>
                {isOCIHelm ? (
                  <Text lineClamp={1}>{getString('usernamePassword')}</Text>
                ) : (
                  <FormInput.Select
                    name="authType"
                    items={authOptions}
                    disabled={false}
                    className={commonStyles.authTypeSelectLarge}
                  />
                )}
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
                variation={ButtonVariation.SECONDARY}
                onClick={() => props?.previousStep?.(props?.prevStepData)}
                data-name="helmBackButton"
              />
              <Button
                type="submit"
                variation={ButtonVariation.PRIMARY}
                onClick={formikProps.submitForm}
                text={getString('continue')}
                rightIcon="chevron-right"
                disabled={loadConnector}
              />
            </Layout.Horizontal>
          </>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default StepHelmAuthentication
