/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import * as Yup from 'yup'
import {
  Button,
  Formik,
  FormikForm,
  Layout,
  StepProps,
  FormInput,
  Text,
  ButtonSize,
  ButtonVariation,
  Icon
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { AwsCurAttributes, CEAwsConnector } from 'services/cd-ng'
import { CE_AWS_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import ConnectorInstructionList from '@connectors/common/ConnectorCreationInstructionList/ConnectorCreationInstructionList'
import { connectorHelperUrls } from '@connectors/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import CostUsageReportExisting from './CostUsageReportExisting'
import type { CEAwsConnectorDTO } from './OverviewStep'
import css from '../CreateCeAwsConnector.module.scss'

const CostUsageStep: React.FC<StepProps<CEAwsConnectorDTO>> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_AWS_CONNECTOR_CREATION_EVENTS.LOAD_CUR_STEP)

  const { prevStepData, nextStep, previousStep } = props
  const existingCurReports = prevStepData?.existingCurReports || []
  const [isExistingCostUsageReport, setIsExistingCostUsageReport] = useState<boolean>(
    (!prevStepData?.includeBilling || false) && (existingCurReports.length > 0 || false)
  )

  const handleSubmit = (formData: AwsCurAttributes) => {
    const newspec: CEAwsConnector = {
      crossAccountAccess: { crossAccountRoleArn: '' },
      ...prevStepData?.spec,
      curAttributes: formData
    }
    const payload = prevStepData
    if (payload) {
      payload.spec = newspec
      payload.includeBilling = !isExistingCostUsageReport
    }
    nextStep?.(payload)
  }

  const handlePrev = () => {
    previousStep?.({ ...(prevStepData as CEAwsConnectorDTO) })
  }

  const getValidationScheme = () => {
    if (isExistingCostUsageReport) return undefined
    else
      return Yup.object().shape({
        reportName: Yup.string().required(getString('connectors.ceAws.cur.validation.reportRequired')),
        s3BucketName: Yup.string().required(getString('connectors.ceAws.cur.validation.bucketRequired'))
      })
  }

  const instructionsList = [
    {
      type: 'button',
      text: 'connectors.ceAws.cur.launchTemplate',
      icon: 'main-share',
      url: connectorHelperUrls.ceAwsLaunchConsole,
      listClassName: 'btnInstruction'
    },
    {
      type: 'text',
      text: 'connectors.ceAws.cur.instructions.i1'
    },
    {
      type: 'hybrid',
      renderer: function instructionRenderer() {
        return (
          <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
            {getString('connectors.ceAws.cur.instructions.i2')}
            <a href={connectorHelperUrls.ceAwscostUsageReportSteps} target="_blank" rel="noreferrer">
              {getString('connectors.ceAws.cur.instructions.i3')}
              <Icon name="main-share" size={16} color={Color.PRIMARY_7} />
            </a>
          </Text>
        )
      }
    },
    {
      type: 'text',
      text: 'connectors.ceAws.cur.instructions.i4'
    }
  ]

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CENGAwsConnectorCostUsageReportLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'awsConnectorCUR' }}
        margin={{ bottom: 'large' }}
      >
        {getString('connectors.ceAws.cur.heading')}
      </Text>
      <Text color={Color.GREY_800} font={{ variation: FontVariation.BODY }} margin={{ bottom: 'large' }}>
        {getString('connectors.ceAws.cur.subheading')}
      </Text>

      {!isExistingCostUsageReport && <ConnectorInstructionList instructionsList={instructionsList} />}

      <div style={{ flex: 1 }}>
        <Formik<AwsCurAttributes>
          formName="costUsageReportForm"
          initialValues={{
            reportName: prevStepData?.spec?.curAttributes?.reportName || '',
            s3BucketName: prevStepData?.spec?.curAttributes?.s3BucketName || ''
          }}
          validationSchema={getValidationScheme()}
          onSubmit={formData => {
            trackEvent(ConnectorActions.CENGAwsConnectorCostUsageReportSubmit, {
              category: Category.CONNECTOR
            })
            handleSubmit(formData)
          }}
        >
          {() => (
            <FormikForm>
              {isExistingCostUsageReport && (
                <Layout.Vertical spacing="xlarge" className={css.existingReportsWrapper}>
                  <CostUsageReportExisting existingCurReports={prevStepData?.existingCurReports || []} />
                  <div>
                    <ul>
                      <li className={css.hintsLineItem}>{getString('connectors.ceAws.curExising.nextStepHint1')}</li>
                      <li className={css.hintsLineItem}>
                        {getString('connectors.ceAws.curExising.nextStepHint2')}
                        <Button
                          rightIcon="chevron-right"
                          text={getString('connectors.ceAws.cur.createNew')}
                          onClick={() => {
                            setIsExistingCostUsageReport(false)
                          }}
                          size={ButtonSize.SMALL}
                          variation={ButtonVariation.SECONDARY}
                        />
                      </li>
                    </ul>
                  </div>
                </Layout.Vertical>
              )}

              {!isExistingCostUsageReport && (
                <div>
                  <FormInput.Text
                    name={'reportName'}
                    label={getString('connectors.ceAws.cur.reportName')}
                    className={css.dataFields}
                    tooltipProps={{ dataTooltipId: 'reportName' }}
                  />
                  <FormInput.Text
                    name={'s3BucketName'}
                    label={getString('connectors.ceAws.cur.bucketName')}
                    className={css.dataFields}
                    tooltipProps={{ dataTooltipId: 's3BucketName' }}
                  />
                  <a
                    href={connectorHelperUrls.ceAwsNoAccount}
                    target="_blank"
                    rel="noreferrer"
                    className={css.noAccountLink}
                  >
                    {getString('connectors.ceAws.cur.noAccountLink')}
                  </a>
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

export default CostUsageStep
