/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import type { FormikContextType } from 'formik'
import { defaultTo, isEmpty } from 'lodash-es'
import { FormInput, Icon, Layout, SelectOption } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { Error, GitRepositoryResponseDTO, ResponseMessage, useGetListOfReposByRefConnector } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import css from '../RepoBranchSelectV2/RepoBranchSelectV2.module.scss'

export interface RepositorySelectProps<T> {
  formikProps?: FormikContextType<T>
  connectorRef?: string
  selectedValue?: string
  onChange?: (selected: SelectOption, options?: SelectOption[]) => void
  formik?: any
  disabled?: boolean
  setErrorResponse?: React.Dispatch<React.SetStateAction<ResponseMessage[]>>
}

const getRepoSelectOptions = (data: GitRepositoryResponseDTO[] = []) => {
  return data.map((repo: GitRepositoryResponseDTO) => {
    return {
      label: defaultTo(repo.name, ''),
      value: defaultTo(repo.name, '')
    }
  })
}

const RepositorySelect: React.FC<RepositorySelectProps<any>> = props => {
  const { connectorRef, selectedValue, formikProps, disabled, setErrorResponse } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [repoSelectOptions, setRepoSelectOptions] = useState<SelectOption[]>([])
  const { getString } = useStrings()

  const {
    data: response,
    error,
    loading,
    refetch
  } = useGetListOfReposByRefConnector({
    queryParams: {
      connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      page: 0,
      size: 100
    },
    lazy: true
  })

  const responseMessages = (error?.data as Error)?.responseMessages

  useEffect(() => {
    if (!disabled) {
      setRepoSelectOptions([])
      if (connectorRef) {
        refetch()
      }
    }
  }, [connectorRef, disabled, refetch])

  useEffect(() => {
    if (loading || disabled) {
      return
    }

    if (response?.status === 'SUCCESS') {
      if (!isEmpty(response?.data)) {
        const selectOptions = getRepoSelectOptions(response?.data)
        setRepoSelectOptions(selectOptions)
        if (selectOptions.length === 1 && isEmpty(formikProps?.values.repo)) {
          formikProps?.setFieldValue('repo', selectOptions[0].value)
          props.onChange?.(selectOptions[0], repoSelectOptions)
        }
      }
    }

    if (responseMessages) {
      setErrorResponse?.(responseMessages)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <Layout.Horizontal>
      <FormInput.Select
        name="repo"
        label={getString('repository')}
        placeholder={loading ? getString('loading') : getString('select')}
        disabled={loading || disabled}
        items={repoSelectOptions}
        value={{ label: defaultTo(selectedValue, ''), value: defaultTo(selectedValue, '') }}
        onChange={(selected: SelectOption, event: React.SyntheticEvent<HTMLElement, Event> | undefined) => {
          props.onChange?.(selected, repoSelectOptions)
          event?.stopPropagation()
        }}
        selectProps={{ usePortal: true, popoverClassName: css.gitBranchSelectorPopover, allowCreatingNewItems: true }}
      />
      {loading ? (
        <Layout.Horizontal spacing="small" flex={{ alignItems: 'flex-start' }} className={css.loadingWrapper}>
          <Icon name="steps-spinner" size={18} color={Color.PRIMARY_7} />
        </Layout.Horizontal>
      ) : responseMessages?.length || !!error ? (
        <Layout.Horizontal spacing="small" flex={{ alignItems: 'flex-start' }} className={css.refreshButtonWrapper}>
          <Icon
            name="refresh"
            size={16}
            color={Color.PRIMARY_7}
            background={Color.PRIMARY_1}
            padding="small"
            className={css.refreshIcon}
            onClick={() => {
              setErrorResponse?.([])
              setRepoSelectOptions([])
              connectorRef && refetch()
            }}
          />
        </Layout.Horizontal>
      ) : null}
    </Layout.Horizontal>
  )
}
export default RepositorySelect
