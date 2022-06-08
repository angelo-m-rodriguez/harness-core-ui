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
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { setupAwsKmsFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import {
  AwsKmsConfigFormData,
  ConnectorDetailsProps,
  CredTypeValues,
  StepDetailsProps
} from '@connectors/interfaces/ConnectorInterface'
import { PageSpinner } from '@common/components'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import AwsKmsAccessKeyForm from './AwsKmsAccessKeyForm'

const externalIdRegExpression = /^\S*$/

const AwsKmsConfig: React.FC<StepProps<StepDetailsProps> & ConnectorDetailsProps> = props => {
  const { accountId, prevStepData, nextStep, previousStep } = props

  const { getString } = useStrings()

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
  const defaultInitialFormData: AwsKmsConfigFormData = {
    accessKey: undefined,
    secretKey: undefined,
    awsArn: undefined,
    region: undefined,
    credType: credTypeOptions[0].value as string,
    roleArn: undefined,
    externalName: undefined,
    assumeStsRoleDuration: undefined,
    default: false
  }

  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(props.isEditMode)
  useConnectorWizard({ helpPanel: { referenceId: 'AWSKMSDetails', contentWidth: 900 } })
  React.useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupAwsKmsFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as AwsKmsConfigFormData)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setLoadingConnectorSecrets(false)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConnectorSecrets])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ConfigLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.AWSKms
  })

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Container padding={{ top: 'medium' }}>
      <Text font={{ variation: FontVariation.H3 }} padding={{ bottom: 'xlarge' }}>
        {getString('details')}
      </Text>

      <Formik
        enableReinitialize
        initialValues={{
          ...initialValues,
          ...prevStepData
        }}
        formName="awsKmsConfigForm"
        validationSchema={Yup.object().shape({
          accessKey: Yup.object().when(['credType'], {
            is: credentials => credentials === credTypeOptions[0].value,
            then: Yup.object().required(getString('connectors.aws.validation.accessKey'))
          }),
          secretKey: Yup.object().when(['credType'], {
            is: credentials => credentials === credTypeOptions[0].value,
            then: Yup.object().required(getString('connectors.aws.validation.secretKeyRef'))
          }),
          awsArn: Yup.object().required(getString('connectors.awsKms.validation.selectAWSArn')),
          region: Yup.string().trim().required(getString('connectors.awsKms.validation.selectRegion')),
          roleArn: Yup.string().when(['credType'], {
            is: credentials => credentials === credTypeOptions[2].value,
            then: Yup.string().trim().required(getString('connectors.aws.validation.crossAccountRoleArn'))
          }),
          externalName: Yup.string().when(['credType'], {
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
            connector_type: Connectors.AWSKms
          })
          nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepDetailsProps)
        }}
      >
        {formik => {
          return (
            <FormikForm>
              <Container style={{ minHeight: 420, maxWidth: 600 }} margin={{ top: 'medium', bottom: 'xxlarge' }}>
                <FormInput.Select name="credType" label={getString('credType')} items={credTypeOptions} />
                <AwsKmsAccessKeyForm formik={formik} accountId={accountId} />
                {formik.values?.credType === credTypeOptions[2].value && (
                  <>
                    <FormInput.Text name="roleArn" label={getString('connectors.awsKms.roleArnLabel')} />
                    <FormInput.Text name="externalName" label={getString('connectors.aws.externalId')} />
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

export default AwsKmsConfig
