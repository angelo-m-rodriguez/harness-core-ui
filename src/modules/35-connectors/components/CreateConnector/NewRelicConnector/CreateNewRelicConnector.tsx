/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import { Layout, Button, Text, FormInput, FormikForm, Container, SelectOption, Icon } from '@wings-software/uicore'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import { PopoverInteractionKind, Tooltip } from '@blueprintjs/core'
import { useToaster } from '@common/exports'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { useGetNewRelicEndPoints } from 'services/cv'
import { buildNewRelicPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { Connectors } from '@connectors/constants'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { cvConnectorHOC } from '../CommonCVConnector/CVConnectorHOC'
import type { ConnectionConfigProps } from '../CommonCVConnector/constants'
import { StepDetailsHeader } from '../CommonCVConnector/components/CredentialsStepHeader/CredentialsStepHeader'
import { initializeNewRelicConnector } from './utils'
import { ConnectorSecretField } from '../CommonCVConnector/components/ConnectorSecretField/ConnectorSecretField'
import css from './CreateNewRelicConnector.module.scss'

function AccountIdTooltip(): JSX.Element {
  const { getString } = useStrings()
  return (
    <Tooltip
      interactionKind={PopoverInteractionKind.HOVER}
      hoverCloseDelay={500}
      content={
        <>
          <Text style={{ display: 'inline-block', marginRight: 'var(--spacing-xsmall)' }} color={Color.GREY_350}>
            {getString('connectors.newRelic.accountIdTooltip')}
          </Text>
          <a
            target="_blank"
            rel="noreferrer"
            href={'https://docs.newrelic.com/docs/accounts/accounts-billing/account-setup/account-id/'}
            style={{ color: 'var(--primary-7)' }}
          >
            {getString('clickHere')}
          </a>
        </>
      }
    >
      <Icon name="info" size={12} />
    </Tooltip>
  )
}

function NewRelicConfigStep(props: ConnectionConfigProps): JSX.Element {
  const { nextStep, prevStepData, connectorInfo, isEditMode, accountId, projectIdentifier, orgIdentifier } = props
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const { data: endPoints, error: endPointError, loading: loadingEndpoints } = useGetNewRelicEndPoints({})
  const [initialValues, setInitialValues] = useState(
    initializeNewRelicConnector({ prevStepData, accountId, projectIdentifier, orgIdentifier })
  )

  const initialSecretValue = initialValues.apiKeyRef?.referenceString || initialValues.apiKeyRef

  const endPointOptions = useMemo(() => {
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
      setInitialValues({ ...initialValues, url: filteredPoints[0] })
    }
    return filteredPoints
  }, [endPoints, endPointError, loadingEndpoints])

  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.CreateConnectorLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.NewRelic
  })

  return (
    <Container className={css.credentials}>
      <StepDetailsHeader connectorTypeLabel={getString('connectors.newRelicLabel')} />
      <Formik
        enableReinitialize
        initialValues={{ ...initialValues }}
        validationSchema={Yup.object().shape({
          url: Yup.string().trim().required(getString('connectors.newRelic.urlValidation')),
          newRelicAccountId: Yup.string().trim().required(getString('connectors.newRelic.accountIdValidation')),
          apiKeyRef: Yup.string().trim().required(getString('connectors.encryptedAPIKeyValidation'))
        })}
        onSubmit={(formData: ConnectorConfigDTO) => {
          trackEvent(ConnectorActions.CreateConnectorSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.NewRelic
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData })
        }}
      >
        {formikProps => (
          <FormikForm className={css.form}>
            <Layout.Vertical spacing="large" height={400}>
              <FormInput.Select
                placeholder={loadingEndpoints ? getString('loading') : undefined}
                items={endPointOptions}
                value={(formikProps.values as any).url}
                onChange={updatedOption => formikProps.setFieldValue('url', updatedOption)}
                label={getString('connectors.newRelic.urlFieldLabel')}
                name="url"
              />
              <FormInput.Text
                label={
                  <Container className={css.identifierLabel}>
                    <Text inline>{getString('connectors.newRelic.accountIdFieldLabel')}</Text>
                    <AccountIdTooltip />
                  </Container>
                }
                name="newRelicAccountId"
              />
              <ConnectorSecretField
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                secretFieldValue={initialSecretValue}
                secretInputProps={{
                  label: getString('connectors.encryptedAPIKeyLabel'),
                  name: 'apiKeyRef'
                }}
                onSuccessfulFetch={result => {
                  formikProps.setFieldValue('apiKeyRef', result)
                }}
              />
            </Layout.Vertical>
            <Layout.Horizontal spacing="large">
              <Button onClick={() => props.previousStep?.({ ...props.prevStepData })} text={getString('back')} />
              <Button type="submit" text={getString('continue')} intent="primary" />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}

export default cvConnectorHOC({
  connectorType: 'NewRelic',
  ConnectorCredentialsStep: NewRelicConfigStep,
  buildSubmissionPayload: buildNewRelicPayload
})
