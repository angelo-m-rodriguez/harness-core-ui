/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import * as Yup from 'yup'
import { Formik, FormikForm, FormInput, Layout, Button } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { ConnectionConfigProps } from '@connectors/components/CreateConnector/CommonCVConnector/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { HTTPRequestMethodOption } from './components/HTTPRequestMethod/HTTPRequestMethod'
import type { CustomHealthValidationPathFormFields } from './CustomHealthValidationPath.types'
import { CustomHealthValidationPathFieldNames } from './CustomHealthValidationPath.constants'
import { HTTPRequestMethod } from './components/HTTPRequestMethod/HTTPRequestMethod.types'
import { transformDataToStepData } from './CustomHealthValidationPath.utils'
import css from './CustomHealthValidationPath.module.scss'

export function CustomHealthValidationPath(props: ConnectionConfigProps): JSX.Element {
  const { prevStepData, accountId, projectIdentifier, orgIdentifier, connectorInfo, nextStep, previousStep } = props
  const { getString } = useStrings()
  const initialValues: CustomHealthValidationPathFormFields = useMemo(
    () => transformDataToStepData(prevStepData),
    [prevStepData]
  )

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CustomHealthValidationPathLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Formik<CustomHealthValidationPathFormFields>
      initialValues={initialValues}
      validationSchema={Yup.object().shape({
        [CustomHealthValidationPathFieldNames.REQUEST_METHOD]: Yup.string().required(
          getString('connectors.customHealth.requestMethod')
        ),
        [CustomHealthValidationPathFieldNames.VALIDATION_PATH]: Yup.string()
          .nullable()
          .required(getString('connectors.customHealth.validationPath')),
        [CustomHealthValidationPathFieldNames.REQUEST_BODY]: Yup.string()
          .nullable()
          .when(CustomHealthValidationPathFieldNames.REQUEST_METHOD, {
            is: HTTPRequestMethod.POST,
            then: Yup.string().trim().required(getString('connectors.customHealth.requestBody'))
          })
      })}
      formName="customConnector-validationPath"
      onSubmit={(formData): void => {
        trackEvent(ConnectorActions.CustomHealthValidationPathSubmit, {
          category: Category.CONNECTOR
        })
        nextStep?.({ ...connectorInfo, ...prevStepData, ...formData, accountId, projectIdentifier, orgIdentifier })
      }}
    >
      {formik => (
        <FormikForm>
          <HTTPRequestMethodOption
            onChange={val => {
              if (val === HTTPRequestMethod.GET) {
                formik.setFieldValue('requestBody', null)
              }
            }}
          />
          <FormInput.Text
            label={getString('connectors.validationPath')}
            name={CustomHealthValidationPathFieldNames.VALIDATION_PATH}
          />
          {formik.values?.requestMethod === HTTPRequestMethod.POST && (
            <FormInput.TextArea
              className={css.httpRequestMethodPostBodyTextArea}
              label={getString('common.smtp.labelBody')}
              name={CustomHealthValidationPathFieldNames.REQUEST_BODY}
            />
          )}
          <Layout.Horizontal spacing="large">
            <Button onClick={() => previousStep?.({ ...props.prevStepData })} text={getString('back')} />
            <Button type="submit" text={getString('next')} intent="primary" />
          </Layout.Horizontal>
        </FormikForm>
      )}
    </Formik>
  )
}
