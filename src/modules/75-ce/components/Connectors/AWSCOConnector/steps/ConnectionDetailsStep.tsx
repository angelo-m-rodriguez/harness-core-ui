/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import {
  Heading,
  Layout,
  StepProps,
  Text,
  Container,
  Formik,
  FormInput,
  FormikForm as Form,
  Button,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  useToaster
} from '@wings-software/uicore'
import type { ConnectorInfoDTO, ConnectorRequestBody } from 'services/cd-ng'
import { useCreateConnector } from 'services/cd-ng'
import { DialogWithExtensionContext } from '@ce/common/DialogWithExtension/DialogWithExtension'
import { useGetCloudFormationTemplate } from 'services/lw'
import { useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { OPTIMIZATION_FEATURE, CROSS_ACCOUNT_ACCESS, FEATURES_ENABLED } from '../constants'
import type { feature } from '../constants'
import css from './Steps.module.scss'

interface AWSCODetails {
  roleARN: string
  externalID: string
}

const ConnectionDetailsStep: React.FC<StepProps<ConnectorInfoDTO>> = props => {
  const { accountId } = useParams<{
    accountId: string
    orgIdentifier: string
    projectIdentifier: string
  }>()
  const { getString } = useStrings()
  const { prevStepData, nextStep } = props
  const { triggerExtension } = useContext(DialogWithExtensionContext)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const connectorInfo = prevStepData as ConnectorInfoDTO
  const [showRoleView, setShowRoleView] = useState(false)
  // const [externalIDEnabled, setExternalIDEnabled] = useState(true)
  const [externalID, setExternalID] = useState(connectorInfo.spec.externalID as string)
  const [saving, setSaving] = useState(false)
  const { getRBACErrorMessage } = useRBACError()
  const { showError } = useToaster()
  const { mutate: createConnector } = useCreateConnector({ queryParams: { accountIdentifier: accountId } })
  const { data, error } = useGetCloudFormationTemplate({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)

  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())

  if (error) {
    showError(error.message, undefined, 'ce.get.cf.tmpl.error')
  }

  const randomString = (): string => {
    return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)
  }

  const createTemplate = (): void => {
    const cftPath: string = data?.response?.path as string
    if (!cftPath) {
      showError('Template path is empty', undefined, 'ce.create.tpml.error')
      return
    }
    // setExternalIDEnabled(false)
    const curEnabled: boolean = connectorInfo.spec.billingPermission
    const optimizationEnabled: boolean = connectorInfo.spec.optimizationPermission
    const eventsEnabled: boolean = connectorInfo.spec.eventsPermission
    const rand = randomString()
    const stackName = `harness-ce-iam-${rand}`
    const reqPath = 'https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate'
    const lambdaExecName = `HarnessCELambdaExecRole${rand}`
    const roleName = `HarnessCERole-${rand}`
    const url = `${reqPath}?stackName=${stackName}&templateURL=${cftPath}&param_ExternalId=${externalID}&param_CurEnabled=${curEnabled}&param_OptimizationEnabled=${optimizationEnabled}&param_EventsEnabled=${eventsEnabled}&param_LambdaExecutionRoleName=${lambdaExecName}&param_RoleName=${roleName}`
    window.open(url)
  }

  const saveAndContinue = async (awsCoDetails: AWSCODetails): Promise<void> => {
    setSaving(true)
    const requiredFeatures: feature[] = []

    if (prevStepData?.spec?.optimizationPermission) {
      requiredFeatures.push(OPTIMIZATION_FEATURE)
      connectorInfo.spec[CROSS_ACCOUNT_ACCESS] = {
        crossAccountRoleArn: awsCoDetails.roleARN,
        externalId: awsCoDetails.externalID
      }
    }
    connectorInfo.spec[FEATURES_ENABLED] = requiredFeatures
    try {
      modalErrorHandler?.hide()
      const connector: ConnectorRequestBody = { connector: connectorInfo }
      const res = await createConnector(connector)
      if (opaFlagEnabled && res.data?.governanceMetadata) {
        conditionallyOpenGovernanceErrorModal(res.data?.governanceMetadata, () => {
          nextStep?.(connectorInfo)
        })
      } else {
        nextStep?.(connectorInfo)
      }

      setSaving(false)
    } catch (e) {
      setSaving(false)
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    }
  }

  const handleFollowInstructionsClick = () => {
    setShowRoleView(true)
    triggerExtension()
  }

  return (
    <Formik
      initialValues={{ roleARN: connectorInfo.spec.roleARN, externalID: connectorInfo.spec.externalID }}
      validationSchema={Yup.object().shape({
        roleARN: Yup.string().trim().required(getString('ce.connector.AWS.crossAccountRole.validation.arnRequired')),
        externalID: Yup.string()
          .trim()
          .required(getString('ce.connector.AWS.crossAccountRole.validation.extIDRequired'))
      })}
      formName="connectionDetails"
      onSubmit={formData => {
        saveAndContinue({ ...formData, externalID: formData.externalID.trim(), roleARN: formData.roleARN.trim() })
      }}
    >
      {() => (
        <Form className={css.fullHeight}>
          <ModalErrorHandler bind={setModalErrorHandler} />
          <Layout.Vertical spacing="large" className={css.containerLayout}>
            <Heading level={2} style={{ fontSize: '18px', color: 'grey800' }}>
              {getString('ce.connector.AWS.crossAccountRole.title')}
            </Heading>
            <Container padding={{ top: 'large', bottom: 'large' }}>
              <Text font={{ weight: 'bold' }}>{getString('ce.connector.AWS.crossAccountRole.text')}</Text>
              <Container background={'blue300'} padding={'large'} margin={{ top: 'medium' }}>
                <Text font="normal" style={{ lineHeight: '25px' }}>
                  {getString('ce.connector.AWS.crossAccountRole.requirementExplanation')}
                </Text>
              </Container>
            </Container>
            <Container>
              <Button color="blue700" intent="primary" minimal onClick={handleFollowInstructionsClick}>
                <Text font={{ weight: 'bold' }} color="blue700">
                  {getString('ce.connector.AWS.crossAccountRole.instructionLabel')}
                </Text>
              </Button>
            </Container>
            {showRoleView && (
              <Layout.Vertical spacing="large">
                <FormInput.Text
                  name="externalID"
                  label={getString('ce.connector.AWS.crossAccountRole.externalID')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setExternalID(e.target.value)
                  }}
                  // disabled={!externalIDEnabled}
                />
                <FormInput.Text name="roleARN" label={getString('ce.connector.AWS.crossAccountRole.arn')} />
                <div>
                  <Button
                    intent="primary"
                    text={getString('ce.connector.AWS.crossAccountRole.templateLaunchText')}
                    onClick={createTemplate}
                    // disabled={!externalIDEnabled}
                  />
                </div>
                <div>
                  <Button
                    intent="primary"
                    text={getString('ce.connector.AWS.overview.submitText')}
                    rightIcon="chevron-right"
                    disabled={saving}
                    loading={saving}
                    type="submit"
                  />
                </div>
              </Layout.Vertical>
            )}
          </Layout.Vertical>
        </Form>
      )}
    </Formik>
  )
}

export default ConnectionDetailsStep
