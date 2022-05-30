/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Button, ButtonVariation, Container, Formik, FormInput, Layout, StepProps, Text } from '@wings-software/uicore'
import React from 'react'
import { Color } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import type { NotificationRules } from 'services/pipeline-ng'
import { NameSchema } from '@common/utils/Validation'

interface OverviewProps {
  data?: NotificationRules
  existingNotificationNames?: string[]
}

function Overview({
  data,
  existingNotificationNames = [],
  nextStep,
  prevStepData
}: StepProps<NotificationRules> & OverviewProps): React.ReactElement {
  const { getString } = useStrings()
  return (
    <Layout.Vertical spacing="xxlarge" padding="small">
      <Text font="medium" color={Color.BLACK}>
        {getString('notifications.nameOftheRule')}
      </Text>
      <Formik
        initialValues={{ name: '', identifier: '', ...data, ...prevStepData }}
        formName="notificationsOverview"
        validationSchema={Yup.object().shape({
          name: (NameSchema() as Yup.StringSchema<string>).test(
            'isNameUnique',
            getString('validation.notificationNameDuplicate'),
            name => {
              return existingNotificationNames.indexOf(name) === -1
            }
          )
        })}
        onSubmit={values => {
          nextStep?.(values)
        }}
      >
        {() => {
          return (
            <Form>
              <Container height={400} width={400}>
                <FormInput.InputWithIdentifier
                  inputName="name"
                  inputLabel={getString('notifications.notificationName')}
                  isIdentifierEditable={!data}
                />
              </Container>
              <Button
                type="submit"
                variation={ButtonVariation.PRIMARY}
                rightIcon="chevron-right"
                text={getString('continue')}
              />
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default Overview
