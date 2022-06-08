/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useMemo } from 'react'
import * as Yup from 'yup'
import {
  Container,
  FormikForm,
  Layout,
  FormInput,
  Formik,
  Button,
  SelectOption,
  PageSpinner
} from '@wings-software/uicore'
import { buildSumoLogicPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { Connectors } from '@connectors/constants'
import { useToaster } from '@common/exports'
import { useGetSumoLogicEndPoints } from 'services/cv'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { initializeSumoLogicConnectorWithStepData } from './utils'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import css from './CreateSumoLogicConnector.module.scss'

export function SumoLogicConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const { data: endPoints, error: endPointError, loading: loadingEndpoints } = useGetSumoLogicEndPoints({})
  const { nextStep, prevStepData, connectorInfo, projectIdentifier, orgIdentifier, accountId, isEditMode } = props

  const [initialValues, setInitialValues] = useState<ConnectorConfigDTO>({
    url: '',
    apiKeyRef: {},
    applicationKeyRef: {},
    accountId,
    projectIdentifier,
    orgIdentifier,
    loading: true
  })

  useEffect(() => {
    async function updateStepData(): Promise<void> {
      const value = await initializeSumoLogicConnectorWithStepData(prevStepData, accountId)
      value && setInitialValues(value)
    }
    updateStepData()
  }, [prevStepData, accountId])

  const endPointOptions = useMemo((): SelectOption[] => {
    if (loadingEndpoints) {
      return [{ label: getString('loading'), value: '' }]
    } else if (endPointError?.message) {
      clear()
      showError(endPointError?.message)
      return []
    }
    const filteredPoints: SelectOption[] = []
    for (const endPoint of endPoints?.data || []) {
      if (endPoint) {
        filteredPoints.push({ label: endPoint, value: endPoint })
      }
    }

    // set default value
    if (!isEditMode && !initialValues.url) {
      setInitialValues({ ...initialValues, url: filteredPoints[0].label })
    }
    return filteredPoints
  }, [endPoints, endPointError, loadingEndpoints])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.SumoLogic
  })

  if (initialValues?.loading) {
    return <PageSpinner />
  }

  return (
    <Container className={css.credentials}>
      <StepDetailsHeader connectorTypeLabel={getString('connectors.title.sumologic')} />
      <Formik
        formName="crateSumoLogicConnectorsForm"
        enableReinitialize
        initialValues={{ ...initialValues }}
        validationSchema={Yup.object().shape({
          url: Yup.string().trim().required(getString('connectors.sumologic.urlValidation')),
          accessIdRef: Yup.string().trim().required(getString('connectors.sumologic.encryptedAccessIdValidation')),
          accessKeyRef: Yup.string().trim().required(getString('connectors.sumologic.encryptedAccessKeyValidation'))
        })}
        onSubmit={(formData: ConnectorConfigDTO) => {
          trackEvent(ConnectorActions.CreateConnectorSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.SumoLogic
          })
          nextStep?.(isEditMode ? { ...connectorInfo, ...prevStepData, ...formData } : { ...prevStepData, ...formData })
        }}
      >
        <FormikForm className={css.form}>
          <Layout.Vertical spacing="large" height={450}>
            <FormInput.Select
              name="url"
              items={endPointOptions}
              label={getString('connectors.sumologic.urlLabel')}
              placeholder={loadingEndpoints ? getString('loading') : undefined}
            />
            <SecretInput label={getString('connectors.sumologic.encryptedAccessIdLabel')} name="accessIdRef" />
            <SecretInput label={getString('connectors.sumologic.encryptedAccessKeyLabel')} name="accessKeyRef" />
          </Layout.Vertical>
          <Layout.Horizontal spacing="xlarge">
            <Button onClick={() => props.previousStep?.({ ...props.prevStepData })} text={getString('back')} />
            <Button type="submit" text={getString('next')} intent="primary" />
          </Layout.Horizontal>
        </FormikForm>
      </Formik>
    </Container>
  )
}

export default cvConnectorHOC({
  connectorType: Connectors.SUMOLOGIC,
  ConnectorCredentialsStep: SumoLogicConfigStep,
  buildSubmissionPayload: buildSumoLogicPayload
})
