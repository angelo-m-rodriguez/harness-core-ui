/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput, Layout, Text, SelectOption, DropDown } from '@wings-software/uicore'
import type { IOptionProps } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import type { SSHConfigFormData } from '@secrets/modals/CreateSSHCredModal/views/StepAuthentication'

interface SSHAuthFormFieldsProps {
  formik: FormikProps<SSHConfigFormData>
  secretName?: string
  editing?: boolean
}

const SSHAuthFormFields: React.FC<SSHAuthFormFieldsProps> = props => {
  const { getString } = useStrings()
  const { formik } = props
  const credentialTypeOptions: SelectOption[] = [
    {
      label: getString('secrets.sshAuthFormFields.optionKey'),
      value: 'KeyReference'
    },
    {
      label: getString('secrets.sshAuthFormFields.optionKeypath'),
      value: 'KeyPath'
    },
    {
      label: getString('secrets.sshAuthFormFields.optionPassword'),
      value: 'Password'
    }
  ]

  const authSchemeOptions: IOptionProps[] = [
    {
      label: getString('SSH_KEY'),
      value: 'SSH'
    },
    {
      label: getString('kerberos'),
      value: 'Kerberos'
    }
  ]

  const tgtGenerationMethodOptions: IOptionProps[] = [
    {
      label: getString('secrets.sshAuthFormFields.labelKeyTab'),
      value: 'KeyTabFilePath'
    },
    {
      label: getString('password'),
      value: 'Password'
    },
    {
      label: getString('secrets.sshAuthFormFields.optionKerbNone'),
      value: 'None'
    }
  ]

  return (
    <>
      <FormInput.RadioGroup
        name="authScheme"
        label={getString('secrets.sshAuthFormFields.labelType')}
        items={authSchemeOptions}
        radioGroup={{ inline: true }}
      />
      {formik.values.authScheme === 'SSH' ? (
        <>
          <Layout.Horizontal margin={{ bottom: 'medium' }} flex>
            <Text icon="lock" style={{ flex: 1 }}>
              {getString('authentication')}
            </Text>
            <DropDown
              items={credentialTypeOptions}
              value={formik.values.credentialType}
              isLabel={true}
              filterable={false}
              minWidth="unset"
              onChange={item => {
                formik.setFieldValue('credentialType', item.value)
              }}
            />
          </Layout.Horizontal>
          <FormInput.Text name="userName" label={getString('username')} />
          {formik.values.credentialType === 'KeyReference' ? (
            <>
              <SecretInput
                name="key"
                label={getString('secrets.sshAuthFormFields.labelFile')}
                isMultiTypeSelect={true}
              />
              <SecretInput
                name={'encryptedPassphrase'}
                label={getString('secrets.sshAuthFormFields.labelPassphrase')}
              />
            </>
          ) : null}
          {formik.values.credentialType === 'KeyPath' ? (
            <>
              <FormInput.Text name="keyPath" label={getString('secrets.sshAuthFormFields.labelKeyFilePath')} />
              <SecretInput
                name={'encryptedPassphrase'}
                label={getString('secrets.sshAuthFormFields.labelPassphrase')}
              />
            </>
          ) : null}
          {formik.values.credentialType === 'Password' ? (
            <SecretInput name={'password'} label={getString('password')} />
          ) : null}
          <FormInput.Text name="port" label={getString('secrets.sshAuthFormFields.labelSSHPort')} />
        </>
      ) : null}
      {formik.values.authScheme === 'Kerberos' ? (
        <>
          <FormInput.Text name="principal" label={getString('secrets.sshAuthFormFields.labelPrincipal')} />
          <FormInput.Text name="realm" label={getString('secrets.sshAuthFormFields.labelRealm')} />
          <FormInput.Text name="port" label={getString('secrets.sshAuthFormFields.labelSSHPort')} />
          <FormInput.RadioGroup
            name="tgtGenerationMethod"
            label={getString('secrets.sshAuthFormFields.labelTGT')}
            items={tgtGenerationMethodOptions}
            radioGroup={{ inline: true }}
          />
          {formik.values.tgtGenerationMethod === 'KeyTabFilePath' ? (
            <FormInput.Text name="keyPath" label={getString('secrets.sshAuthFormFields.labelKeyTab')} />
          ) : null}
          {formik.values.tgtGenerationMethod === 'Password' ? (
            <SecretInput name={'password'} label={getString('password')} />
          ) : null}
        </>
      ) : null}
    </>
  )
}

export default SSHAuthFormFields
