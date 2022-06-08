/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { useFormikContext } from 'formik'
import { Spinner } from '@blueprintjs/core'
import { Button, ButtonVariation, Layout } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { STATUS } from './types'

import css from './TargetManagementFlagConfigurationPanel.module.scss'

export interface FormButtonsProps {
  state: STATUS
}

const FormButtons: FC<FormButtonsProps> = ({ state }) => {
  const { getString } = useStrings()
  const { errors } = useFormikContext()

  return (
    <Layout.Horizontal
      data-testid="listing-buttonbar"
      className={css.footer}
      spacing="small"
      border={{ top: true, color: Color.GREY_100 }}
      padding={{ top: 'medium', bottom: 'medium', left: 'xlarge', right: 'xlarge' }}
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
    >
      <Button
        type="submit"
        text={getString('saveChanges')}
        intent="primary"
        variation={ButtonVariation.PRIMARY}
        disabled={state === STATUS.submitting || 'flags' in errors}
      />
      <Button
        type="reset"
        text={getString('cancel')}
        variation={ButtonVariation.TERTIARY}
        disabled={state === STATUS.submitting}
      />
      {state === STATUS.submitting && (
        <span data-testid="saving-spinner">
          <Spinner size={16} />
        </span>
      )}
    </Layout.Horizontal>
  )
}

export default FormButtons
