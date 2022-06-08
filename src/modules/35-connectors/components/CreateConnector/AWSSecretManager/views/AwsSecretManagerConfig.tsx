/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useState } from 'react'
import * as Yup from 'yup'
import {
  StepProps,
  Container,
  Text,
  SelectOption,
  FormInput,
  Formik,
  FormikForm,
  Layout,
  Button,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { setupAwsSecretManagerFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import {
  AwsSecretManagerConfigFormData,
  ConnectorDetailsProps,
  CredTypeValues,
  StepDetailsProps
} from '@connectors/interfaces/ConnectorInterface'
import { PageSpinner } from '@common/components'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import AwsSecretManagerAccessKeyForm from './AwsSecretManagerAccessKeyForm'
import css from '../CreateAwsSecretManagerConnector.module.scss'

const externalIdRegExpression = /^\S*$/

const AwsSecretManagerConfig: React.FC<StepProps<StepDetailsProps> & ConnectorDetailsProps> = ({
  accountId,
  prevStepData,
  previousStep,
  nextStep,
  isEditMode,
  connectorInfo
}) => {
  const { getString } = useStrings()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()

  const credTypeOptions: SelectOption[] = [
    {
      label: getString('connectors.aws.awsAccessKey'),
      value: CredTypeValues.ManualConfig
    },
    {
      label: getString('connectors.aws.assumeIAMRole'),
      value: CredTypeValues.AssumeIAMRole
    },
    {
      label: getString('connectors.awsKms.awsSTS'),
      value: CredTypeValues.AssumeRoleSTS
    }
  ]
  const defaultInitialFormData: AwsSecretManagerConfigFormData = {
    accessKey: undefined,
    secretKey: undefined,
    secretNamePrefix: undefined,
    region: undefined,
    credType: credTypeOptions[0].value as string,
    roleArn: undefined,
    externalId: undefined,
    assumeStsRoleDuration: undefined,
    default: false
  }

  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingFormData, setLoadingFormData] = useState(isEditMode)
  useConnectorWizard({ helpPanel: { referenceId: 'AWSSecretManagerDetails', contentWidth: 900 } })

  React.useEffect(() => {
    if (isEditMode && connectorInfo) {
      setupAwsSecretManagerFormData(connectorInfo, accountId).then(data => {
        setInitialValues(data as AwsSecretManagerConfigFormData)
        setLoadingFormData(false)
      })
    }
  }, [isEditMode, connectorInfo, accountId])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ConfigLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.AWSSecretMgr
  })

  return loadingFormData ? (
    <PageSpinner />
  ) : (
    <Container padding={{ top: 'medium' }}>
      <Text font={{ variation: FontVariation.H3 }} padding={{ bottom: 'xlarge' }}>
        {getString('details')}
      </Text>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues, ...prevStepData }}
        formName="awsSMConfigForm"
        validationSchema={Yup.object().shape({
          accessKey: Yup.object().when(['credType'], {
            is: credentials => credentials === credTypeOptions[0].value,
            then: Yup.object().required(getString('connectors.aws.validation.accessKey'))
          }),
          secretKey: Yup.object().when(['credType'], {
            is: credentials => credentials === credTypeOptions[0].value,
            then: Yup.object().required(getString('connectors.aws.validation.secretKeyRef'))
          }),
          region: Yup.string().trim().required(getString('connectors.awsKms.validation.selectRegion')),
          roleArn: Yup.string().when(['credType'], {
            is: credentials => credentials === credTypeOptions[2].value,
            then: Yup.string().trim().required(getString('connectors.aws.validation.crossAccountRoleArn'))
          }),
          externalId: Yup.string().when(['credType'], {
            is: credentials => credentials === credTypeOptions[2].value,
            then: Yup.string()
              .trim()
              .min(2, getString('connectors.awsKms.validation.externalIdLengthError'))
              .max(1224, getString('connectors.awsKms.validation.externalIdLengthError'))
              .matches(externalIdRegExpression, getString('connectors.awsKms.validation.externalIdRegexError'))
          }),
          assumeStsRoleDuration: Yup.number().when(['credType'], {
            is: credentials => credentials === credTypeOptions[2].value,
            then: Yup.number()
              .integer(getString('connectors.awsKms.validation.durationError'))
              .min(900, getString('connectors.awsKms.validation.durationNumber'))
              .max(43200, getString('connectors.awsKms.validation.durationNumber'))
              .typeError(getString('connectors.awsKms.validation.durationError'))
          })
        })}
        onSubmit={formData => {
          trackEvent(ConnectorActions.ConfigSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.AWSSecretMgr
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData } as StepDetailsProps)
        }}
      >
        {formik => {
          return (
            <FormikForm>
              <Container margin={{ top: 'medium', bottom: 'xxlarge' }} className={css.container}>
                <FormInput.Select name="credType" label={getString('credType')} items={credTypeOptions} />
                <AwsSecretManagerAccessKeyForm
                  formik={formik}
                  accountId={accountId}
                  modalErrorHandler={modalErrorHandler}
                />
                {formik.values?.credType === credTypeOptions[2].value && (
                  <>
                    <FormInput.Text name="roleArn" label={getString('connectors.awsKms.roleArnLabel')} />
                    <FormInput.Text name="externalId" label={getString('connectors.aws.externalId')} />
                    <FormInput.Text
                      name="assumeStsRoleDuration"
                      label={getString('connectors.awsKms.assumedRoleDuration')}
                    />
                  </>
                )}
                <FormInput.CheckBox
                  name="default"
                  label={getString('connectors.hashiCorpVault.defaultVault')}
                  padding={{ left: 'xxlarge' }}
                />
              </Container>
              <Layout.Horizontal spacing="medium">
                <Button
                  variation={ButtonVariation.SECONDARY}
                  icon="chevron-left"
                  text={getString('back')}
                  onClick={() => previousStep?.(prevStepData)}
                />
                <Button type="submit" intent="primary" rightIcon="chevron-right" text={getString('continue')} />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export default AwsSecretManagerConfig
