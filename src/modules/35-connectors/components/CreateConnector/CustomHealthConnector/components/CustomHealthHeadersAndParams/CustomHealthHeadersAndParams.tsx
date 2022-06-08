/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash-es'
import {
  Container,
  FormikForm,
  Layout,
  FormInput,
  Formik,
  Button,
  Text,
  Heading,
  PageSpinner
} from '@wings-software/uicore'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { CustomHealthKeyValueMapper } from '../CustomHealthKeyValueMapper/CustomHealthKeyValueMapper'
import type { BaseCompFields, CustomHealthHeadersAndParamsProps } from './CustomHealthHeadersAndParams.types'
import { DefaultHeadersAndParamsInitialValues, FieldNames } from './CustomHealthHeadersAndParams.constants'
import { transformSpecDataToStepData, validateHeadersAndParams } from './CustomHealthHeadersAndParams.utils'
import css from './CustomHealthHeadersAndParams.module.scss'

export function CustomHealthHeadersAndParams(props: CustomHealthHeadersAndParamsProps): JSX.Element {
  const {
    prevStepData,
    nextStep,
    connectorInfo,
    projectIdentifier,
    orgIdentifier,
    accountId,
    name: subStepName,
    addRowButtonLabel,
    nameOfObjectToUpdate
  } = props

  const { getString } = useStrings()
  const [loading, setLoading] = useState<boolean>(true)
  const [initialValues, setInitialValues] = useState<BaseCompFields>(cloneDeep(DefaultHeadersAndParamsInitialValues))

  useEffect(() => {
    transformSpecDataToStepData(prevStepData, {
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId
    })
      .then(initVals => {
        setInitialValues(initVals)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [prevStepData, projectIdentifier, orgIdentifier, accountId])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CustomHealthHeadersAndParamsLoad, {
    category: Category.CONNECTOR
  })

  if (loading) {
    return <PageSpinner />
  }

  return (
    <Container>
      <Text height="40px">{getString('details')}</Text>
      <Formik<BaseCompFields>
        initialValues={initialValues}
        validate={formData => validateHeadersAndParams(formData, getString)}
        formName={`customConnector-${subStepName}`}
        onSubmit={(formData: BaseCompFields): void => {
          trackEvent(ConnectorActions.CustomHealthHeadersAndParamsSubmit, {
            category: Category.CONNECTOR
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData, accountId, projectIdentifier, orgIdentifier })
        }}
      >
        {formik => (
          <FormikForm>
            <FormInput.Text label={getString('connectors.baseURL')} name={FieldNames.BASE_URL} />
            <Heading level={3} className={css.header}>
              {subStepName}
            </Heading>
            <CustomHealthKeyValueMapper
              name={nameOfObjectToUpdate}
              formik={formik}
              prevStepData={prevStepData as ConnectorConfigDTO}
              addRowButtonLabel={addRowButtonLabel}
              className={css.keyValue}
            />
            <Layout.Horizontal spacing="large">
              <Button
                onClick={() => {
                  if (nameOfObjectToUpdate === 'headers') {
                    props.firstStep?.({ ...props.prevStepData })
                  } else {
                    props.previousStep?.({ ...props.prevStepData })
                  }
                }}
                text={getString('back')}
              />
              <Button type="submit" text={getString('next')} intent="primary" />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}
