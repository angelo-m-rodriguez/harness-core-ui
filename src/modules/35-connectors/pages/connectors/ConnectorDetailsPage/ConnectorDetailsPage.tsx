/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo } from 'react'
import { Layout, Container, Icon, Text, SelectOption, PageSpinner, PageError } from '@wings-software/uicore'
import { Tag } from '@blueprintjs/core'
import cx from 'classnames'
import { useParams, useHistory } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { Page } from '@common/exports'
import {
  useGetConnector,
  ConnectorResponse,
  EntityGitDetails,
  useGetListOfBranchesWithStatus,
  GitBranchDTO,
  ResponseConnectorResponse
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ProjectPathProps, ConnectorPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import routes from '@common/RouteDefinitions'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import ScopedTitle from '@common/components/Title/ScopedTitle'
import { getIconByType } from '../utils/ConnectorUtils'
import ConnectorPageGitDetails from './ConnectorDetailsPageGitDetails/ConnectorPageGitDetails'
import RenderConnectorDetailsActiveTab from '../views/RenderConnectorDetailsActiveTab/RenderConnectorDetailsActiveTab'
import { ConnectorDetailsView } from '../utils/ConnectorHelper'
import css from './ConnectorDetailsPage.module.scss'

interface MockData {
  data: ResponseConnectorResponse
}

interface ConnectorDetailsPageProps {
  mockData?: MockData
}

interface ConnectorDetailsQueryParams extends EntityGitDetails {
  view: ConnectorDetailsView
}

const ConnectorDetailsPage: React.FC<ConnectorDetailsPageProps> = props => {
  const { getString } = useStrings()
  const [data, setData] = React.useState<ConnectorResponse>({})
  const [activeCategory, setActiveCategory] = React.useState(ConnectorDetailsView.overview)
  const [selectedBranch, setSelectedBranch] = React.useState<string>('')
  const [branchSelectOptions, setBranchSelectOptions] = React.useState<SelectOption[]>([])
  const [searchTerm, setSearchTerm] = React.useState<string>('')
  const { connectorId, accountId, orgIdentifier, projectIdentifier, module } =
    useParams<PipelineType<ProjectPathProps & ConnectorPathProps>>()
  const { repoIdentifier, branch, view } = useQueryParams<ConnectorDetailsQueryParams>()
  const history = useHistory()

  const defaultQueryParam = {
    accountIdentifier: accountId,
    orgIdentifier: orgIdentifier as string,
    projectIdentifier: projectIdentifier as string
  }

  const viewToLabelMap: Record<ConnectorDetailsView, string> = {
    [ConnectorDetailsView.overview]: getString('overview'),
    [ConnectorDetailsView.referencedBy]: getString('referencedBy'),
    [ConnectorDetailsView.activityHistory]: getString('activityHistoryLabel')
  }

  const {
    loading,
    data: connectorData,
    refetch,
    error
  } = useGetConnector({
    identifier: connectorId as string,
    queryParams: { ...defaultQueryParam, repoIdentifier, branch },
    mock: props.mockData
  })

  const connectorName = data?.connector?.name
  const gitDetails = data?.gitDetails

  useEffect(() => {
    if (!loading && connectorData?.data) {
      setData(connectorData.data)
      setSelectedBranch(connectorData?.data?.gitDetails?.branch as string)
    }
  }, [connectorData, loading])

  useEffect(() => {
    if (view) {
      setActiveCategory(view)
    }
  }, [view])

  const {
    data: branchList,
    loading: loadingBranchList,
    refetch: getListOfBranchesWithStatus
  } = useGetListOfBranchesWithStatus({
    lazy: true,
    debounce: 500
  })

  useEffect(() => {
    const repoId = connectorData?.data?.gitDetails?.repoIdentifier || data?.gitDetails?.repoIdentifier
    if (repoId) {
      getListOfBranchesWithStatus({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          yamlGitConfigIdentifier: repoId,
          page: 0,
          size: 10,
          searchTerm
        }
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchTerm])

  useEffect(() => {
    if (!loadingBranchList) {
      setBranchSelectOptions(
        branchList?.data?.branches?.content?.map((item: GitBranchDTO) => {
          return {
            label: item.branchName ?? '',
            value: item.branchName ?? ''
          }
        }) || []
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingBranchList])

  useDocumentTitle([connectorName || connectorData?.data?.connector?.name || '', getString('connectorsLabel')])

  const RenderBreadCrumb: React.FC = () => {
    const breadCrumbs = [
      {
        url: routes.toConnectors({ accountId, orgIdentifier, projectIdentifier, module }),
        label: getString('connectorsLabel')
      }
    ]

    if (getScopeFromDTO({ accountId, orgIdentifier, projectIdentifier }) === Scope.ACCOUNT) {
      breadCrumbs.unshift({
        url: routes.toAccountResources({ accountId }),
        label: getString('common.accountResources')
      })
    }

    return <NGBreadcrumbs links={breadCrumbs} />
  }

  const handleBranchClick = (selected: string): void => {
    if (selected !== selectedBranch) {
      //Avoid any state change or API call if current branh is selected again
      setSelectedBranch(selected)
      refetch({
        queryParams:
          repoIdentifier && selected ? { ...defaultQueryParam, repoIdentifier, branch: selected } : defaultQueryParam
      })
    }
  }

  const renderTitle = useMemo(
    () => (
      <Layout.Vertical>
        {RenderBreadCrumb(props)}
        <Layout.Horizontal spacing="small">
          <Icon
            margin={{ right: 'xsmall' }}
            name={getIconByType(connectorData?.data?.connector?.type || data?.connector?.type)}
            size={35}
          ></Icon>
          <Container>
            <ScopedTitle
              title={{
                [Scope.PROJECT]: `${getString('connectorsLabel')}: ${
                  connectorData?.data?.connector?.name || connectorName || ''
                }`,
                [Scope.ORG]: getString('connectors.connectorsTitle'),
                [Scope.ACCOUNT]: getString('connectors.connectorsTitle')
              }}
            />
            <Layout.Horizontal spacing="small">
              <Text color={Color.GREY_400}>
                {connectorData?.data?.connector?.identifier || data?.connector?.identifier}
              </Text>
              {activeCategory === ConnectorDetailsView.overview && gitDetails?.objectId ? (
                <ConnectorPageGitDetails
                  handleBranchClick={handleBranchClick}
                  gitDetails={gitDetails}
                  selectedBranch={selectedBranch}
                  branchSelectOptions={branchSelectOptions}
                  loadingBranchList={loadingBranchList}
                  onQueryChange={(query: string) => {
                    setSearchTerm(query)
                  }}
                />
              ) : null}
            </Layout.Horizontal>
          </Container>
        </Layout.Horizontal>
      </Layout.Vertical>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectorData, branchSelectOptions, activeCategory, selectedBranch, loadingBranchList]
  )

  const refetchhandler = (): Promise<void> =>
    refetch({
      queryParams: selectedBranch
        ? {
            ...defaultQueryParam,
            repoIdentifier: connectorData?.data?.gitDetails?.repoIdentifier,
            branch: selectedBranch
          }
        : defaultQueryParam
    })

  const getPageBody = (): React.ReactElement => {
    if (loading) {
      return <PageSpinner />
    }
    if (error) {
      const errorMessage = (error.data as Error)?.message || error.message
      return <PageError message={errorMessage} onClick={refetchhandler} />
    }
    return <RenderConnectorDetailsActiveTab activeCategory={activeCategory} data={data} refetch={refetchhandler} />
  }

  return (
    <>
      <Page.Header
        size="large"
        className={css.header}
        title={renderTitle}
        toolbar={
          <Container>
            <Layout.Horizontal spacing="medium">
              {Object.keys(viewToLabelMap).map((item, index) => {
                return (
                  <Tag
                    className={cx(css.tags, css.small, { [css.active]: activeCategory === item })}
                    onClick={() => {
                      history.push({
                        pathname: routes.toConnectorDetails({
                          accountId,
                          orgIdentifier,
                          projectIdentifier,
                          module,
                          connectorId
                        }),
                        search: `?view=${item}`
                      })
                    }}
                    key={item + index}
                  >
                    {viewToLabelMap[item as ConnectorDetailsView]}
                  </Tag>
                )
              })}
            </Layout.Horizontal>
          </Container>
        }
      />
      <Page.Body>{getPageBody()}</Page.Body>
    </>
  )
}

export default ConnectorDetailsPage
