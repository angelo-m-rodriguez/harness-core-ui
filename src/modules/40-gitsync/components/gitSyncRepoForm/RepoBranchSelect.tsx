/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  FormInput,
  getErrorInfoFromErrorObject,
  Icon,
  Layout,
  ModalErrorHandlerBinding,
  SelectOption,
  Text,
  useToggleOpen
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { defaultTo, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { Error, useGetListOfBranchesByConnector } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import css from './GitSyncRepoForm.module.scss'

export interface RepoBranchSelectProps {
  modalErrorHandler?: ModalErrorHandlerBinding
  connectorIdentifierRef?: string
  repoURL?: string
  selectedValue?: string
  onChange?: (selected: SelectOption, options?: SelectOption[]) => void
}

const getBranchSelectOptions = (data: string[] = []) => {
  return data.map((branch: string) => {
    return {
      label: defaultTo(branch, ''),
      value: defaultTo(branch, '')
    }
  })
}

const RepoBranchSelect: React.FC<RepoBranchSelectProps> = props => {
  const { modalErrorHandler, connectorIdentifierRef, repoURL, selectedValue } = props
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [branchSelectOptions, setBranchSelectOptions] = useState<SelectOption[]>([])

  const {
    data: response,
    error,
    loading,
    refetch
  } = useGetListOfBranchesByConnector({
    queryParams: {
      connectorIdentifierRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoURL
    },
    debounce: 500,
    lazy: true
  })

  const { isOpen, open, close } = useToggleOpen()

  useEffect(() => {
    if (connectorIdentifierRef && repoURL) {
      refetch()
    } else {
      setBranchSelectOptions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectorIdentifierRef, repoURL])

  const handleError = (errorMessage: string): void => {
    modalErrorHandler?.showDanger(errorMessage)
  }

  useEffect(() => {
    if (loading) {
      return
    }
    modalErrorHandler?.hide()

    if (error) {
      if ((error?.data as Error)?.responseMessages?.length) {
        open()
      } else {
        handleError(getErrorInfoFromErrorObject(error))
      }
      return
    }

    if (response?.status !== 'SUCCESS') {
      response && handleError(getErrorInfoFromErrorObject(response))
    } else {
      if (!isEmpty(response?.data)) {
        setBranchSelectOptions(getBranchSelectOptions(response.data))
      } else {
        modalErrorHandler?.showDanger(getString('common.git.noBranchesFound'))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const responseMessages = (error?.data as Error)?.responseMessages
  return (
    <Layout.Horizontal>
      <FormInput.Select
        name="branch"
        disabled={loading}
        items={branchSelectOptions}
        label={getString('gitsync.selectDefaultBranch')}
        value={{ label: selectedValue || '', value: selectedValue || '' }}
        onChange={selected => props.onChange?.(selected, branchSelectOptions)}
        selectProps={{ usePortal: true, popoverClassName: css.gitBranchSelectorPopover }}
      />
      {loading ? (
        <Layout.Horizontal spacing="small" flex padding={{ top: 'xsmall', left: 'xsmall' }}>
          <Icon name="steps-spinner" size={18} color={Color.PRIMARY_7} />
          <Text>{getString('common.fetchingBranches').concat('...')}</Text>
        </Layout.Horizontal>
      ) : null}
      <Dialog
        isOpen={isOpen}
        enforceFocus={false}
        title={getString('common.gitSync.branchFetchFailed')}
        onClose={close}
      >
        {responseMessages ? <ErrorHandler responseMessages={responseMessages} /> : undefined}
      </Dialog>
    </Layout.Horizontal>
  )
}
export default RepoBranchSelect
