/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as yup from 'yup'
import {
  Button,
  Layout,
  Formik,
  FormikForm,
  FormInput,
  Container,
  Text,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  ButtonVariation
} from '@wings-software/uicore'
import { Divider } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import PasswordChecklist from '@common/components/PasswordChecklist/PasswordChecklist'
import { PASSWORD_CHECKS_RGX, MIN_NUMBER_OF_CHARACTERS, MAX_NUMBER_OF_CHARACTERS } from '@common/constants/Utils'
import { useChangeUserPassword } from 'services/cd-ng'
import type { PasswordStrengthPolicy } from 'services/cd-ng'
import { useToaster } from '@common/components'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import css from './ChangePasswordForm.module.scss'

interface ChangePasswordFormProps {
  hideModal: () => void
  passwordStrengthPolicy?: PasswordStrengthPolicy
}

interface InputIcon {
  isVisible: boolean
  onClick: () => void
}

interface FormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const enum PasswordTypes {
  CURRENT_PASSWORD,
  NEW_PASSWORD,
  CONFIRM_PASSWORD
}

export enum ChangePasswordResponse {
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  INCORRECT_CURRENT_PASSWORD = 'INCORRECT_CURRENT_PASSWORD',
  PASSWORD_STRENGTH_VIOLATED = 'PASSWORD_STRENGTH_VIOLATED'
}

const InputIcon = ({ isVisible, onClick }: InputIcon): React.ReactElement => (
  <Button
    variation={ButtonVariation.ICON}
    icon={isVisible ? 'eye-open' : 'eye-off'}
    iconProps={{ size: 20 }}
    onClick={onClick}
    margin={{ right: 'xsmall' }}
  />
)

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ hideModal, passwordStrengthPolicy = {} }) => {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { showSuccess } = useToaster()
  const [visiblePasswords, setVisiblePasswords] = React.useState<Array<PasswordTypes>>([])
  const [modalErrorHandler, setModalErrorHandler] = React.useState<ModalErrorHandlerBinding>()

  const { mutate: changeUserPassword, loading: changingUserPassword } = useChangeUserPassword({})

  const handlePasswordVisibility = (passwordType: PasswordTypes): void => {
    setVisiblePasswords(prevState => {
      if (prevState.includes(passwordType)) {
        return prevState.filter((type: PasswordTypes) => type !== passwordType)
      } else {
        return [...prevState, passwordType]
      }
    })
  }

  const handleSubmit = async (values: FormValues): Promise<void> => {
    try {
      const response = await changeUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      /* istanbul ignore next */ switch (response?.data) {
        case ChangePasswordResponse.PASSWORD_CHANGED: {
          showSuccess(getString('userProfile.passwordChangedSuccessfully'), 5000)
          hideModal()
          break
        }
        case ChangePasswordResponse.INCORRECT_CURRENT_PASSWORD: {
          modalErrorHandler?.showDanger(getString('userProfile.yourCurrentPasswordIncorrect'))
          break
        }
        case ChangePasswordResponse.PASSWORD_STRENGTH_VIOLATED: {
          modalErrorHandler?.showDanger(getString('userProfile.newPasswordShouldMeetTheRequirements'))
          break
        }
        default:
          break
      }
    } catch (e) {
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    }
  }

  return (
    <Layout.Vertical padding={{ left: 'huge', right: 'huge' }}>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Text color={Color.GREY_900} font={{ size: 'medium', weight: 'semi-bold' }} margin={{ bottom: 'xxlarge' }}>
        {getString('userProfile.changePassword')}
      </Text>
      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }}
        formName="changePasswordForm"
        validationSchema={yup.object().shape({
          currentPassword: yup
            .string()
            .required(`${getString('userProfile.currentPassword')} ${getString('userProfile.requiredField')}`),
          newPassword: yup
            .string()
            .matches(
              PASSWORD_CHECKS_RGX(passwordStrengthPolicy),
              passwordStrengthPolicy.enabled
                ? getString('userProfile.passwordReqs')
                : getString('userProfile.passwordMustBeBetweenMinAndMax', {
                    min: MIN_NUMBER_OF_CHARACTERS,
                    max: MAX_NUMBER_OF_CHARACTERS
                  })
            )
            .test(
              'passwords-should-not-be-same',
              getString('userProfile.newPasswordShouldNotBeCurrentPassword'),
              function (value) {
                return value ? this.parent.currentPassword !== value : true
              }
            )
            .required(`${getString('userProfile.newPassword')} ${getString('userProfile.requiredField')}`),
          confirmPassword: yup
            .string()
            .test('passwords-match', getString('userProfile.passwordMatch'), function (value) {
              return this.parent.newPassword === value
            })
            .required(`${getString('userProfile.confirmPassword')} ${getString('userProfile.requiredField')}`)
        })}
        onSubmit={values => {
          handleSubmit(values)
        }}
      >
        {({ values }) => (
          <FormikForm>
            <Container width={300}>
              <FormInput.Text
                name="currentPassword"
                label={getString('userProfile.currentPassword')}
                inputGroup={{
                  type: visiblePasswords.includes(PasswordTypes.CURRENT_PASSWORD)
                    ? /* istanbul ignore next */ 'text'
                    : 'password',
                  rightElement: (
                    <InputIcon
                      isVisible={visiblePasswords.includes(PasswordTypes.CURRENT_PASSWORD)}
                      onClick={() => {
                        handlePasswordVisibility(PasswordTypes.CURRENT_PASSWORD)
                      }}
                    />
                  )
                }}
              />
            </Container>
            <Divider className={css.divider} />
            <Layout.Horizontal>
              <Container width={300}>
                <FormInput.Text
                  name="newPassword"
                  label={getString('userProfile.newPassword')}
                  inputGroup={{
                    type: visiblePasswords.includes(PasswordTypes.NEW_PASSWORD) ? 'text' : 'password',
                    rightElement: (
                      <InputIcon
                        isVisible={visiblePasswords.includes(PasswordTypes.NEW_PASSWORD)}
                        onClick={() => {
                          handlePasswordVisibility(PasswordTypes.NEW_PASSWORD)
                        }}
                      />
                    )
                  }}
                />
              </Container>
              {passwordStrengthPolicy.enabled && (
                <Container padding={{ left: 'xxlarge', top: 'large' }}>
                  <PasswordChecklist value={values.newPassword} passwordStrengthPolicy={passwordStrengthPolicy} />
                </Container>
              )}
            </Layout.Horizontal>
            <Container width={300}>
              <FormInput.Text
                name="confirmPassword"
                label={getString('userProfile.confirmPassword')}
                inputGroup={{
                  type: visiblePasswords.includes(PasswordTypes.CONFIRM_PASSWORD) ? 'text' : 'password',
                  rightElement: (
                    <InputIcon
                      isVisible={visiblePasswords.includes(PasswordTypes.CONFIRM_PASSWORD)}
                      onClick={() => {
                        handlePasswordVisibility(PasswordTypes.CONFIRM_PASSWORD)
                      }}
                    />
                  )
                }}
              />
            </Container>
            <Layout.Horizontal margin={{ top: 'xxxlarge', bottom: 'xlarge' }}>
              <Button
                text={getString('userProfile.changePassword')}
                type="submit"
                variation={ButtonVariation.PRIMARY}
                margin={{ right: 'small' }}
                disabled={changingUserPassword}
              />
              <Button text={getString('cancel')} onClick={hideModal} variation={ButtonVariation.TERTIARY} />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default ChangePasswordForm
