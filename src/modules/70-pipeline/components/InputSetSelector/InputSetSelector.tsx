/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Layout,
  Popover,
  Button,
  Text,
  TextInput,
  ButtonVariation,
  PageSpinner,
  Container
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { clone, defaultTo, isEmpty } from 'lodash-es'
import cx from 'classnames'
import { Classes, Position } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import {
  EntityGitDetails,
  InputSetErrorWrapper,
  InputSetSummaryResponse,
  useGetInputSetsListForPipeline
} from 'services/pipeline-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useToaster } from '@common/exports'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { useStrings } from 'framework/strings'
import type { InputSetValue } from './utils'
import { MultipleInputSetList } from './MultipleInputSetList'
import { RenderValue } from './RenderValue'
import SelectedMultipleList from './SelectedMultipleList'
import css from './InputSetSelector.module.scss'

export interface InputSetSelectorProps {
  value?: InputSetValue[]
  pipelineIdentifier: string
  onChange?: (value?: InputSetValue[]) => void
  width?: number
  selectedValueClass?: string
  selectedRepo?: string
  selectedBranch?: string
  isOverlayInputSet?: boolean
}

export function InputSetSelector({
  value,
  onChange,
  pipelineIdentifier,
  selectedValueClass,
  selectedRepo,
  selectedBranch,
  isOverlayInputSet
}: InputSetSelectorProps): React.ReactElement {
  const [searchParam, setSearchParam] = React.useState('')
  const [selectedInputSets, setSelectedInputSets] = React.useState<InputSetValue[]>(value || [])
  const { getString } = useStrings()

  const { projectIdentifier, orgIdentifier, accountId } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  useEffect(() => setSelectedInputSets(defaultTo(value, [])), [value])

  const getGitQueryParams = React.useCallback(() => {
    if (!isEmpty(selectedRepo) && !isEmpty(selectedBranch)) {
      return {
        repoIdentifier: selectedRepo,
        branch: selectedBranch
      }
    }
    if (!isEmpty(repoIdentifier) && !isEmpty(branch)) {
      return {
        repoIdentifier,
        branch,
        getDefaultFromOtherRepo: true
      }
    }
    return {}
  }, [repoIdentifier, branch, selectedRepo, selectedBranch])

  const {
    data: inputSetResponse,
    refetch,
    error
  } = useGetInputSetsListForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      inputSetType: isOverlayInputSet ? 'INPUT_SET' : undefined,
      ...getGitQueryParams()
    },
    debounce: 300,
    lazy: true
  })

  React.useEffect(() => {
    refetch()
  }, [repoIdentifier, branch, selectedRepo, selectedBranch, refetch])

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const onCheckBoxHandler = React.useCallback(
    (
      checked: boolean,
      label: string,
      val: string,
      type: InputSetSummaryResponse['inputSetType'],
      inputSetGitDetails: EntityGitDetails | null,
      inputSetErrorDetails?: InputSetErrorWrapper,
      overlaySetErrorDetails?: { [key: string]: string }
    ) => {
      const selected = clone(selectedInputSets)
      const removedItem = selected.filter(set => set.value === val)[0]
      if (checked && !removedItem) {
        selected.push({
          label,
          value: val,
          type,
          gitDetails: defaultTo(inputSetGitDetails, {}),
          inputSetErrorDetails,
          overlaySetErrorDetails
        })
      } else if (removedItem) {
        selected.splice(selected.indexOf(removedItem), 1)
      }
      setSelectedInputSets(selected)
    },
    [selectedInputSets]
  )

  if (error) {
    showError(getRBACErrorMessage(error), undefined, 'pipeline.get.inputsetlist')
  }

  const inputSets = inputSetResponse?.data?.content

  const multipleInputSetList =
    inputSets &&
    inputSets
      .filter(set => {
        let filter = true
        selectedInputSets.forEach(selectedSet => {
          if (selectedSet.value === set.identifier) {
            filter = false
          }
        })
        return filter
      })
      .filter(set => defaultTo(set.identifier, '').toLowerCase().indexOf(searchParam.toLowerCase()) > -1)
      .map(inputSet => (
        <MultipleInputSetList key={inputSet.identifier} inputSet={inputSet} onCheckBoxHandler={onCheckBoxHandler} />
      ))

  const [openInputSetsList, setOpenInputSetsList] = useState(false)

  return (
    <Popover
      position={Position.BOTTOM}
      usePortal={false}
      isOpen={openInputSetsList}
      minimal={true}
      className={css.isPopoverParent}
      onOpening={() => {
        refetch()
        setOpenInputSetsList(true)
      }}
      onInteraction={interaction => {
        if (!interaction) {
          setOpenInputSetsList(false)
        }
      }}
      onClosing={() => {
        setOpenInputSetsList(false)
        onChange?.(selectedInputSets)
      }}
    >
      <RenderValue
        value={defaultTo(value, [])}
        onChange={onChange}
        setSelectedInputSets={setSelectedInputSets}
        setOpenInputSetsList={setOpenInputSetsList}
        selectedValueClass={selectedValueClass}
      />
      {openInputSetsList ? (
        <Layout.Vertical spacing="small" className={css.popoverContainer}>
          <div className={!inputSets ? css.loadingSearchContainer : css.searchContainer}>
            <TextInput
              placeholder={getString('search')}
              rightElement="chevron-down"
              className={css.search}
              value={searchParam}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchParam(e.target.value.trim())
              }}
            />
          </div>
          <Container className={css.overlayIsHelperTextContainer} border={{ bottom: true }}>
            <Text className={css.overlayIsHelperText}>{getString('pipeline.inputSets.overlayISHelperText')}</Text>
          </Container>
          {!inputSets ? (
            <PageSpinner className={css.spinner} />
          ) : (
            <Layout.Vertical padding={{ bottom: 'medium' }}>
              {inputSets && inputSets.length > 0 ? (
                <>
                  <ul className={cx(Classes.MENU, css.list, { [css.multiple]: inputSets.length > 0 })}>
                    <>
                      <SelectedMultipleList
                        selectedInputSets={selectedInputSets}
                        onCheckBoxHandler={onCheckBoxHandler}
                        setSelectedInputSets={setSelectedInputSets}
                      />
                      {multipleInputSetList}
                    </>
                  </ul>
                  <Button
                    margin="small"
                    text={
                      selectedInputSets?.length > 1
                        ? getString('pipeline.inputSets.applyInputSets')
                        : getString('pipeline.inputSets.applyInputSet')
                    }
                    variation={ButtonVariation.PRIMARY}
                    disabled={!selectedInputSets?.length}
                    onClick={() => {
                      setOpenInputSetsList(false)
                      onChange?.(selectedInputSets)
                    }}
                  />
                </>
              ) : (
                <Layout.Horizontal
                  spacing="small"
                  background={Color.GREY_200}
                  flex={{ align: 'center-center' }}
                  padding="small"
                  margin="small"
                >
                  <Text>{getString('inputSets.noRecord')}</Text>
                </Layout.Horizontal>
              )}
            </Layout.Vertical>
          )}
        </Layout.Vertical>
      ) : null}
    </Popover>
  )
}
