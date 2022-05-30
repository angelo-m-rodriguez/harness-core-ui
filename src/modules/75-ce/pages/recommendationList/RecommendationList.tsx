/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Card, Text, Layout, Container, Icon, Button, ButtonVariation, TableV2, IconName } from '@wings-software/uicore'
import { useHistory, useParams, Link } from 'react-router-dom'
import type { CellProps, Renderer } from 'react-table'
import qs from 'qs'
import { Color, FontVariation } from '@harness/design-system'
import { defaultTo, get } from 'lodash-es'
import { String, useStrings } from 'framework/strings'
import {
  RecommendationItemDto,
  useRecommendationsQuery,
  useRecommendationsSummaryQuery,
  K8sRecommendationFilterDtoInput,
  ResourceType,
  useFetchCcmMetaDataQuery,
  CcmMetaData,
  Maybe
} from 'services/ce/services'

import routes from '@common/RouteDefinitions'
import { Page } from '@common/exports'
import { useQueryParams } from '@common/hooks'
import formatCost from '@ce/utils/formatCost'
import { getViewFilterForId, GROUP_BY_CLUSTER_NAME } from '@ce/utils/perspectiveUtils'
import EmptyView from '@ce/images/empty-state.svg'
import OverviewAddCluster from '@ce/components/OverviewPage/OverviewAddCluster'
import { PAGE_NAMES, USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { CCM_PAGE_TYPE, CloudProvider } from '@ce/types'
import { calculateSavingsPercentage, getProviderIcon } from '@ce/utils/recommendationUtils'
import { generateFilters } from '@ce/utils/anomaliesUtils'
import { getEmissionsValue } from '@ce/utils/formatResourceValue'
import greenLeafImg from '@ce/common/images/green-leaf.svg'
import grayLeafImg from '@ce/common/images/gray-leaf.svg'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import type { StringsMap } from 'stringTypes'
import RecommendationSavingsCard from '../../components/RecommendationSavingsCard/RecommendationSavingsCard'
import RecommendationFilters from '../../components/RecommendationFilters'
import css from './RecommendationList.module.scss'

type RouteFn = (
  params: {
    recommendation: string
    recommendationName: string
  } & {
    accountId: string
  }
) => string

interface RecommendationListProps {
  data: Array<RecommendationItemDto>
  fetching: boolean
  ccmData: Maybe<CcmMetaData> | undefined
  pagination: {
    itemCount: number
    pageSize: number
    pageCount: number
    pageIndex: number
    gotoPage: (pageNumber: number) => void
  }
  onAddClusterSuccess: () => void
}

const RecommendationsList: React.FC<RecommendationListProps> = ({
  data,
  pagination,
  fetching,
  ccmData,
  onAddClusterSuccess
}) => {
  const history = useHistory()
  const { trackEvent } = useTelemetry()
  const { accountId } = useParams<{ accountId: string }>()

  const { getString } = useStrings()
  const resourceTypeToRoute: Record<ResourceType, RouteFn> = useMemo(() => {
    return {
      [ResourceType.Workload]: routes.toCERecommendationDetails,
      [ResourceType.NodePool]: routes.toCENodeRecommendationDetails,
      [ResourceType.EcsService]: routes.toCEECSRecommendationDetails
    }
  }, [])

  const resourceTypeMap: Record<ResourceType, string> = useMemo(
    () => ({
      [ResourceType.Workload]: getString('ce.overview.workload'),
      [ResourceType.NodePool]: getString('ce.overview.nodepool'),
      [ResourceType.EcsService]: getString('ce.overview.ecsService')
    }),
    []
  )

  if (fetching) {
    return (
      <Card elevation={1} className={css.errorContainer}>
        <Icon color="blue500" name="spinner" size={30} />
      </Card>
    )
  }

  if (ccmData && !ccmData.k8sClusterConnectorPresent) {
    trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATION_PAGE_LOADED, {
      clustersNotConfigured: 'no',
      count: 0
    })
    return (
      <Card elevation={1} className={css.errorContainer}>
        <OverviewAddCluster
          onAddClusterSuccess={onAddClusterSuccess}
          descriptionText={getString('ce.pageErrorMsg.recommendationDesc')}
        />
      </Card>
    )
  }

  if (ccmData && ccmData.k8sClusterConnectorPresent && !ccmData.clusterDataPresent) {
    trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATION_PAGE_LOADED, {
      clustersNotConfigured: 'yes',
      count: 0
    })
    return (
      <Card elevation={1} className={css.errorContainer}>
        <img src={EmptyView} />
        <Text className={css.errorText}>{getString('ce.pageErrorMsg.recommendationNoData')}</Text>
      </Card>
    )
  }

  trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATION_PAGE_LOADED, {
    clustersNotConfigured: 'yes',
    count: data.length
  })

  const NameCell: Renderer<CellProps<RecommendationItemDto>> = cell => {
    const originalRowData = cell.row.original
    const { clusterName, namespace, resourceType } = originalRowData

    const provider = get(originalRowData, 'recommendationDetails.recommended.provider', '')

    const iconMapping: Record<ResourceType, IconName> = {
      [ResourceType.EcsService]: 'service-ecs',
      [ResourceType.NodePool]: getProviderIcon(provider),
      [ResourceType.Workload]: 'app-kubernetes'
    }

    const iconName = iconMapping[resourceType]
    const perspectiveKey = 'defaultClusterPerspectiveId'
    const cloudProvider = 'CLUSTER'

    const clusterLink = useMemo(
      () => ({
        pathname: routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string,
          perspectiveName: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string
        }),
        search: `?${qs.stringify({
          filters: JSON.stringify(
            generateFilters({ clusterName } as Record<string, string>, cloudProvider as CloudProvider)
          ),
          groupBy: JSON.stringify(GROUP_BY_CLUSTER_NAME)
        })}`
      }),
      []
    )

    const namespaceLink = useMemo(
      () => ({
        pathname: routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string,
          perspectiveName: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string
        }),
        search: `?${qs.stringify({
          filters: JSON.stringify(
            generateFilters({ clusterName, namespace } as Record<string, string>, cloudProvider as CloudProvider)
          ),
          groupBy: JSON.stringify(GROUP_BY_CLUSTER_NAME)
        })}`
      }),
      []
    )

    const resourceDetailsLink = useMemo(
      () => ({
        pathname: routes.toCEPerspectiveWorkloadDetails({
          accountId,
          clusterName: defaultTo(clusterName, ''),
          namespace: defaultTo(namespace, ''),
          perspectiveId: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string,
          perspectiveName: (defaultTo(ccmData, {}) as CcmMetaData)[perspectiveKey] as string,
          workloadName: cell.value
        })
      }),
      []
    )

    const resourceTypeStringKey: Record<ResourceType, keyof StringsMap> = {
      [ResourceType.EcsService]: 'ce.recommendation.listPage.service',
      [ResourceType.NodePool]: 'ce.nodeRecommendation.nodepool',
      [ResourceType.Workload]: 'pipelineSteps.workload'
    }

    return (
      <Layout.Horizontal style={{ alignItems: 'center' }}>
        <Icon name={iconName} size={28} padding={{ right: 'medium' }} />
        <Layout.Vertical style={{ flex: 1 }}>
          <Layout.Horizontal spacing="xsmall" className={css.nameContainer}>
            <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>
              {`${getString('common.cluster')}: `}
            </Text>
            <Link to={clusterLink} onClick={e => e.stopPropagation()}>
              <Text color={Color.PRIMARY_7} font={{ variation: FontVariation.BODY2 }} lineClamp={1}>
                {clusterName}
              </Text>
            </Link>
          </Layout.Horizontal>
          {namespace ? (
            <Layout.Horizontal spacing="xsmall" className={css.nameContainer}>
              <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>
                {`${getString('ce.recommendation.listPage.filters.namespace')}: `}
              </Text>
              <Link to={namespaceLink} onClick={e => e.stopPropagation()}>
                <Text color={Color.PRIMARY_7} font={{ variation: FontVariation.BODY2 }} lineClamp={1}>
                  {namespace}
                </Text>
              </Link>
            </Layout.Horizontal>
          ) : null}
          <Layout.Horizontal spacing="xsmall" className={css.nameContainer}>
            <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL_BOLD }}>
              {`${getString(resourceTypeStringKey[resourceType])}: `}
            </Text>
            {resourceType === ResourceType.Workload ? (
              <Link to={resourceDetailsLink} onClick={e => e.stopPropagation()}>
                <Text color={Color.PRIMARY_7} font={{ variation: FontVariation.BODY2 }} lineClamp={1}>
                  {cell.value}
                </Text>
              </Link>
            ) : (
              <Text color={Color.GREY_700} font={{ variation: FontVariation.BODY2 }} lineClamp={1}>
                {cell.value}
              </Text>
            )}
          </Layout.Horizontal>
        </Layout.Vertical>
      </Layout.Horizontal>
    )
  }

  const RecommendationTypeCell: Renderer<CellProps<RecommendationItemDto>> = ({ row }) => {
    const rowData = row.original
    const { resourceType } = rowData
    return (
      <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }} lineClamp={1}>
        {resourceTypeMap[resourceType]}
      </Text>
    )
  }

  const CostCell: Renderer<CellProps<RecommendationItemDto>> = cell => {
    return cell.value ? (
      <Text color={Color.GREY_600} font={{ variation: FontVariation.H6 }}>
        {formatCost(cell.value)}
      </Text>
    ) : null
  }

  const SavingCell: Renderer<CellProps<RecommendationItemDto>> = cell => {
    return !isNaN(cell.value) ? (
      <Container>
        <Text inline color={Color.GREEN_700} font={{ variation: FontVariation.H5 }}>
          {formatCost(cell.value)}
        </Text>
        <Text inline color={Color.GREEN_700} font={{ variation: FontVariation.BODY2 }} margin={{ left: 'small' }}>
          {calculateSavingsPercentage(cell.value, defaultTo(cell.row.original.monthlyCost, 0))}
        </Text>
      </Container>
    ) : null
  }

  return data ? (
    <>
      <Layout.Vertical spacing="large">
        {data.length ? (
          <TableV2<RecommendationItemDto>
            onRowClick={({ id, resourceType, resourceName, monthlySaving }) => {
              trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATION_CLICK, {
                recommendationID: id,
                monthlySaving
              })
              history.push(
                resourceTypeToRoute[resourceType]({
                  accountId,
                  recommendation: id,
                  recommendationName: resourceName || id
                })
              )
            }}
            data={data}
            columns={[
              {
                accessor: 'resourceName',
                Header: getString('ce.recommendation.listPage.listTableHeaders.resourceName'),
                Cell: NameCell,
                width: '36%'
              },
              {
                accessor: 'monthlySaving',
                Header: getString('ce.recommendation.listPage.listTableHeaders.monthlySavings'),
                Cell: SavingCell,
                width: '18%'
              },
              {
                accessor: 'monthlyCost',
                Header: getString('ce.recommendation.listPage.listTableHeaders.monthlyCost'),
                Cell: CostCell,
                width: '18%'
              },
              {
                Header: getString('ce.recommendation.listPage.listTableHeaders.recommendationType'),
                Cell: RecommendationTypeCell,
                width: '18%'
              }
            ]}
            pagination={pagination}
          ></TableV2>
        ) : (
          <Container className={css.errorContainer}>
            <img src={EmptyView} />
            <Text className={css.errorText}>{getString('ce.pageErrorMsg.noRecommendations')}</Text>
          </Container>
        )}
      </Layout.Vertical>
    </>
  ) : null
}

const RecommendationList: React.FC = () => {
  const [costFilters, setCostFilters] = useState<Record<string, number>>({})
  const [page, setPage] = useState(0)

  const { trackPage } = useTelemetry()
  const history = useHistory()
  const { accountId } = useParams<{ accountId: string }>()
  const sustainabilityEnabled = useFeatureFlag(FeatureFlag.CCM_SUSTAINABILITY)
  const {
    perspectiveId,
    perspectiveName,
    filters: filterQuery = {},
    origin
  } = useQueryParams<{
    perspectiveId: string
    perspectiveName: string
    filters: Record<string, any>
    origin: string
  }>()

  const [filters, setFilters] = useState<Record<string, string[]>>(filterQuery)

  useEffect(() => {
    trackPage(PAGE_NAMES.RECOMMENDATIONS_PAGE, {})
  }, [])

  const modifiedCostFilters = costFilters['minSaving'] ? costFilters : { ...costFilters, minSaving: 0 }

  const [ccmMetaResult, refetchCCMMetaData] = useFetchCcmMetaDataQuery()
  const { data: ccmData, fetching: fetchingCCMMetaData } = ccmMetaResult

  const perspectiveFilters = (
    perspectiveId ? { perspectiveFilters: getViewFilterForId(perspectiveId) } : ({} as any)
  ) as K8sRecommendationFilterDtoInput

  const [result] = useRecommendationsQuery({
    variables: {
      filter: {
        ...filters,
        ...perspectiveFilters,
        ...modifiedCostFilters,
        offset: page * 10,
        limit: 10
      } as K8sRecommendationFilterDtoInput
    },
    pause: fetchingCCMMetaData
  })

  const [summaryResult] = useRecommendationsSummaryQuery({
    variables: {
      filter: {
        ...filters,
        ...perspectiveFilters,
        ...modifiedCostFilters
      } as unknown as K8sRecommendationFilterDtoInput
    }
  })

  const { data, fetching } = result
  const { data: summaryData } = summaryResult

  const { getString } = useStrings()

  const totalMonthlyCost = summaryData?.recommendationStatsV2?.totalMonthlyCost || 0
  const totalSavings = summaryData?.recommendationStatsV2?.totalMonthlySaving || 0

  const recommendationItems = data?.recommendationsV2?.items || []

  const gotoPage = (pageNumber: number) => setPage(pageNumber)

  const goBackToPerspective: () => void = () => {
    if (origin === CCM_PAGE_TYPE.Workload) {
      const clusterName = filterQuery.clusterNames[0],
        namespace = filterQuery.namespaces[0],
        workloadName = filterQuery.names[0]

      history.push(
        routes.toCEPerspectiveWorkloadDetails({
          accountId,
          perspectiveId,
          perspectiveName,
          clusterName,
          namespace,
          workloadName
        })
      )
    } else {
      history.push(
        routes.toPerspectiveDetails({
          perspectiveId,
          perspectiveName,
          accountId
        })
      )
    }
  }

  const pagination = {
    itemCount: summaryData?.recommendationStatsV2?.count || 0,
    pageSize: 10,
    pageCount: summaryData?.recommendationStatsV2?.count
      ? Math.ceil(summaryData?.recommendationStatsV2?.count / 10)
      : 0,
    pageIndex: page,
    gotoPage: gotoPage
  }

  const isEmptyView = !fetching && !recommendationItems?.length

  return (
    <>
      <Page.Header
        title={
          <Text
            color="grey800"
            style={{ fontSize: 20, fontWeight: 'bold' }}
            tooltipProps={{ dataTooltipId: 'ccmRecommendations' }}
          >
            {getString('ce.recommendation.sideNavText')}
          </Text>
        }
        breadcrumbs={<NGBreadcrumbs />}
        toolbar={
          perspectiveId ? (
            <Button
              text={getString('ce.recommendation.listPage.backToPerspectives', {
                name: perspectiveName
              })}
              icon="chevron-left"
              onClick={goBackToPerspective}
              variation={ButtonVariation.PRIMARY}
            />
          ) : null
        }
      />
      <Page.Body loading={fetching || fetchingCCMMetaData}>
        <Card style={{ width: '100%' }}>
          <Layout.Horizontal flex={{ justifyContent: 'flex-end' }}>
            <RecommendationFilters
              costFilters={costFilters}
              setCostFilters={setCostFilters}
              setFilters={setFilters}
              filters={filters}
            />
          </Layout.Horizontal>
        </Card>
        <Container className={css.listContainer}>
          <Layout.Vertical spacing="large">
            <Layout.Horizontal spacing="medium">
              <RecommendationSavingsCard
                title={getString('ce.recommendation.listPage.monthlySavingsText')}
                amount={isEmptyView ? '$-' : formatCost(totalSavings)}
                iconName="money-icon"
                subTitle={getString('ce.recommendation.listPage.recommendationCount', {
                  count: summaryData?.recommendationStatsV2?.count
                })}
              />
              {sustainabilityEnabled && (
                <RecommendationSavingsCard
                  title={getString('ce.recommendation.listPage.potentialReducedEmissionTitle')}
                  titleImg={greenLeafImg}
                  amount={
                    isEmptyView ? (
                      ''
                    ) : (
                      <String
                        stringID="ce.common.emissionUnitHTML"
                        vars={{ value: getEmissionsValue(totalSavings) }}
                        useRichText
                      />
                    )
                  }
                  cardCssName={css.potentialReducedEmissionCard}
                  subTitle={getString('ce.recommendation.listPage.potentialReducedEmissionSubtitle', {
                    count: summaryData?.recommendationStatsV2?.count
                  })}
                />
              )}
              <RecommendationSavingsCard
                title={getString('ce.recommendation.listPage.monthlyPotentialCostText')}
                amount={isEmptyView ? '$-' : formatCost(totalMonthlyCost)}
                amountSubTitle={getString('ce.recommendation.listPage.byEOM')}
                subTitle={getString('ce.recommendation.listPage.forecatedCostSubText')}
              />
              {sustainabilityEnabled && (
                <RecommendationSavingsCard
                  title={getString('ce.recommendation.listPage.potentialEmissionTitle')}
                  titleImg={grayLeafImg}
                  amount={
                    isEmptyView ? (
                      ''
                    ) : (
                      <String
                        stringID="ce.common.emissionUnitHTML"
                        vars={{ value: getEmissionsValue(totalMonthlyCost) }}
                        useRichText
                      />
                    )
                  }
                  cardCssName={css.potentialEmissionCard}
                  amountSubTitle={getString('ce.recommendation.listPage.byEOM')}
                  subTitle={getString('ce.recommendation.listPage.forecatedCostSubText')}
                />
              )}
            </Layout.Horizontal>
            <RecommendationsList
              onAddClusterSuccess={() => {
                refetchCCMMetaData()
              }}
              ccmData={ccmData?.ccmMetaData}
              pagination={pagination}
              fetching={fetching || fetchingCCMMetaData}
              data={recommendationItems as Array<RecommendationItemDto>}
            />
          </Layout.Vertical>
        </Container>
      </Page.Body>
    </>
  )
}

export default RecommendationList
