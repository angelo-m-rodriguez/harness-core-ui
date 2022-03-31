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
  Text,
  StepProps,
  Container,
  FontVariation,
  ButtonVariation,
  PageSpinner,
  HarnessDocTooltip
} from '@wings-software/uicore'
import * as Yup from 'yup'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, ConnectorInfoDTO } from 'services/cd-ng'

import { setupGCPFormData, GitConnectionType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import { useStrings } from 'framework/strings'

import UploadJSON from '../components/UploadJSON'

import css from '../CreatePdcConnector.module.scss'

interface PdcDetailsProps {
  name: string
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  onConnectorCreated: (data?: ConnectorConfigDTO) => void | Promise<void>
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface StepConfigureProps {
  closeModal?: () => void
  onSuccess?: () => void
  hosts?: string
}

interface PDCFormInterface {
  delegateType?: string
  password: SecretReferenceInterface | void
}
const PdcDetails: React.FC<StepProps<StepConfigureProps> & PdcDetailsProps> = props => {
  const { prevStepData, nextStep } = props
  const { accountId } = props
  const { getString } = useStrings()

  const defaultInitialFormData: PDCFormInterface = {
    password: undefined
  }

  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [hostsJSON, setHostsJSON] = useState('')
  const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)
  const [manualTypedHosts, setManualTypedHosts] = useState('')

  useEffect(() => {
    setManualTypedHosts(prevStepData?.hosts || '')
  }, [])

  useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupGCPFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as PDCFormInterface)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setLoadingConnectorSecrets(false)
        }
      }
    }
  }, [loadingConnectorSecrets])

  const handleSubmit = (formData: ConnectorConfigDTO) => {
    const data = { ...formData }
    const { sshKey } = formData
    data.hosts = hostsJSON ? hostsJSON : manualTypedHosts
    if (sshKey) {
      data.sshKeyRef = sshKey.projectIdentifier
        ? sshKey.identifier
        : sshKey.orgIdentifier
        ? `org.${sshKey.identifier}`
        : `account.${sshKey.identifier}`
    }
    nextStep?.({ ...props.connectorInfo, ...prevStepData, ...data } as StepConfigureProps)
  }

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Layout.Vertical spacing="medium" className={css.secondStep}>
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'pdcHostDetails' }}>
        {getString('details')}
      </Text>
      <Formik
        initialValues={{
          ...initialValues,
          ...props.prevStepData
        }}
        formName="pdcDetailsForm"
        validationSchema={Yup.object().shape({
          sshKey: Yup.object()
            .when('connectionType', {
              is: val => val === GitConnectionType.SSH,
              then: Yup.object().required(getString('validation.sshKey')),
              otherwise: Yup.object().nullable()
            })
            .required()
        })}
        onSubmit={handleSubmit}
      >
        {formikProps => (
          <>
            <Container className={css.clusterWrapper}>
              <Layout.Horizontal className={css.hostContainer} spacing="small">
                <div className={css.manualHostContainer}>
                  <HarnessDocTooltip tooltipId={'pdc-connector-hosts'} labelText={getString('connectors.pdc.hosts')} />
                  <textarea
                    className={css.textInput}
                    value={manualTypedHosts}
                    onInput={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setManualTypedHosts(event.target.value)
                    }}
                  />
                </div>
                <span>{getString('connectors.pdc.or')}</span>
                <UploadJSON setJsonValue={json => setHostsJSON(json)} />
              </Layout.Horizontal>
              <Layout.Vertical style={{ width: '54%' }} margin={{ top: 'large' }}>
                <Text font={{ variation: FontVariation.H5 }}>{getString('authentication')}</Text>
                <SecretInput
                  name={'sshKey'}
                  label={getString('secretType')}
                  type={'SecretFile'}
                  tooltipProps={{ dataTooltipId: 'pdcConnectorSecretKeyTooltip' }}
                />
              </Layout.Vertical>
            </Container>
            <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
              <Button
                text={getString('back')}
                icon="chevron-left"
                variation={ButtonVariation.SECONDARY}
                onClick={() => props?.previousStep?.(props?.prevStepData)}
                data-name="pdcBackButton"
              />
              <Button
                type="submit"
                onClick={formikProps.submitForm}
                variation={ButtonVariation.PRIMARY}
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

export default PdcDetails
