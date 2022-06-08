/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import cx from 'classnames'
import {
  StepProps,
  Formik,
  FormikForm,
  FormInput,
  Layout,
  Text,
  Button,
  Container,
  ButtonVariation
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import type { ConnectorConfigDTO, ConnectorInfoDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import css from '../commonSteps/ConnectorCommonStyles.module.scss'

export interface AWSCCDetailsStepProps extends StepProps<ConnectorConfigDTO> {
  isEditMode: boolean
  connectorInfo?: ConnectorInfoDTO
}

export default function AWSCCDetailsStep(props: AWSCCDetailsStepProps) {
  const { getString } = useStrings()
  const [initialValues, setInitialValues] = useState<ConnectorConfigDTO>({
    urlType: 'Region',
    url: undefined
  })

  const handleSubmit = (formData: ConnectorConfigDTO) => {
    trackEvent(ConnectorActions.DetailsStepSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.AWSCC
    })
    props.nextStep?.({ ...props.prevStepData, ...formData })
  }

  useEffect(() => {
    if (props.isEditMode) {
      setInitialValues({
        urlType: props?.connectorInfo?.spec?.type,
        url: props?.connectorInfo?.spec?.url
      })
    }
  }, [])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.DetailsStepLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.AWSCC
  })

  return (
    <Layout.Vertical width="60%" style={{ minHeight: 460 }} className={css.stepContainer}>
      <Text font={{ variation: FontVariation.H3 }} tooltipProps={{ dataTooltipId: 'awsCCDetailsTooltip' }}>
        {getString('details')}
      </Text>

      <Formik
        enableReinitialize
        initialValues={{
          ...initialValues,
          ...props.prevStepData
        }}
        formName="awsCCDetailsForm"
        validationSchema={Yup.object().shape({
          urlType: Yup.string().required(),
          url: Yup.string().required()
        })}
        onSubmit={handleSubmit}
      >
        <FormikForm className={cx(css.fullHeight, css.fullHeightDivsWithFlex)}>
          <Container className={css.paddingTop8}>
            <FormInput.RadioGroup
              name="urlType"
              label={<Text font={{ variation: FontVariation.FORM_LABEL }}>{getString('common.git.urlType')}</Text>}
              items={[
                { value: 'Region', label: getString('regionLabel') },
                { value: 'Repo', label: getString('repository') }
              ]}
              radioGroup={{ inline: true }}
            />
            <FormInput.Text
              name="url"
              label={
                <Text font={{ variation: FontVariation.FORM_LABEL }}>
                  {getString('connectors.awsCodeCommit.repoUrl')}
                </Text>
              }
              placeholder={getString('UrlLabel')}
            />
          </Container>
          <Layout.Horizontal spacing="medium">
            <Button
              icon="chevron-left"
              onClick={() => props.previousStep?.({ ...props.prevStepData })}
              text={getString('back')}
              variation={ButtonVariation.SECONDARY}
            />
            <Button
              type="submit"
              intent="primary"
              rightIcon="chevron-right"
              text={getString('saveAndContinue')}
              variation={ButtonVariation.PRIMARY}
            />
          </Layout.Horizontal>
        </FormikForm>
      </Formik>
    </Layout.Vertical>
  )
}
