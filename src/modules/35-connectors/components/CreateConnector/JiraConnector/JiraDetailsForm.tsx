/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Layout,
  Button,
  Formik,
  Text,
  FormInput,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  ButtonVariation,
  PageSpinner
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import type { ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import SecretInput from '@secrets/components/SecretInput/SecretInput'

import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { setupJiraFormData, useGetHelpPanel } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { Connectors } from '@connectors/constants'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'

import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'

import css from './JiraConnector.module.scss'

interface JiraFormData {
  jiraUrl: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
}

interface AuthenticationProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface JiraFormProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

const defaultInitialFormData: JiraFormData = {
  jiraUrl: '',
  username: undefined,
  password: undefined
}

const JiraDetailsForm: React.FC<StepProps<JiraFormProps> & AuthenticationProps> = props => {
  const { prevStepData, nextStep, accountId } = props
  const [, setModalErrorHandler] = React.useState<ModalErrorHandlerBinding | undefined>()
  const [initialValues, setInitialValues] = React.useState(defaultInitialFormData)
  const [loadConnector] = React.useState(false)

  const [loadingConnectorSecrets, setLoadingConnectorSecrets] = React.useState(true && props.isEditMode)

  const { getString } = useStrings()

  React.useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupJiraFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as JiraFormData)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setInitialValues(prevStepData as any)
          setLoadingConnectorSecrets(false)
        }
      }
    }
  }, [loadingConnectorSecrets])
  useGetHelpPanel('JiraConnectorDetails', 900)

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.DetailsStepLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Jira
  })

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Layout.Vertical spacing="small" className={css.secondStep}>
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'jiraConnectorDetails' }}>
        {getString('details')}
      </Text>
      <Formik
        initialValues={{
          ...initialValues,
          ...prevStepData
        }}
        formName="jiraDetailsForm"
        validationSchema={Yup.object().shape({
          jiraUrl: Yup.string().trim().required(getString('validation.jiraUrl')),
          username: Yup.string().required(getString('validation.username')),
          passwordRef: Yup.object().required(getString('validation.password'))
        })}
        onSubmit={stepData => {
          trackEvent(ConnectorActions.DetailsStepSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.Jira
          })
          nextStep?.({ ...props.connectorInfo, ...prevStepData, ...stepData } as JiraFormProps)
        }}
      >
        {formik => {
          return (
            <>
              <ModalErrorHandler bind={setModalErrorHandler} />
              <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} width={'56%'}>
                <FormInput.Text name="jiraUrl" placeholder={getString('UrlLabel')} label={getString('UrlLabel')} />

                <TextReference
                  name="username"
                  stringId="username"
                  type={formik.values.username ? formik.values.username.type : ValueType.TEXT}
                />
                <SecretInput name={'passwordRef'} label={getString('connectors.apiKey')} />
              </Layout.Vertical>

              <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
                <Button
                  text={getString('back')}
                  icon="chevron-left"
                  variation={ButtonVariation.SECONDARY}
                  onClick={() => props?.previousStep?.(props?.prevStepData)}
                  data-name="jiraBackButton"
                />
                <Button
                  type="submit"
                  onClick={formik.submitForm}
                  variation={ButtonVariation.PRIMARY}
                  text={getString('continue')}
                  rightIcon="chevron-right"
                  disabled={loadConnector}
                />
              </Layout.Horizontal>
            </>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default JiraDetailsForm
