/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { pick, get, isPlainObject } from 'lodash-es'
import { connect, FormikContextType } from 'formik'
import { FormGroup, Intent } from '@blueprintjs/core'
import {
  HarnessDocTooltip,
  Container,
  Icon,
  Text,
  FormikTooltipContext,
  DataTooltipInterface
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ResponsePageSecretResponseWrapper, ConnectorInfoDTO } from 'services/cd-ng'
import useCreateOrSelectSecretModal from '@secrets/modals/CreateOrSelectSecretModal/useCreateOrSelectSecretModal'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import useCreateSSHCredModal from '@secrets/modals/CreateSSHCredModal/useCreateSSHCredModal'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { getReference } from '@common/utils/utils'
import css from '../SecretInput/SecretInput.module.scss'

export interface SSHSecretInputProps {
  name: string
  label?: string
  placeholder?: string
  onSuccess?: (secret: SecretReference) => void
  secretsListMockData?: ResponsePageSecretResponseWrapper
  /**
   * Used when opening Create/Select/Update Secret modal from the Create Connector modal context
   * to be added as a source_category query param to get a filtered list of secrets/connectors from the BE
   */
  connectorTypeContext?: ConnectorInfoDTO['type']
  allowSelection?: boolean
  tooltipProps?: DataTooltipInterface
}

interface FormikSSHSecretInput extends SSHSecretInputProps {
  formik: FormikContextType<any>
}

const SSHSecretInput: React.FC<FormikSSHSecretInput> = ({
  name,
  label,
  placeholder,
  onSuccess,
  secretsListMockData,
  connectorTypeContext,
  allowSelection = true,
  tooltipProps,
  formik
}) => {
  const { getString } = useStrings()
  const secretReference = formik.values[name]
  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const { openCreateSSHCredModal } = useCreateSSHCredModal({
    onSuccess: data => {
      const secret = {
        ...pick(data, ['name', 'identifier', 'orgIdentifier', 'projectIdentifier', 'type']),
        referenceString: getReference(getScopeFromDTO(data), data.identifier) as string
      }
      formik.setFieldValue(name, secret)
      /* istanbul ignore next */
      onSuccess?.(secret)
    }
  })

  const { openCreateOrSelectSecretModal } = useCreateOrSelectSecretModal(
    {
      type: 'SSHKey',
      onSuccess: secret => {
        formik.setFieldValue(name, secret)
        /* istanbul ignore next */
        onSuccess?.(secret)
      },
      secretsListMockData,
      connectorTypeContext: connectorTypeContext,
      handleInlineSSHSecretCreation: () => openCreateSSHCredModal()
    },
    [name, onSuccess]
  )

  const errorCheck = (): boolean =>
    ((get(formik?.touched, name) || (formik?.submitCount && formik?.submitCount > 0)) &&
      get(formik?.errors, name) &&
      !isPlainObject(get(formik?.errors, name))) as boolean

  return (
    <FormGroup
      helperText={errorCheck() ? get(formik?.errors, name) : null}
      intent={errorCheck() ? Intent.DANGER : Intent.NONE}
    >
      {label ? (
        <label className="bp3-label">
          <HarnessDocTooltip tooltipId={dataTooltipId} labelText={label} />
        </label>
      ) : null}
      <Container flex={{ alignItems: 'center', justifyContent: 'space-between' }} className={css.container}>
        <Link
          to="#"
          className={css.containerLink}
          data-testid={name}
          onClick={e => {
            e.preventDefault()
            if (allowSelection) {
              openCreateOrSelectSecretModal()
            }
          }}
        >
          <Icon size={24} height={12} name={'key-main'} />
          <Text
            color={Color.PRIMARY_7}
            flex={{ alignItems: 'center', justifyContent: 'flex-start', inline: false }}
            padding="small"
            className={css.containerLinkText}
          >
            <div>
              {secretReference
                ? getString('secrets.secret.configureSecret')
                : placeholder || getString('createOrSelectSecret')}
            </div>
            {secretReference ? <div>{`<${secretReference['name']}>`}</div> : null}
          </Text>
        </Link>
      </Container>
    </FormGroup>
  )
}

export default connect<Omit<FormikSSHSecretInput, 'formik'>>(SSHSecretInput)
