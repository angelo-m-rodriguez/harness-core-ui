/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect } from 'react'
import {
  Button,
  Container,
  Formik,
  FormikForm,
  Heading,
  Layout,
  StepProps,
  FormInput,
  Text
} from '@wings-software/uicore'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { DialogExtensionContext } from '@connectors/common/ConnectorExtention/DialogExtention'
import type { GcpBillingExportSpec, GcpCloudCostConnector } from 'services/cd-ng'
import { CE_GCP_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import type { CEGcpConnectorDTO } from './OverviewStep'
import BillingExportExtention from './BillingExportExtention'
import css from '../CreateCeGcpConnector.module.scss'

const BillingExport: React.FC<StepProps<CEGcpConnectorDTO>> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_GCP_CONNECTOR_CREATION_EVENTS.LOAD_BILLING_EXPORT_SETUP)

  const { prevStepData, nextStep, previousStep } = props

  const { triggerExtension, closeExtension } = useContext(DialogExtensionContext)

  const handleSubmit = (formData: GcpBillingExportSpec) => {
    const newSpec: GcpCloudCostConnector = {
      projectId: '',
      featuresEnabled: ['BILLING'],
      ...prevStepData?.spec,
      billingExportSpec: {
        datasetId: formData.datasetId,
        tableId: formData.tableId || ''
      },
      serviceAccountEmail: ''
    }
    const payload = prevStepData
    if (payload) {
      payload.spec = newSpec
    }

    closeExtension()
    if (nextStep) nextStep(payload)
  }

  useEffect(() => {
    triggerExtension(BillingExportExtention)
  }, [])

  const handlePrev = () => {
    closeExtension()
    previousStep?.({ ...(prevStepData as CEGcpConnectorDTO) })
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CEGcpConnectorBillingExportLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceGcp.billingExport.heading')}
      </Heading>
      <div className={css.subHeader} style={{ paddingRight: 40 }}>
        {getString('connectors.ceGcp.billingExport.description')}
      </div>
      <Text
        font="small"
        className={css.info}
        color="primary7"
        inline
        icon="info-sign"
        iconProps={{ size: 15, color: 'primary7', margin: { right: 'xsmall' } }}
      >
        {getString('connectors.ceGcp.billingExport.followInstruction')}
      </Text>
      <Container>
        <Button
          className={css.launchTemplateBut}
          text={getString('connectors.ceGcp.billingExport.launchTemplate')}
          rightIcon="chevron-right"
          onClick={() => {
            window.open('https://console.cloud.google.com/bigquery')
          }}
        />
      </Container>
      <div style={{ flex: 1 }}>
        <Formik<GcpBillingExportSpec>
          initialValues={{
            datasetId: prevStepData?.spec.billingExportSpec?.datasetId || '',
            tableId: get(prevStepData, 'spec.billingExportSpec.tableId', '')
          }}
          onSubmit={formData => {
            trackEvent(ConnectorActions.CEGcpConnectorBillingExportSubmit, {
              category: Category.CONNECTOR
            })
            handleSubmit(formData)
          }}
          formName="ceGcpBillingExport"
        >
          {() => (
            <FormikForm>
              <div>
                <FormInput.Text
                  name={'datasetId'}
                  tooltipProps={{
                    dataTooltipId: 'gcp-dataset-name'
                  }}
                  label={getString('connectors.ceGcp.billingExport.datasetIdLabel')}
                  className={css.dataFields}
                />

                <FormInput.Text
                  name={'tableId'}
                  tooltipProps={{
                    dataTooltipId: 'gcp-table-name'
                  }}
                  label={getString('connectors.ceGcp.billingExport.tableIdLabel')}
                  className={css.dataFields}
                />
              </div>

              <Layout.Horizontal className={css.buttonPanel} spacing="small">
                <Button text={getString('previous')} icon="chevron-left" onClick={handlePrev}></Button>
                <Button type="submit" intent="primary" text={getString('continue')} rightIcon="chevron-right" />
              </Layout.Horizontal>
            </FormikForm>
          )}
        </Formik>
      </div>
    </Layout.Vertical>
  )
}

export default BillingExport
