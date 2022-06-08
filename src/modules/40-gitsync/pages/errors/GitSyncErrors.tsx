/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { createRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import {
  Button,
  ButtonVariation,
  ExpandingSearchInput,
  ExpandingSearchInputHandle,
  Layout,
  Tab,
  Tabs,
  Text
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useGetGitSyncErrorsCount } from 'services/cd-ng'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { GitSyncErrorsPanel } from '@gitsync/pages/errors/GitSyncErrorsPanel/GitSyncErrorsPanel'
import {
  GitErrorExperienceTab,
  GitSyncErrorStateType,
  GitSyncErrorState,
  GitErrorExperienceSubTab
} from '@gitsync/pages/errors/GitSyncErrorContext'
import styles from '@gitsync/pages/errors/GitSyncErrors.module.scss'

const TabTitle: React.FC<{ title: string; count: number; showCount: boolean }> = props => {
  const { title, count, showCount } = props
  return (
    <Layout.Horizontal>
      <Text className={styles.tabTitle}>{title}</Text>
      {showCount ? (
        <Text color={Color.RED_600} font={{ weight: 'bold' }}>
          {count}
        </Text>
      ) : (
        <></>
      )}
    </Layout.Horizontal>
  )
}

const GitSyncErrors: React.FC = () => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const searchRef = React.useRef<ExpandingSearchInputHandle>()
  const [selectedTab, setSelectedTab] = useState<GitErrorExperienceTab>(GitErrorExperienceTab.ALL_ERRORS)
  const [selectedView, setSelectedView] = useState<GitErrorExperienceSubTab | null>(
    GitErrorExperienceSubTab.ALL_ERRORS_COMMIT_VIEW
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [branch, setBranch] = useState('')
  const [repoIdentifier, setRepoIdentifier] = useState('')
  const reloadAction = createRef<() => void>()

  const contextValue: GitSyncErrorStateType = {
    selectedTab,
    view: selectedView,
    setView: setSelectedView,
    branch,
    repoIdentifier,
    searchTerm,
    reloadAction
  }

  const onTabSwitch = (tabId: GitErrorExperienceTab): void => {
    if (tabId === GitErrorExperienceTab.CONNECTIVITY_ERRORS) {
      setSelectedView(null)
    } else {
      setSelectedView(GitErrorExperienceSubTab.ALL_ERRORS_COMMIT_VIEW)
    }
    setSelectedTab(tabId)
  }

  const setGitFilters = ({ branch: filterBranch, repo: filterRepo }: GitFilterScope): void => {
    setBranch(filterBranch || '')
    setRepoIdentifier(defaultTo(filterRepo, ''))
    setSearchTerm('')
    searchRef.current?.clear()
  }

  const {
    loading: isCountLoading,
    data: countData,
    error: countError,
    refetch
  } = useGetGitSyncErrorsCount({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      searchTerm,
      branch,
      repoIdentifier
    }
  })

  useEffect(() => {
    refetch()
  }, [selectedView, refetch])

  const reload = (): void => {
    refetch()
    reloadAction.current?.()
  }

  const { gitToHarnessErrorCount = 0, connectivityErrorCount = 0 } = countData?.data || {}
  const showCountData = !!(countData?.data && !isCountLoading && !countError)

  return (
    <div className={styles.tabContainer} data-testid="gitSyncErrorsTabContainer">
      <GitSyncErrorState.Provider value={contextValue}>
        <Tabs id="gitSyncErrorsTab" onChange={onTabSwitch}>
          <Layout.Horizontal className={styles.gitSyncErrorsHeaderSides}>
            <GitFilters defaultValue={{ repo: '', branch: '' }} onChange={setGitFilters} />
          </Layout.Horizontal>
          <Tab
            id={GitErrorExperienceTab.ALL_ERRORS}
            panel={<GitSyncErrorsPanel />}
            title={
              <TabTitle
                title={getString('common.allErrors')}
                count={gitToHarnessErrorCount}
                showCount={showCountData}
              />
            }
          />
          <Tab
            id={GitErrorExperienceTab.CONNECTIVITY_ERRORS}
            panel={<GitSyncErrorsPanel />}
            title={
              <TabTitle
                title={getString('common.connectivityErrors')}
                count={connectivityErrorCount}
                showCount={showCountData}
              />
            }
          />
          <Layout.Horizontal className={styles.gitSyncErrorsHeaderSides} flex={{ justifyContent: 'flex-end' }}>
            <ExpandingSearchInput
              alwaysExpanded
              width={250}
              placeholder={getString('search')}
              throttle={200}
              onChange={setSearchTerm}
              className={styles.searchInput}
              ref={searchRef}
            />
            <Button variation={ButtonVariation.TERTIARY} icon="command-rollback" onClick={reload} />
          </Layout.Horizontal>
        </Tabs>
      </GitSyncErrorState.Provider>
    </div>
  )
}

export default GitSyncErrors
