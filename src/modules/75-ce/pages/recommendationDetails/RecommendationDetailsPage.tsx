/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import {
  Container,
  Layout,
  Text,
  Button,
  Card,
  PageBody,
  Popover,
  ButtonVariation,
  ButtonSize,
  PillToggle,
  Icon
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Position, Menu, MenuItem, Slider } from '@blueprintjs/core'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useStrings } from 'framework/strings'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { GET_DATE_RANGE } from '@ce/utils/momentUtils'
import { QualityOfService, RecommendationItem, TimeRangeValue, TimeRange, TimeRangeType } from '@ce/types'
import { ViewTimeRange } from '@ce/components/RecommendationDetails/constants'
import { RecommendationOverviewStats, ResourceType, useFetchRecommendationQuery } from 'services/ce/services'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { PAGE_NAMES, USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import CustomizeRecommendationsImg from './images/custom-recommendations.gif'

import RecommendationDetails from '../../components/RecommendationDetails/RecommendationDetails'
import css from './RecommendationDetailsPage.module.scss'

interface ResourceDetails {
  cpu?: string
  memory: string
}
interface ResourceObject {
  limits: ResourceDetails
  requests: ResourceDetails
}
interface ContainerRecommendaitons {
  current: ResourceObject
}
interface RecommendationDetails {
  items: Array<RecommendationItem>
  containerRecommendations: Record<string, ContainerRecommendaitons>
}
interface WorkloadDetailsProps {
  workloadData: WorkloadDataType
  goToWorkloadDetails: () => void
  qualityOfService: QualityOfService
  setQualityOfService: (newState: QualityOfService) => void
  cpuAndMemoryValueBuffer: number
  setCpuAndMemoryValueBuffer: (newState: number) => void
}

const WorkloadDetails: React.FC<WorkloadDetailsProps> = props => {
  const { getString } = useStrings()
  const {
    workloadData,
    goToWorkloadDetails,
    qualityOfService,
    setQualityOfService,
    cpuAndMemoryValueBuffer,
    setCpuAndMemoryValueBuffer
  } = props

  return (
    <Container padding="xlarge">
      <Layout.Vertical spacing="medium">
        <Layout.Horizontal margin={{ bottom: 'medium' }} flex={{ justifyContent: 'space-between' }}>
          <Text font={{ variation: FontVariation.H5 }} tooltipProps={{ dataTooltipId: 'workloadDetails' }}>
            {getString('ce.perspectives.workloadDetails.workloadDetailsText')}
          </Text>
          <Button variation={ButtonVariation.SECONDARY} size={ButtonSize.SMALL} onClick={goToWorkloadDetails}>
            {getString('ce.recommendation.detailsPage.viewMoreDetailsText')}
          </Button>
        </Layout.Horizontal>
        <Layout.Vertical margin={{ bottom: 'medium' }}>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500}>
            {getString('common.cluster')}
          </Text>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
            {workloadData.clusterName}
          </Text>
        </Layout.Vertical>
        <Layout.Vertical margin={{ bottom: 'medium' }}>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500}>
            {getString('ce.perspectives.workloadDetails.fieldNames.workload')}
          </Text>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
            {workloadData.resourceName}
          </Text>
        </Layout.Vertical>
        <Text font={{ variation: FontVariation.H5 }} tooltipProps={{ dataTooltipId: 'tuneRecommendations' }}>
          {getString('ce.recommendation.detailsPage.tuneRecommendations')}
        </Text>
        <Card style={{ padding: 0, border: 0 }}>
          <Container padding="medium">
            <Text font={{ variation: FontVariation.H6 }} tooltipProps={{ dataTooltipId: 'setQoSAndBuffer' }}>
              {getString('ce.recommendation.detailsPage.setQoSAndBuffer')}
            </Text>
          </Container>
          <Container padding="medium" background={Color.PRIMARY_1} className={css.tuneRecomContainer}>
            <Text font={{ variation: FontVariation.SMALL_SEMI }} margin={{ bottom: 'small' }}>
              {getString('ce.recommendation.detailsPage.qualityOfService')}
            </Text>
            <PillToggle
              selectedView={qualityOfService}
              options={[
                { label: getString('ce.recommendation.detailsPage.burstable'), value: QualityOfService.BURSTABLE },
                { label: getString('ce.recommendation.detailsPage.guaranteed'), value: QualityOfService.GUARANTEED }
              ]}
              className={css.pillToggle}
              onChange={val => setQualityOfService(val)}
            />
            <Text font={{ variation: FontVariation.SMALL_SEMI }} margin={{ bottom: 'medium', top: 'medium' }}>
              {getString('ce.recommendation.detailsPage.memoryValueBuffer')}
            </Text>
            <Container className={css.sliderContainer}>
              <Text
                font={{ variation: FontVariation.SMALL_SEMI, align: 'right' }}
                margin={{ bottom: 'small', top: 'small', right: 'xxlarge' }}
              >
                {`${cpuAndMemoryValueBuffer}%`}
              </Text>
              <Layout.Horizontal style={{ alignItems: 'center' }} spacing="medium">
                <Text font={{ variation: FontVariation.TINY }} color={Color.GREY_600}>
                  0
                </Text>
                <Slider
                  min={0}
                  max={100}
                  stepSize={1}
                  labelRenderer={false}
                  value={cpuAndMemoryValueBuffer}
                  onChange={val => setCpuAndMemoryValueBuffer(val)}
                  className={css.bufferSlider}
                />
                <Text font={{ variation: FontVariation.TINY }} color={Color.GREY_600}>
                  100
                </Text>
              </Layout.Horizontal>
            </Container>
          </Container>
        </Card>
        <Container padding="medium" background={Color.BLUE_50}>
          <Layout.Horizontal spacing="small">
            <Icon name="info-messaging" />
            <Container>
              <Layout.Horizontal spacing="small">
                <Text color={Color.GREY_700} font={{ variation: FontVariation.SMALL }}>
                  {getString('ce.recommendation.detailsPage.customDetailsText1')}
                </Text>
                <img className={css.customImage} src={CustomizeRecommendationsImg} alt="custom-recommendation-img" />
              </Layout.Horizontal>
              <Container padding={{ top: 'small' }}>
                <Text inline color={Color.GREY_700} font={{ variation: FontVariation.SMALL }}>
                  {getString('ce.recommendation.detailsPage.customDetailsText2')}
                </Text>
                <Text inline color={Color.GREY_800} font={{ variation: FontVariation.SMALL_SEMI }}>
                  {getString('ce.recommendation.detailsPage.customDetailsText3')}
                </Text>
              </Container>
            </Container>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

interface WorkloadDataType {
  clusterName?: string
  namespace?: string
  id?: string
  resourceName?: string
}

const RecommendationDetailsPage: React.FC = () => {
  const { recommendation, accountId, recommendationName } = useParams<{
    recommendation: string
    recommendationName: string
    accountId: string
  }>()
  const { getString } = useStrings()
  const { trackPage, trackEvent } = useTelemetry()
  const history = useHistory()
  const [timeRange, setTimeRange] = useQueryParamsState<TimeRangeValue>('timeRange', {
    value: TimeRangeType.LAST_7,
    label: TimeRange.LAST_7
  })

  useDocumentTitle([getString('ce.recommendation.sideNavText'), recommendationName], true)

  const [qualityOfService, setQualityOfService] = useQueryParamsState<QualityOfService>(
    'QoS',
    QualityOfService.BURSTABLE
  )
  const [cpuAndMemoryValueBuffer, setCpuAndMemoryValueBuffer] = useQueryParamsState('buffer', 0)

  useEffect(() => {
    trackPage(PAGE_NAMES.RECOMMENDATIONS_DETAILS_PAGE, {})
  }, [])

  const timeRangeFilter = GET_DATE_RANGE[timeRange.value]

  const [result] = useFetchRecommendationQuery({
    variables: {
      id: recommendation,
      resourceType: ResourceType.Workload,
      startTime: timeRangeFilter[0],
      endTime: timeRangeFilter[1]
    }
  })

  const { data, fetching } = result

  const recommendationDetails = (data?.recommendationDetails as RecommendationDetails) || {}
  const recommendationStats = data?.recommendationStatsV2 as RecommendationOverviewStats
  const recommendationItems = recommendationDetails?.items || []
  const workloadData = data?.recommendationsV2?.items?.length && data?.recommendationsV2?.items[0]

  const goToWorkloadDetails = () => {
    if (workloadData) {
      trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATION_VIEW_MORE_CLICK, {})
      workloadData.clusterName &&
        workloadData.resourceName &&
        workloadData.namespace &&
        history.push(
          routes.toCERecommendationWorkloadDetails({
            accountId,
            recommendation,
            recommendationName,
            clusterName: workloadData.clusterName,
            namespace: workloadData.namespace,
            workloadName: workloadData.resourceName
          })
        )
    }
  }

  return (
    <>
      <Page.Header
        title={recommendationName}
        breadcrumbs={
          <NGBreadcrumbs
            links={[
              {
                url: routes.toCERecommendations({ accountId }),
                label: getString('ce.recommendation.sideNavText')
              }
            ]}
          />
        }
      />
      <PageBody loading={fetching}>
        <Card style={{ width: '100%' }}>
          <Layout.Horizontal spacing="small">
            <Text color={Color.GREY_800} font={{ weight: 'semi-bold' }}>
              {getString('ce.recommendation.detailsPage.utilizationDataComputation')}
            </Text>
            <Popover
              position={Position.BOTTOM_LEFT}
              modifiers={{
                arrow: { enabled: false },
                flip: { enabled: true },
                keepTogether: { enabled: true },
                preventOverflow: { enabled: true }
              }}
              content={
                <Menu>
                  {ViewTimeRange.map(viewTimeRange => (
                    <MenuItem
                      onClick={() => {
                        setTimeRange(viewTimeRange)
                      }}
                      text={viewTimeRange.label}
                      key={viewTimeRange.value}
                    />
                  ))}
                </Menu>
              }
            >
              <Text
                color={Color.PRIMARY_5}
                rightIcon="caret-down"
                rightIconProps={{
                  color: Color.PRIMARY_5
                }}
                className={css.actionText}
              >
                {timeRange?.label}
              </Text>
            </Popover>
          </Layout.Horizontal>
        </Card>

        {recommendationItems.length ? (
          <Container className={css.detailsContainer} padding="xxlarge">
            <Layout.Vertical spacing="large">
              {Object.keys(recommendationDetails.containerRecommendations || {}).map((cRKey, index) => {
                const item = recommendationItems.find(rI => rI.containerName === cRKey) || ({} as RecommendationItem)
                const currentResources = recommendationDetails.containerRecommendations[cRKey].current || {}

                return (
                  <RecommendationDetails
                    key={`${item.containerName}-${index}-${timeRange.label}`}
                    histogramData={item}
                    currentResources={currentResources}
                    timeRange={timeRange}
                    recommendationStats={recommendationStats}
                    qualityOfService={qualityOfService}
                    timeRangeFilter={timeRangeFilter}
                    cpuAndMemoryValueBuffer={cpuAndMemoryValueBuffer}
                    currentContainer={index + 1}
                    totalContainers={Object.keys(recommendationDetails.containerRecommendations || {}).length}
                  />
                )
              })}
            </Layout.Vertical>
            <WorkloadDetails
              goToWorkloadDetails={goToWorkloadDetails}
              workloadData={workloadData as WorkloadDataType}
              qualityOfService={qualityOfService}
              setQualityOfService={setQualityOfService}
              cpuAndMemoryValueBuffer={cpuAndMemoryValueBuffer}
              setCpuAndMemoryValueBuffer={setCpuAndMemoryValueBuffer}
            />
          </Container>
        ) : null}
      </PageBody>
    </>
  )
}

export default RecommendationDetailsPage
