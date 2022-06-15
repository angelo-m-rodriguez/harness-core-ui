/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import {
  FormikForm,
  FormInput,
  Button,
  Layout,
  Icon,
  Text,
  Heading,
  ButtonProps,
  MultiTypeInputType
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { useToaster } from '@common/components'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'
import { useStrings } from 'framework/strings'
import { useTestNotificationSetting, PagerDutySettingDTO } from 'services/notifications'
import type { PagerDutyNotificationConfiguration } from '@notifications/interfaces/Notifications'
import { TestStatus, NotificationType } from '@notifications/interfaces/Notifications'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import css from '../../ConfigureNotificationsModal.module.scss'

interface ConfigurePagerDutyNotificationsProps {
  onSuccess: (config: PagerDutyNotificationConfiguration) => void
  hideModal: () => void
  isStep?: boolean
  withoutHeading?: boolean
  onBack?: () => void
  submitButtonText?: string
  config?: PagerDutyNotificationConfiguration
  expressions?: string[]
}

interface PagerDutyNotificationData {
  key: string
  pagerDutyKey?: string
  userGroups: string[]
}

export const TestPagerDutyNotifications: React.FC<{
  data: PagerDutyNotificationData
  onClick?: () => Promise<boolean>
  buttonProps?: ButtonProps
}> = ({ data, onClick, buttonProps }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const [testStatus, setTestStatus] = useState<TestStatus>(TestStatus.INIT)
  const { mutate: testNotificationSetting } = useTestNotificationSetting({})
  const { showSuccess, showError } = useToaster()

  const handleTest = async (testData: PagerDutyNotificationData): Promise<void> => {
    if (onClick) {
      const success = await onClick()
      if (!success) return
    }
    try {
      setTestStatus(TestStatus.INIT)
      const resp = await testNotificationSetting({
        accountId,
        type: 'PAGERDUTY',
        recipient: testData.key || testData.pagerDutyKey,
        notificationId: 'asd'
      } as PagerDutySettingDTO)
      if (resp.status === 'SUCCESS' && resp.data) {
        showSuccess(getString('notifications.pagerDutyTestSuccess'))
        setTestStatus(TestStatus.SUCCESS)
      } else {
        showError(getString('somethingWentWrong'))
        setTestStatus(TestStatus.FAILED)
      }
    } catch (err) {
      showError(getString('notifications.invalidPagerDutyKey'))
      setTestStatus(TestStatus.ERROR)
    }
  }
  return (
    <>
      <Button text={getString('test')} onClick={() => handleTest(data)} {...buttonProps} />
      {testStatus === TestStatus.SUCCESS ? <Icon name="tick" className={cx(css.statusIcon, css.green)} /> : null}
      {testStatus === TestStatus.FAILED || testStatus === TestStatus.ERROR ? (
        <Icon name="cross" className={cx(css.statusIcon, css.red)} />
      ) : null}
    </>
  )
}

const ConfigurePagerDutyNotifications: React.FC<ConfigurePagerDutyNotificationsProps> = props => {
  const { getString } = useStrings()

  const handleSubmit = (formData: PagerDutyNotificationData): void => {
    props.onSuccess({
      type: NotificationType.PagerDuty,
      ...formData
    })
  }

  return (
    <div className={css.body}>
      <Layout.Vertical spacing="large">
        {props.withoutHeading ? null : (
          <>
            <Icon name="service-pagerduty" size={24} />
            <Heading className={css.title}>{getString('notifications.titlePagerDuty')}</Heading>
          </>
        )}
        <Text>{getString('notifications.helpPagerDuty')}</Text>
        <Text>{getString('notifications.infoPagerDuty')}</Text>
        <Formik
          onSubmit={handleSubmit}
          validationSchema={Yup.object().shape({
            key: Yup.string().trim().required(getString('notifications.validationPDKey'))
          })}
          initialValues={{
            key: '',
            userGroups: [],
            ...props.config
          }}
        >
          {formik => {
            return (
              <FormikForm>
                {props.expressions ? (
                  <FormInput.MultiTextInput
                    name={'key'}
                    label={getString('notifications.labelPDKey')}
                    multiTextInputProps={{
                      expressions: props.expressions,
                      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
                    }}
                  />
                ) : (
                  <FormInput.Text name={'key'} label={getString('notifications.labelPDKey')} />
                )}

                <Layout.Horizontal margin={{ bottom: 'xxlarge' }} style={{ alignItems: 'center' }}>
                  <TestPagerDutyNotifications data={formik.values} />
                </Layout.Horizontal>
                <UserGroupsInput name="userGroups" label={getString('notifications.labelSlackUserGroups')} />
                {props.isStep ? (
                  <Layout.Horizontal spacing="medium" margin={{ top: 'xlarge' }}>
                    <Button text={getString('back')} onClick={props.onBack} />
                    <Button text={props.submitButtonText || getString('next')} intent="primary" type="submit" />
                  </Layout.Horizontal>
                ) : (
                  <Layout.Horizontal spacing={'medium'} margin={{ top: 'xxlarge' }}>
                    <Button type={'submit'} intent={'primary'} text={props.submitButtonText || getString('submit')} />
                    <Button text={getString('cancel')} onClick={props.hideModal} />
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

export default ConfigurePagerDutyNotifications
