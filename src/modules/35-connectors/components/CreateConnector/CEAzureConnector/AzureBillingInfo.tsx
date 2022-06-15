/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Button,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps
} from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  ConnectorConfigDTO,
  ConnectorRequestBody,
  useCreateConnector,
  useUpdateConnector
} from 'services/cd-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import css from './CreateCeAzureConnector.module.scss'

interface OverviewDetails {
  subscriptionId: string
  tenantId: string
  featuresEnabled: Array<'OPTIMIZATION' | 'BILLING'>
}

interface AzureBillingInfoProps {
  name?: string
  onSuccess?: (connector: ConnectorRequestBody) => void
  isEditMode: boolean
}

interface StepSecretManagerProps extends ConnectorInfoDTO {
  spec: any
}

const AzureBillingInfo: React.FC<StepProps<StepSecretManagerProps> & AzureBillingInfoProps> = props => {
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const { accountId } = useParams<{
    accountId: string
    projectIdentifier: string
    orgIdentifier: string
  }>()
  const [isSaving, setIsSaving] = useState(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const { mutate: createConnector } = useCreateConnector({ queryParams: { accountIdentifier: accountId } })
  const { mutate: updateConnector } = useUpdateConnector({
    queryParams: { accountIdentifier: accountId }
  })
  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)

  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())

  const handleSubmit = async (values: OverviewDetails): Promise<void> => {
    setIsSaving(true)
    try {
      modalErrorHandler?.hide()
      const spec: ConnectorConfigDTO = {
        subscriptionId: values.subscriptionId,
        tenantId: values.tenantId,
        featuresEnabled: ['OPTIMIZATION']
      }
      const connectorDetails: ConnectorInfoDTO = {
        ...(props.prevStepData as ConnectorInfoDTO),
        type: 'CEAzure',
        spec: spec
      }
      const connector = { connector: connectorDetails }
      const response = props.isEditMode
        ? await updateConnector(connector)
        : await createConnector(connector as ConnectorRequestBody)
      const onSucessCreateOrUpdateNextStep = () => {
        props.onSuccess?.(response.data as ConnectorRequestBody)
        props.nextStep?.({ ...connectorDetails })
      }
      if (opaFlagEnabled && response.data?.governanceMetadata) {
        conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, onSucessCreateOrUpdateNextStep)
      } else {
        onSucessCreateOrUpdateNextStep()
      }
    } catch (e) {
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        Azure Connection Details
      </Heading>
      <div style={{ flex: 1 }}>
        <Formik<OverviewDetails>
          initialValues={{
            tenantId: props.prevStepData?.spec?.tenantId || '',
            subscriptionId: props.prevStepData?.spec?.subscriptionId || '',
            featuresEnabled: ['OPTIMIZATION']
          }}
          formName="azureBillingInfoForm"
          onSubmit={values => {
            handleSubmit(values)
          }}
        >
          {() => (
            <FormikForm>
              <ModalErrorHandler bind={setModalErrorHandler} />
              <FormInput.Text
                name={'tenantId'}
                label={'Specify Tenant ID of the Azure account'}
                className={css.dataFields}
              />
              <FormInput.Text name={'subscriptionId'} label={'Subscription ID'} className={css.dataFields} />
              <Button
                type="submit"
                intent="primary"
                text={getString('continue')}
                rightIcon="chevron-right"
                loading={isSaving}
                disabled={isSaving}
                className={css.submitBtn}
              />
            </FormikForm>
          )}
        </Formik>
      </div>
    </Layout.Vertical>
  )
}

export default AzureBillingInfo
