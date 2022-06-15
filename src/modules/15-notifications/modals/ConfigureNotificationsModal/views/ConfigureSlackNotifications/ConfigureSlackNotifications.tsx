/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  FormikForm,
  FormInput,
  Button,
  Layout,
  Icon,
  Text,
  Heading,
  ButtonProps,
  Formik,
  ButtonVariation,
  MultiTypeInputType,
  getMultiTypeFromValue
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import cx from 'classnames'
import { isEmpty } from 'lodash-es'
import { URLValidationSchema, URLValidationSchemaWithoutRequired } from '@common/utils/Validation'
import { useToaster } from '@common/components'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'
import { useTestNotificationSetting, SlackSettingDTO } from 'services/notifications'
import { NotificationType, SlackNotificationConfiguration, TestStatus } from '@notifications/interfaces/Notifications'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import css from '../../ConfigureNotificationsModal.module.scss'

interface ConfigureSlackNotificationsProps {
  onSuccess: (config: SlackNotificationConfiguration) => void
  hideModal: () => void
  withoutHeading?: boolean
  isStep?: boolean
  onBack?: (config?: SlackNotificationConfiguration) => void
  submitButtonText?: string
  config?: SlackNotificationConfiguration
  expressions?: string[]
}

interface SlackNotificationData {
  webhookUrl: string
  slackWebhookUrl?: string
  userGroups: string[]
}

export const TestSlackNotifications: React.FC<{
  data: SlackNotificationData
  onClick?: () => Promise<boolean>
  buttonProps?: ButtonProps
}> = ({ data, onClick, buttonProps }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const [testStatus, setTestStatus] = useState<TestStatus>(TestStatus.INIT)
  const { mutate: testNotificationSetting } = useTestNotificationSetting({})
  const { showSuccess, showError } = useToaster()

  const handleTest = async (testData: SlackNotificationData): Promise<void> => {
    if (onClick) {
      const success = await onClick()
      if (!success) return
    }
    try {
      setTestStatus(TestStatus.INIT)
      const resp = await testNotificationSetting({
        accountId,
        type: 'SLACK',
        recipient: testData.webhookUrl || testData.slackWebhookUrl,
        notificationId: 'asd'
      } as SlackSettingDTO)
      if (resp.status === 'SUCCESS' && resp.data) {
        showSuccess(getString('notifications.slackTestSuccess'))
        setTestStatus(TestStatus.SUCCESS)
      } else {
        showError(getString('somethingWentWrong'))
        setTestStatus(TestStatus.FAILED)
      }
    } catch (err) {
      showError(getString('notifications.invalidWebhookURL'))
      setTestStatus(TestStatus.ERROR)
    }
  }
  return (
    <>
      <Button
        text={getString('test')}
        disabled={!data.webhookUrl?.length}
        tooltipProps={{ dataTooltipId: 'testSlackConfigButton' }}
        onClick={() => handleTest(data)}
        {...buttonProps}
      />
      {testStatus === TestStatus.SUCCESS ? <Icon name="tick" className={cx(css.statusIcon, css.green)} /> : null}
      {testStatus === TestStatus.FAILED || testStatus === TestStatus.ERROR ? (
        <Icon name="cross" className={cx(css.statusIcon, css.red)} />
      ) : null}
    </>
  )
}

const ConfigureSlackNotifications: React.FC<ConfigureSlackNotificationsProps> = props => {
  const [webhookUrlType, setWebhookUrlType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(props.config?.webhookUrl)
  )
  const { getString } = useStrings()

  const handleSubmit = (formData: SlackNotificationData): void => {
    props.onSuccess(convertFormData(formData))
  }

  const convertFormData = (formData: SlackNotificationData) => {
    return {
      type: NotificationType.Slack,
      ...formData
    }
  }

  return (
    <div className={css.body}>
      <Layout.Vertical spacing="large">
        {props.withoutHeading ? null : (
          <>
            <Icon name="service-slack" size={24} />
            <Heading className={css.title}>{getString('notifications.titleSlack')}</Heading>
          </>
        )}
        <Text>{getString('notifications.helpSlack')}</Text>
        <Text>{getString('notifications.infoSlack')}</Text>

        <Formik
          onSubmit={handleSubmit}
          formName="configureSlackNotifications"
          validationSchema={Yup.object().shape({
            // TODO: Create global validation function for url validation
            webhookUrl: Yup.string().when('userGroups', {
              is: val => isEmpty(val),
              then: webhookUrlType === MultiTypeInputType.EXPRESSION ? Yup.string().required() : URLValidationSchema(),
              otherwise:
                webhookUrlType === MultiTypeInputType.EXPRESSION ? Yup.string() : URLValidationSchemaWithoutRequired()
            })
          })}
          initialValues={{
            webhookUrl: '',
            userGroups: [],
            ...props.config
          }}
        >
          {formik => {
            return (
              <FormikForm>
                {props.expressions ? (
                  <FormInput.MultiTextInput
                    name={'webhookUrl'}
                    label={getString('notifications.slackwebhookUrl')}
                    multiTextInputProps={{
                      expressions: props.expressions,
                      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                      onTypeChange: setWebhookUrlType
                    }}
                  />
                ) : (
                  <FormInput.Text name={'webhookUrl'} label={getString('notifications.slackwebhookUrl')} />
                )}

                <Layout.Horizontal margin={{ bottom: 'xxlarge' }} style={{ alignItems: 'center' }}>
                  <TestSlackNotifications
                    data={formik.values}
                    buttonProps={{ disabled: webhookUrlType === MultiTypeInputType.EXPRESSION }}
                  />
                </Layout.Horizontal>
                <UserGroupsInput name="userGroups" label={getString('notifications.labelSlackUserGroups')} />
                {props.isStep ? (
                  <Layout.Horizontal spacing="large" className={css.buttonGroupSlack}>
                    <Button
                      text={getString('back')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={() => {
                        props.onBack?.(convertFormData(formik.values))
                      }}
                    />
                    <Button
                      text={props.submitButtonText || getString('next')}
                      disabled={!(formik.values.userGroups.length || formik.values.webhookUrl?.length)}
                      variation={ButtonVariation.PRIMARY}
                      type="submit"
                    />
                  </Layout.Horizontal>
                ) : (
                  <Layout.Horizontal spacing={'medium'} margin={{ top: 'xxlarge' }}>
                    <Button
                      type={'submit'}
                      variation={ButtonVariation.PRIMARY}
                      text={props.submitButtonText || getString('submit')}
                    />
                    <Button
                      text={getString('cancel')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={props.hideModal}
                    />
                  </Layout.Horizontal>
                )}
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </div>
  )
}

export default ConfigureSlackNotifications
