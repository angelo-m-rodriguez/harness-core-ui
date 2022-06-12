/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import cx from 'classnames'
import { Layout, Container, ExpandingSearchInput, PageHeader, PageBody } from '@wings-software/uicore'
import {
  ResponsePageEntitySetupUsageDTO,
  ListReferredByEntitiesQueryParams,
  useListAllEntityUsageByFqn
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { UseGetMockData } from '@common/utils/testUtils'
import EntityUsageList from './views/EntityUsageListView/EntityUsageList'
import css from './EntityUsage.module.scss'

interface EntityUsageProps {
  entityIdentifier: string
  entityType: ListReferredByEntitiesQueryParams['referredEntityType']
  mockData?: UseGetMockData<ResponsePageEntitySetupUsageDTO>
  pageSize?: number
  pageHeaderClassName?: string
  pageBodyClassName?: string
}

const DEFAULT_PAGE_SIZE = 10

interface Params {
  accountId: string
  orgIdentifier?: string
  projectIdentifier?: string
  entityIdentifier: string
}

const getReferredEntityFQN = (params: Params) => {
  const { accountId, orgIdentifier, projectIdentifier, entityIdentifier } = params
  let referredEntityFQN = `${accountId}/`
  if (orgIdentifier) {
    referredEntityFQN += `${orgIdentifier}/`
  }
  if (projectIdentifier) {
    referredEntityFQN += `${projectIdentifier}/`
  }
  referredEntityFQN += `${entityIdentifier}`

  return referredEntityFQN
}

const EntityUsage: React.FC<EntityUsageProps> = props => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [page, setPage] = useState(0)
  const { entityIdentifier, entityType, mockData, pageSize, pageHeaderClassName, pageBodyClassName } = props

  const { data, loading, refetch, error } = useListAllEntityUsageByFqn({
    queryParams: {
      accountIdentifier: accountId,
      referredEntityFQN: getReferredEntityFQN({ accountId, orgIdentifier, projectIdentifier, entityIdentifier }),
      referredEntityType: entityType,
      searchTerm: searchTerm,
      pageIndex: page,
      pageSize: pageSize || DEFAULT_PAGE_SIZE
    },
    debounce: 300,
    mock: mockData
  })

  return (
    <>
      <PageHeader
        className={cx(css.secondHeader, defaultTo(pageHeaderClassName, ''))}
        size="standard"
        title={undefined}
        toolbar={
          <Container>
            <Layout.Horizontal>
              <ExpandingSearchInput
                alwaysExpanded
                onChange={text => {
                  setPage(0)
                  setSearchTerm(text.trim())
                }}
                className={css.search}
                width={350}
              />
            </Layout.Horizontal>
          </Container>
        }
      />
      <PageBody
        loading={loading}
        retryOnError={() => refetch()}
        className={pageBodyClassName}
        error={(error?.data as Error)?.message || error?.message}
        noData={
          !searchTerm
            ? {
                when: () => !data?.data?.content?.length,
                icon: 'nav-project',
                message: getString('common.noRefData')
              }
            : {
                when: () => !data?.data?.content?.length,
                icon: 'nav-project',
                message: getString('entityReference.noRecordFound')
              }
        }
      >
        <EntityUsageList entityData={data} gotoPage={pageNumber => setPage(pageNumber)} />
      </PageBody>
    </>
  )
}

export default EntityUsage
