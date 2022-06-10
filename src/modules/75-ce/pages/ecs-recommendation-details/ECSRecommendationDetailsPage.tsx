/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Page, PageBody, Text, Layout, Popover, Container, Icon } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Position, Menu, MenuItem } from '@blueprintjs/core'
import { defaultTo, isEmpty } from 'lodash-es'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { TimeRangeValue, TimeRange, TimeRangeType } from '@ce/types'
import { ViewTimeRange } from '@ce/components/RecommendationDetails/constants'
import { ResourceType, useFetchRecommendationQuery, RecommendationOverviewStats } from 'services/ce/services'
import { GET_DATE_RANGE } from '@ce/utils/momentUtils'
import routes from '@common/RouteDefinitions'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useStrings } from 'framework/strings'
import ECSRecommendationDetails, {
  EcsRecommendationDtoWithCurrentResources
} from '@ce/components/ECSRecommendationDetails/ECSRecommendationDetails'
import TuneECSRecommendationCard from '@ce/components/ECSRecommendationDetails/TuneECSRecommendationCard'
import CustomizeRecommendationsImg from '@ce/pages/recommendationDetails/images/custom-recommendations.gif'

import css from './ECSRecommendationDetailsPage.module.scss'

const ECSRecommendationDetailsPage: React.FC = () => {
  const { getString } = useStrings()

  const { recommendation, accountId, recommendationName } = useParams<{
    recommendation: string
    recommendationName: string
    accountId: string
  }>()

  useDocumentTitle([getString('ce.recommendation.sideNavText'), recommendationName], true)

  const [timeRange, setTimeRange] = useQueryParamsState<TimeRangeValue>('timeRange', {
    value: TimeRangeType.LAST_7,
    label: TimeRange.LAST_7
  })

  const timeRangeFilter = GET_DATE_RANGE[timeRange.value]

  const [buffer, setBuffer] = useQueryParamsState('buffer', 0)

  const [result] = useFetchRecommendationQuery({
    variables: {
      id: recommendation,
      resourceType: ResourceType.EcsService,
      startTime: timeRangeFilter[0],
      endTime: timeRangeFilter[1]
    }
  })

  const { data, fetching } = result

  const recommendationDetails = defaultTo(data?.recommendationDetails, {}) as EcsRecommendationDtoWithCurrentResources
  const recommendationStats = defaultTo(data?.recommendationStatsV2, {}) as RecommendationOverviewStats

  const isRecomDetailsEmpty =
    isEmpty(recommendationDetails) ||
    Object.values(recommendationDetails).every(val => val === 'ECSRecommendationDTO' || val === null)

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
        {!isRecomDetailsEmpty ? (
          <>
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
                          onClick={() => setTimeRange(viewTimeRange)}
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
                    rightIconProps={{ color: Color.PRIMARY_5 }}
                    className={css.actionText}
                  >
                    {timeRange.label}
                  </Text>
                </Popover>
              </Layout.Horizontal>
            </Card>
            <Container className={css.detailsContainer}>
              <ECSRecommendationDetails
                recommendationStats={recommendationStats}
                recommendationDetails={recommendationDetails}
                timeRange={timeRange}
                timeRangeFilter={timeRangeFilter}
                buffer={buffer}
              />
              <Container padding="xlarge">
                <ECSRecommendationMetadata
                  clusterName={defaultTo(recommendationDetails.clusterName, '')}
                  serviceName={defaultTo(recommendationDetails.serviceName, '')}
                />
                <Text font={{ variation: FontVariation.H5 }} margin={{ top: 'xxlarge', bottom: 'medium' }}>
                  {getString('ce.recommendation.detailsPage.tuneRecommendations')}
                </Text>
                <TuneECSRecommendationCard buffer={buffer} setBuffer={setBuffer} />
                <ECSRecommendationHelpText />
              </Container>
            </Container>
          </>
        ) : null}
      </PageBody>
    </>
  )
}

export default ECSRecommendationDetailsPage

interface ECSRecommendationMetadataProps {
  clusterName: string
  serviceName: string
}

const ECSRecommendationMetadata: React.FC<ECSRecommendationMetadataProps> = ({ clusterName, serviceName }) => {
  const { getString } = useStrings()

  return (
    <Container>
      <Text font={{ variation: FontVariation.H5 }} margin={{ bottom: 'medium' }}>
        {getString('ce.recommendation.detailsPage.ecsServiceDetails')}
      </Text>
      <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500}>
        {getString('common.cluster')}
      </Text>
      <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
        {clusterName}
      </Text>
      <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500} margin={{ top: 'medium' }}>
        {getString('ce.recommendation.listPage.service')}
      </Text>
      <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
        {serviceName}
      </Text>
    </Container>
  )
}

const ECSRecommendationHelpText: React.FC = () => {
  const { getString } = useStrings()

  return (
    <Container padding="medium" background={Color.BLUE_50} margin={{ top: 'xlarge' }}>
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
              {getString('ce.recommendation.detailsPage.ecsRecommendationHelpText')}
            </Text>
          </Container>
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}
