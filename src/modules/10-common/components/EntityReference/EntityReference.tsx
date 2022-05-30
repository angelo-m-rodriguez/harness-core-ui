/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import {
  Container,
  TextInput,
  Button,
  Layout,
  Text,
  Tabs,
  Tab,
  Icon,
  IconName,
  ButtonVariation,
  PageError,
  NoDataCard,
  NoDataCardProps,
  PaginationProps
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { Classes } from '@blueprintjs/core'
import { debounce, isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Scope, PrincipalScope } from '@common/interfaces/SecretsInterface'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { StringKeys } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { AccountPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, StageActions } from '@common/constants/TrackingConstants'
import { CollapsableList } from '../CollapsableList/CollapsableList'
import css from './EntityReference.module.scss'

export interface ScopedObjectDTO {
  accountIdentifier?: string
  orgIdentifier?: string
  projectIdentifier?: string
}

export function getScopeFromDTO<T extends ScopedObjectDTO>(obj: T): Scope {
  if (obj.projectIdentifier) {
    return Scope.PROJECT
  } else if (obj.orgIdentifier) {
    return Scope.ORG
  }
  return Scope.ACCOUNT
}

export function getPrincipalScopeFromDTO<T extends ScopedObjectDTO>(obj: T): PrincipalScope {
  if (obj.projectIdentifier) {
    return PrincipalScope.PROJECT
  } else if (obj.orgIdentifier) {
    return PrincipalScope.ORG
  }
  return PrincipalScope.ACCOUNT
}

export const getScopeBasedProjectPathParams = (
  { accountId, projectIdentifier, orgIdentifier }: ProjectPathProps,
  scope: Scope
) => {
  return {
    accountIdentifier: accountId,
    projectIdentifier: scope === Scope.PROJECT ? projectIdentifier : undefined,
    orgIdentifier: scope === Scope.PROJECT || scope === Scope.ORG ? orgIdentifier : undefined
  }
}

export function getScopeFromValue(value: string): Scope {
  if (typeof value === 'string' && value.startsWith(`${Scope.ACCOUNT}.`)) {
    return Scope.ACCOUNT
  } else if (typeof value === 'string' && value.startsWith(`${Scope.ORG}.`)) {
    return Scope.ORG
  }
  return Scope.PROJECT
}

export function getPrincipalScopeFromValue(value: string): PrincipalScope {
  if (typeof value === 'string' && value.startsWith(`${Scope.ACCOUNT}.`)) {
    return PrincipalScope.ACCOUNT
  } else if (typeof value === 'string' && value.startsWith(`${Scope.ORG}.`)) {
    return PrincipalScope.ORG
  }
  return PrincipalScope.PROJECT
}

export function getScopeLabelfromScope(scope: Scope, getString: UseStringsReturn['getString']): string {
  let label = ''
  switch (scope) {
    case Scope.ACCOUNT:
      label += getString('account')
      break
    case Scope.PROJECT:
      label += getString('projectLabel')
      break
    case Scope.ORG:
      label += getString('orgLabel')
      break
    default:
  }
  return label
}

export function getIdentifierFromValue(value: string): string {
  const scope = getScopeFromValue(value)
  if ((typeof value === 'string' && scope === Scope.ACCOUNT) || scope === Scope.ORG) {
    return value.replace(`${scope}.`, '')
  }
  return value
}

export type EntityReferenceResponse<T> = {
  name: string
  identifier: string
  record: T
}

export interface EntityReferenceProps<T> {
  onSelect: (reference: T, scope: Scope) => void
  fetchRecords: (
    scope: Scope,
    done: (records: EntityReferenceResponse<T>[]) => void,
    searchTerm: string,
    page: number
  ) => void
  recordRender: (args: { item: EntityReferenceResponse<T>; selectedScope: Scope; selected?: boolean }) => JSX.Element
  collapsedRecordRender?: (args: {
    item: EntityReferenceResponse<T>
    selectedScope: Scope
    selected?: boolean
  }) => JSX.Element
  recordClassName?: string
  className?: string
  projectIdentifier?: string
  noRecordsText?: string
  noDataCard?: NoDataCardProps
  orgIdentifier?: string
  defaultScope?: Scope
  searchInlineComponent?: JSX.Element
  onCancel?: () => void
  renderTabSubHeading?: boolean
  pagination: PaginationProps
  disableCollapse?: boolean
  input?: any
}

function getDefaultScope(orgIdentifier?: string, projectIdentifier?: string): Scope {
  if (!isEmpty(projectIdentifier)) {
    return Scope.PROJECT
  } else if (!isEmpty(orgIdentifier)) {
    return Scope.ORG
  }
  return Scope.ACCOUNT
}

const enum TAB_ID {
  PROJECT = 'project',
  ORGANIZATION = 'organization',
  ACCOUNT = 'account'
}

function getDefaultTab(projectIdentifier: string | undefined, orgIdentifier: string | undefined) {
  return projectIdentifier ? TAB_ID.PROJECT : orgIdentifier ? TAB_ID.ORGANIZATION : TAB_ID.ACCOUNT
}

export function EntityReference<T>(props: EntityReferenceProps<T>): JSX.Element {
  const { getString } = useStrings()
  const {
    defaultScope,
    projectIdentifier,
    orgIdentifier,
    fetchRecords,
    className = '',
    recordRender,
    collapsedRecordRender,
    searchInlineComponent,
    noDataCard,
    renderTabSubHeading = false,
    disableCollapse,
    input
  } = props
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedScope, setSelectedScope] = useState<Scope>(
    defaultScope || getDefaultScope(orgIdentifier, projectIdentifier)
  )
  const { accountId } = useParams<AccountPathProps>()
  const {
    selectedProject,
    selectedOrg,
    currentUserInfo: { accounts = [] }
  } = useAppStore()
  const selectedAccount = accounts.find(account => account.uuid === accountId)
  const [data, setData] = useState<EntityReferenceResponse<T>[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>()
  const [selectedRecord, setSelectedRecord] = useState<T>()

  React.useEffect(() => {
    setSelectedScope(getDefaultScope(orgIdentifier, projectIdentifier))
  }, [projectIdentifier, orgIdentifier])

  const delayedFetchRecords = useRef(debounce((fn: () => void) => fn(), 300)).current

  const inputRef = useRef()
  const firstUpdate = useRef(true)

  const fetchData = (resetPageIndex: boolean, inputChange = false) => {
    try {
      setError(null)
      if (!searchTerm && !inputChange) {
        setLoading(true)
        fetchRecords(
          selectedScope,
          records => {
            setData(records)
            setLoading(false)
          },
          searchTerm,
          props.pagination.pageIndex as number
        )
      } else {
        if (resetPageIndex && props.pagination.pageIndex !== 0) {
          props.pagination.gotoPage?.(0)
        }
        const pageNo = resetPageIndex ? 0 : props.pagination.pageIndex
        delayedFetchRecords(() => {
          setLoading(true)
          setSelectedRecord(undefined)
          fetchRecords(
            selectedScope,
            records => {
              setData(records)
              setLoading(false)
            },
            searchTerm,
            pageNo as number
          )
        })
      }
    } catch (msg) {
      setError(msg)
    }
  }

  useEffect(() => {
    if (inputRef.current === input || firstUpdate.current) {
      fetchData(true)
    } else {
      fetchData(true, true)
      inputRef.current = input
    }
  }, [selectedScope, delayedFetchRecords, searchTerm, input])

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false
    } else {
      fetchData(false)
    }
  }, [props.pagination.pageIndex])

  const onScopeChange = (scope: Scope): void => {
    setSelectedRecord(undefined)
    setSelectedScope(scope)
  }

  const iconProps = {
    size: 14
  }

  const defaultTab = getDefaultTab(projectIdentifier, orgIdentifier)

  const RenderList = () => {
    return (
      <Layout.Vertical spacing="large">
        <div className={css.searchBox}>
          <TextInput
            wrapperClassName={css.search}
            placeholder={getString('search')}
            leftIcon="search"
            value={searchTerm}
            autoFocus
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
          {searchInlineComponent}
        </div>
        {loading ? (
          <Container flex={{ align: 'center-center' }} padding="small">
            <Icon name="spinner" size={24} color={Color.PRIMARY_7} />
          </Container>
        ) : error ? (
          <Container>
            <PageError message={error} onClick={() => fetchData(true)} />
          </Container>
        ) : data.length ? (
          <CollapsableList<T>
            selectedRecord={selectedRecord}
            setSelectedRecord={setSelectedRecord}
            data={data}
            recordRender={recordRender}
            collapsedRecordRender={collapsedRecordRender}
            selectedScope={selectedScope}
            pagination={{ ...props.pagination, hidePageNumbers: true }}
            disableCollapse={disableCollapse}
          />
        ) : (
          <Container padding={{ top: 'xlarge' }} flex={{ align: 'center-center' }} className={css.noDataContainer}>
            <NoDataCard {...noDataCard} containerClassName={css.noDataCardImg} />
          </Container>
        )}
      </Layout.Vertical>
    )
  }

  const renderTab = (
    show: boolean,
    id: string,
    scope: Scope,
    icon: IconName,
    title: StringKeys,
    tabDesc = ''
  ): React.ReactElement | null => {
    return show ? (
      <Tab
        className={css.tabClass}
        id={id}
        title={
          <Layout.Horizontal
            onClick={() => onScopeChange(scope)}
            flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
            padding={{ left: 'xsmall', right: 'xsmall' }}
          >
            <Icon name={icon} {...iconProps} className={css.tabIcon} />

            <Text lineClamp={1} font={{ variation: FontVariation.H6, weight: 'light' }}>
              {getString(title)}
            </Text>
            {renderTabSubHeading && tabDesc && (
              <Text
                lineClamp={1}
                font={{ variation: FontVariation.FORM_LABEL, weight: 'light' }}
                padding={{ left: 'xsmall' }}
                className={css.tabValue}
              >
                {`[${tabDesc}]`}
              </Text>
            )}
          </Layout.Horizontal>
        }
        panel={RenderList()}
      />
    ) : null
  }

  const { trackEvent } = useTelemetry()
  useEffect(() => {
    trackEvent(StageActions.LoadCreateOrSelectConnectorView, {
      category: Category.STAGE
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container className={cx(css.container, className)}>
      <div className={css.tabsContainer}>
        <Tabs id={'selectScope'} defaultSelectedTabId={defaultTab}>
          {renderTab(
            !!projectIdentifier,
            TAB_ID.PROJECT,
            Scope.PROJECT,
            'projects-wizard',
            'projectLabel',
            selectedProject?.name
          )}
          {renderTab(!!orgIdentifier, TAB_ID.ORGANIZATION, Scope.ORG, 'diagram-tree', 'orgLabel', selectedOrg?.name)}
          {renderTab(true, TAB_ID.ACCOUNT, Scope.ACCOUNT, 'layers', 'account', selectedAccount?.accountName)}
        </Tabs>
      </div>

      <Layout.Horizontal spacing="medium" padding={{ top: 'medium' }}>
        <Button
          variation={ButtonVariation.PRIMARY}
          text={getString('entityReference.apply')}
          onClick={() => {
            props.onSelect(selectedRecord as T, selectedScope)
            trackEvent(StageActions.ApplySelectedConnector, {
              category: Category.STAGE,
              selectedRecord,
              selectedScope
            })
          }}
          disabled={!selectedRecord}
          className={cx(Classes.POPOVER_DISMISS)}
        />
        {props.onCancel && (
          <Button
            variation={ButtonVariation.TERTIARY}
            text={getString('cancel')}
            onClick={() => {
              props.onCancel?.()
              trackEvent(StageActions.CancelSelectConnector, {
                category: Category.STAGE,
                selectedRecord,
                selectedScope
              })
            }}
          />
        )}
      </Layout.Horizontal>
    </Container>
  )
}

export default EntityReference
