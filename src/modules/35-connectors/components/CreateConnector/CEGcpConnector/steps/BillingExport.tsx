/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect, useState } from 'react'
import {
  Button,
  Container,
  Formik,
  FormikForm,
  Heading,
  Layout,
  StepProps,
  FormInput,
  Text,
  ExpandingSearchInput,
  Table,
  ButtonSize,
  ButtonVariation
} from '@wings-software/uicore'
import { get } from 'lodash-es'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { DialogExtensionContext } from '@connectors/common/ConnectorExtention/DialogExtention'
import type { GcpBillingExportSpec, GcpCloudCostConnector } from 'services/cd-ng'
import { CE_GCP_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import type { CEGcpConnectorDTO, ExistingCURDetails } from './OverviewStep'
import BillingExportExtention from './BillingExportExtention'
import css from '../CreateCeGcpConnector.module.scss'

interface CostUsageReportExistingProps {
  existingCurReports: ExistingCURDetails[]
}

const CostUsageReportExisting: React.FC<CostUsageReportExistingProps> = props => {
  const { getString } = useStrings()
  const [curReports, setCurReports] = useState(props.existingCurReports)

  const onChange = (searchVal: string) => {
    let filteredReports = props.existingCurReports
    if (searchVal) {
      filteredReports = filteredReports.filter(item => item.projectId.includes(searchVal))
    }
    setCurReports(filteredReports)
  }

  return (
    <div>
      <Layout.Vertical>
        <Text color={Color.GREY_800} font={{ variation: FontVariation.BODY }}>
          {getString('connectors.ceGcp.billingExport.subHeading', { reportCount: props.existingCurReports.length })}
        </Text>
        <div className={css.existingCurTable}>
          <ExpandingSearchInput
            onChange={/* istanbul ignore next */ text => onChange(text.trim())}
            alwaysExpanded={true}
            placeholder={getString('connectors.ceGcp.existingCurTable.searchPlaceholder')}
          />
          <Table
            data={curReports}
            columns={[
              {
                accessor: 'projectId',
                Header: getString('connectors.ceGcp.existingCurTable.projectId'),
                id: 'awsAccountId',
                width: '26%'
              },
              {
                accessor: 'datasetId',
                Header: getString('connectors.ceGcp.billingExport.datasetIdLabel'),
                width: '37%'
              },
              {
                accessor: 'tableId',
                Header: getString('connectors.ceGcp.billingExport.tableIdLabel'),
                width: '37%'
              }
            ]}
            bpTableProps={{ bordered: true, condensed: true, striped: false }}
          ></Table>
        </div>
      </Layout.Vertical>
    </div>
  )
}

const BillingExport: React.FC<StepProps<CEGcpConnectorDTO>> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_GCP_CONNECTOR_CREATION_EVENTS.LOAD_BILLING_EXPORT_SETUP)

  const { prevStepData, nextStep, previousStep } = props

  const { triggerExtension, closeExtension } = useContext(DialogExtensionContext)
  const existingCurReports = prevStepData?.existingCurReports || []
  const [isExistingCostUsageReport, setIsExistingCostUsageReport] = useState<boolean>(
    existingCurReports.length > 0 || false
  )

  const handleSubmit = (formData: GcpBillingExportSpec) => {
    const newSpec: GcpCloudCostConnector = {
      projectId: '',
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
      payload.includeBilling = !isExistingCostUsageReport
    }

    closeExtension()
    if (nextStep) nextStep(payload)
  }

  useEffect(() => {
    !isExistingCostUsageReport && triggerExtension(BillingExportExtention)
  }, [])

  const handlePrev = () => {
    closeExtension()
    previousStep?.({ ...(prevStepData as CEGcpConnectorDTO) })
  }

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceGcp.billingExport.heading')}
      </Heading>
      <div className={css.subHeader} style={{ paddingRight: 40 }}>
        {getString('connectors.ceGcp.billingExport.description')}
      </div>
      {!isExistingCostUsageReport && (
        <>
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
        </>
      )}
      <div style={{ flex: 1 }}>
        <Formik<GcpBillingExportSpec>
          initialValues={{
            datasetId: prevStepData?.spec.billingExportSpec?.datasetId || '',
            tableId: get(prevStepData, 'spec.billingExportSpec.tableId', '')
          }}
          onSubmit={formData => handleSubmit(formData)}
          formName="ceGcpBillingExport"
        >
          {() => (
            <FormikForm>
              {isExistingCostUsageReport ? (
                <Layout.Vertical spacing="xlarge">
                  <CostUsageReportExisting existingCurReports={prevStepData?.existingCurReports || []} />
                  <div>
                    <ul>
                      <Layout.Vertical spacing={'small'}>
                        <li>{getString('connectors.ceGcp.existingCurTable.nextStepHint1')}</li>
                        <li>
                          {getString('connectors.ceGcp.existingCurTable.nextStepHint2')}
                          <Button
                            rightIcon="chevron-right"
                            text={getString('connectors.ceGcp.billingExport.setupNew')}
                            onClick={() => {
                              setIsExistingCostUsageReport(false)
                              triggerExtension(BillingExportExtention)
                            }}
                            size={ButtonSize.SMALL}
                            variation={ButtonVariation.SECONDARY}
                          />
                        </li>
                      </Layout.Vertical>
                    </ul>
                  </div>
                </Layout.Vertical>
              ) : (
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
              )}

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
