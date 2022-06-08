/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { defaultTo } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Color, Container, FontVariation, Heading, Icon, PageError, PageSpinner, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useGetSLODetails } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { SLOTargetChart } from '@cv/pages/slos/components/SLOTargetChart/SLOTargetChart'
import { getDataPointsWithMinMaxXLimit } from '@cv/pages/slos/components/SLOTargetChart/SLOTargetChart.utils'
import { getSLOAndErrorBudgetGraphOptions } from '@cv/pages/slos/CVSLOListingPage.utils'
import { TimelineBar } from '@cv/components/TimelineView/TimelineBar'
import ColumnChartEventMarker from '@cv/components/ColumnChart/components/ColummnChartEventMarker/ColumnChartEventMarker'
import { getColorForChangeEventType } from '@cv/components/ChangeTimeline/ChangeTimeline.utils'
import { calculatePositionForTimestamp } from '@cv/components/ColumnChart/ColumnChart.utils'
import { SLOCardToggleViews, SLOTargetChartWrapperProps } from './SLOAndErrorBudget.types'
import cssCVSLOsListingPage from '@cv/pages/slos/CVSLOsListingPage.module.scss'
import css from './SLOAndErrorBudget.module.scss'

const SLOTargetChartWrapper: React.FC<SLOTargetChartWrapperProps> = ({
  type,
  selectedSLO,
  startTime,
  endTime,
  eventTime,
  eventType
}) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const mainRef = useRef<HTMLDivElement>(null)
  const [markerPosition, setMarkerPosition] = useState<number>()

  const { data, loading, error, refetch } = useGetSLODetails({
    identifier: selectedSLO.identifier ?? '',
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier,
      startTime,
      endTime
    }
  })

  const serviceLevelObjective = data?.data?.sloDashboardWidget

  useLayoutEffect(() => {
    if (serviceLevelObjective && mainRef.current) {
      const containerWidth = defaultTo(mainRef.current.parentElement?.getBoundingClientRect().width, 0)

      if (eventTime) {
        setMarkerPosition(
          calculatePositionForTimestamp({
            containerWidth,
            startTime: eventTime,
            startOfTimestamps: startTime,
            endOfTimestamps: endTime
          })
        )
      }
    }
  }, [endTime, eventTime, loading, serviceLevelObjective, startTime])

  const { sloPerformanceTrend = [], errorBudgetBurndown = [] } = serviceLevelObjective ?? {}

  const { dataPoints, minXLimit, maxXLimit } = useMemo(
    () => getDataPointsWithMinMaxXLimit(type === SLOCardToggleViews.SLO ? sloPerformanceTrend : errorBudgetBurndown),
    [type, sloPerformanceTrend, errorBudgetBurndown]
  )

  return (
    <Container height={250}>
      <Heading level={2} font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK}>
        {selectedSLO.name}
      </Heading>
      {loading && (
        <Container height="100%" flex={{ justifyContent: 'center' }}>
          <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
        </Container>
      )}
      {!loading && error && <PageError message={getErrorMessage(error)} onClick={() => refetch()} />}
      {!loading && !error && serviceLevelObjective && (
        <div>
          <div ref={mainRef} style={{ position: 'relative' }}>
            {selectedSLO.outOfRange && (
              <Container className={css.noSloData}>
                <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600} className={css.text}>
                  {getString('cv.noDataAvailableForTheCurrentSLOCycle')}
                </Text>
              </Container>
            )}
            {!selectedSLO.outOfRange && serviceLevelObjective.recalculatingSLI && (
              <PageSpinner
                className={cssCVSLOsListingPage.sloCardSpinner}
                message={getString(
                  type === SLOCardToggleViews.SLO
                    ? 'cv.sloRecalculationInProgress'
                    : 'cv.errorBudgetRecalculationInProgress'
                )}
              />
            )}
            {!selectedSLO.outOfRange && !!markerPosition && (
              <div style={{ position: 'absolute', top: 20 }}>
                <ColumnChartEventMarker
                  columnHeight={110}
                  leftOffset={markerPosition}
                  markerColor={getColorForChangeEventType(eventType)}
                />
              </div>
            )}
            <SLOTargetChart
              dataPoints={dataPoints}
              customChartOptions={getSLOAndErrorBudgetGraphOptions({
                isCardView: true,
                type,
                startTime,
                endTime,
                minXLimit,
                maxXLimit,
                serviceLevelObjective
              })}
            />
          </div>
          <TimelineBar startDate={startTime} endDate={endTime} columnWidth={50} className={css.timelineBar} />
        </div>
      )}
    </Container>
  )
}

export default SLOTargetChartWrapper
