/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  StepProps,
  Container,
  Formik,
  FormikForm,
  Button,
  Text,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Layout
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'

import { SecretRequestWrapper, usePostSecret, SSHAuthDTO, usePutSecret, SecretDTOV2 } from 'services/cd-ng'
import type { KerberosConfigDTO, SSHConfigDTO, SSHKeySpecDTO } from 'services/cd-ng'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import SSHAuthFormFields from '@secrets/components/SSHAuthFormFields/SSHAuthFormFields'
import { buildAuthConfig } from '@secrets/utils/SSHAuthUtils'
import { useToaster } from '@common/exports'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import type { SSHCredSharedObj } from '../CreateSSHCredWizard'

export interface SSHConfigFormData {
  authScheme: SSHAuthDTO['type']
  credentialType: SSHConfigDTO['credentialType']
  tgtGenerationMethod: KerberosConfigDTO['tgtGenerationMethod'] | 'None'
  userName: string
  port: number
  key?: SecretReference
  principal: string
  realm: string
  keyPath: string
  encryptedPassphrase?: SecretReference
  password?: SecretReference
}

interface StepAuthenticationProps {
  onSuccess?: (secret: SecretDTOV2) => void
}

const StepAuthentication: React.FC<StepProps<SSHCredSharedObj> & StepAuthenticationProps & SSHCredSharedObj> = ({
  prevStepData,
  nextStep,
  previousStep,
  onSuccess
}) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [saving, setSaving] = useState(false)
  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal({
    considerWarningAsError: false,
    errorHeaderMsg: 'secrets.policyEvaluations.failedToSave',
    warningHeaderMsg: 'secrets.policyEvaluations.warning'
  })
  const { mutate: createSecret } = usePostSecret({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })
  const { mutate: editSecret } = usePutSecret({
    identifier: prevStepData?.detailsData?.identifier || '',
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const isEdit = prevStepData?.isEdit
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (formData: SSHConfigFormData): Promise<void> => {
    setSaving(true)
    try {
      const authConfig = buildAuthConfig(formData)
      // build final data to submit
      const dataToSubmit: SecretRequestWrapper = {
        secret: {
          type: 'SSHKey',
          name: prevStepData?.detailsData?.name as string,
          identifier: prevStepData?.detailsData?.identifier as string,
          description: prevStepData?.detailsData?.description,
          tags: prevStepData?.detailsData?.tags,
          projectIdentifier,
          orgIdentifier,
          spec: {
            auth: {
              type: formData.authScheme,
              spec: authConfig
            },
            port: formData.port
          } as SSHKeySpecDTO
        }
      }
      // finally create the connector
      const response = isEdit ? await editSecret(dataToSubmit) : await createSecret(dataToSubmit)
      setSaving(false)
      conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
        isEdit ? showSuccess(getString('ssh.editmessageSuccess')) : showSuccess(getString('ssh.createmessageSuccess'))
        onSuccess?.(dataToSubmit.secret)
        nextStep?.({ ...prevStepData, authData: formData, isEdit: true })
      })
    } catch (err) {
      setSaving(false)
      modalErrorHandler?.show(err.data)
    }
  }
  const validationSchema = Yup.object().shape({
    port: Yup.number().required(getString('common.smtp.portRequired')),
    userName: Yup.string().when('authScheme', {
      is: 'SSH',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validateUsername'))
    }),
    keyPath: Yup.string().when(['authScheme', 'credentialType', 'tgtGenerationMethod'], {
      is: (authScheme, credentialType, tgtGenerationMethod) =>
        (authScheme === 'SSH' && credentialType == 'KeyPath') ||
        (authScheme === 'Kerberos' && tgtGenerationMethod == 'KeyTabFilePath'),
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validateKeypath'))
    }),
    key: Yup.object().when(['authScheme', 'credentialType'], {
      is: (authScheme, credentialType) => authScheme === 'SSH' && credentialType == 'KeyReference',
      then: Yup.object().required(getString('secrets.createSSHCredWizard.validateSshKey'))
    }),
    principal: Yup.string().when('authScheme', {
      is: 'Kerberos',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validatePrincipal'))
    }),
    realm: Yup.string().when('authScheme', {
      is: 'Kerberos',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validateRealm'))
    })
  })

  return (
    <>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Container padding="small" width={400} style={{ minHeight: '500px' }}>
        <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
          {getString('secrets.createSSHCredWizard.titleAuth')}
        </Text>
        <Formik<SSHConfigFormData>
          onSubmit={formData => {
            modalErrorHandler?.hide()
            handleSubmit(formData)
          }}
          formName="stepAuthenticationForm"
          validationSchema={validationSchema}
          initialValues={{
            authScheme: 'SSH',
            credentialType: 'KeyReference',
            tgtGenerationMethod: 'None',
            userName: '',
            principal: '',
            realm: '',
            keyPath: '',
            port: 22,
            ...prevStepData?.authData
          }}
        >
          {formik => {
            return (
              <FormikForm>
                <SSHAuthFormFields formik={formik} secretName={prevStepData?.detailsData?.name} />
                <Layout.Horizontal spacing="small">
                  <Button
                    text={getString('back')}
                    onClick={() => previousStep?.({ ...prevStepData, authData: formik.values })}
                  />
                  <Button
                    type="submit"
                    intent="primary"
                    text={saving ? getString('secrets.createSSHCredWizard.btnSaving') : getString('saveAndContinue')}
                    disabled={saving}
                  />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </>
  )
}

export default StepAuthentication
