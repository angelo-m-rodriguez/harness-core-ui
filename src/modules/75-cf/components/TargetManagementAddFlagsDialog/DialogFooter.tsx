/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useMemo } from 'react'
import { useFormikContext } from 'formik'
import { Button, ButtonVariation, Layout, Pagination } from '@harness/uicore'
import { Spinner } from '@blueprintjs/core'
import type { Features } from 'services/cf'
import { useStrings } from 'framework/strings'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '../TargetManagementFlagConfigurationPanel/types'
import { STATUS } from './types'

import css from './TargetManagementAddFlagsDialog.module.scss'

export interface DialogFooterProps {
  flags: Features
  state: STATUS
  setPageNumber: (pageNumber: number) => void
  onCancel: () => void
}

const DialogFooter: FC<DialogFooterProps> = ({ flags, state, setPageNumber, onCancel }) => {
  const { errors, values, submitForm } = useFormikContext<FormValues>()
  const { getString } = useStrings()

  const flagCount = useMemo<number>(() => Object.values(values.flags).filter(({ added }) => added).length, [values])
  const displayPagination = useMemo(
    () => [STATUS.ok, STATUS.loading, STATUS.submitting].includes(state) && flags && flags.pageCount > flags.pageIndex,
    [flags, state]
  )

  return (
    <>
      {displayPagination && flags && (
        <Pagination
          className={css.pagination}
          pageSize={flags.pageSize}
          pageCount={flags.pageCount}
          itemCount={flags.itemCount}
          pageIndex={flags.pageIndex}
          gotoPage={setPageNumber}
          hidePageNumbers={true}
        />
      )}
      <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <Button
          type="submit"
          text={getString('cf.targetManagementFlagConfiguration.addFlags', { flagCount })}
          intent="primary"
          variation={ButtonVariation.PRIMARY}
          disabled={state === STATUS.submitting || 'flags' in errors || !flagCount}
          onClick={() => {
            submitForm()
          }}
        />
        <Button variation={ButtonVariation.TERTIARY} text={getString('cancel')} onClick={() => onCancel()} />
        {state === STATUS.submitting && (
          <span data-testid="saving-spinner">
            <Spinner size={24} />
          </span>
        )}
      </Layout.Horizontal>
    </>
  )
}

export default DialogFooter
