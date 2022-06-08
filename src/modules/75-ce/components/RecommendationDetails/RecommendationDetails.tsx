/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Container, Layout, Text, Button, Icon, Popover } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import copy from 'copy-to-clipboard'
import { PopoverInteractionKind, Position } from '@blueprintjs/core'
import cx from 'classnames'
import { useStrings } from 'framework/strings'

import { convertNumberToFixedDecimalPlaces } from '@ce/utils/convertNumberToFixedDecimalPlaces'
import {
  getCPUValueInReadableForm,
  getMemValueInReadableForm,
  getRecommendationYaml,
  getMemoryValueInGBFromExpression,
  getCPUValueInCPUFromExpression
} from '@ce/utils/formatResourceValue'
import { RecommendationItem, TimeRangeValue, ResourceObject, QualityOfService, CustomHighcharts } from '@ce/types'
import type { RecommendationOverviewStats } from 'services/ce/services'

import formatCost from '@ce/utils/formatCost'
import { getTimePeriodString } from '@ce/utils/momentUtils'
import { addBufferToValue, calculateSavingsPercentage } from '@ce/utils/recommendationUtils'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { RecommendationType, ChartColors, PercentileValues } from './constants'
import RecommendationTabs from './RecommendationTabs'
import RecommendationDiffViewer from '../RecommendationDiffViewer/RecommendationDiffViewer'
import RecommendationHistogram from '../RecommendationHistogram/RecommendationHistogram'
import limitLegend from './images/limit-legend.svg'
import requestLegend from './images/request-legend.svg'
import histogramImg from './images/histogram.gif'
import MultipleContainerHeader from './MultipleContainerHeader'
import {
  RecommendationDetailsSavingsCard,
  RecommendationDetailsSpendCard
} from '../RecommendationDetailsSummaryCards/RecommendationDetailsSummaryCards'
import css from './RecommendationDetails.module.scss'

interface RecommendationDetailsProps {
  histogramData: RecommendationItem
  currentResources: ResourceObject
  timeRange: TimeRangeValue
  recommendationStats: RecommendationOverviewStats
  qualityOfService: QualityOfService
  timeRangeFilter: string[]
  cpuAndMemoryValueBuffer: number
  currentContainer: number
  totalContainers: number
}

const RecommendationDetails: React.FC<RecommendationDetailsProps> = ({
  histogramData,
  currentResources,
  timeRange,
  recommendationStats,
  qualityOfService,
  timeRangeFilter,
  cpuAndMemoryValueBuffer,
  currentContainer,
  totalContainers
}) => {
  const [containerVisible, setContainerVisible] = useState(true)

  const [selectedRecommendation, setSelectedRecommendation] = useQueryParamsState<RecommendationType>(
    'rType',
    RecommendationType.CostOptimized
  )

  const [cpuReqVal, setCPUReqVal] = useState(
    selectedRecommendation === RecommendationType.CostOptimized ? PercentileValues.P50 : PercentileValues.P95
  )
  const [memReqVal, setMemReqVal] = useState(
    selectedRecommendation === RecommendationType.CostOptimized ? PercentileValues.P50 : PercentileValues.P95
  )
  const [memLimitVal, setMemLimitVal] = useState(PercentileValues.P95)

  const { cpu: cpuCost, memory: memoryCost } = histogramData.containerRecommendation?.lastDayCost || {}

  const [reRenderChart, setRerenderChart] = useState(false)

  const { getString } = useStrings()

  const currentCPUResource = getCPUValueInCPUFromExpression(currentResources?.requests?.cpu || 1)
  const currentMemResource = getMemoryValueInGBFromExpression(currentResources?.requests?.memory)

  const cpuReqValue = Number(histogramData?.cpuHistogram.precomputed[cpuReqVal])
  const memReqValue = Number(histogramData?.memoryHistogram.precomputed[memReqVal])
  const memLimitValue = Number(histogramData?.memoryHistogram.precomputed[memLimitVal])

  const perfCPUReqValue = Number(histogramData?.cpuHistogram.precomputed[PercentileValues.P95])
  const perfMemReqValue = Number(histogramData?.memoryHistogram.precomputed[PercentileValues.P95])

  const costOptimisedCPUReqValue = Number(histogramData?.cpuHistogram.precomputed[PercentileValues.P50])
  const costOptimisedMemReqValue = Number(histogramData?.memoryHistogram.precomputed[PercentileValues.P50])

  const isLastDayCostDefined = cpuCost && memoryCost

  const numCPUCost = Number(cpuCost)
  const numMemCost = Number(memoryCost)

  const currentSavings = isLastDayCostDefined
    ? (((currentCPUResource - getCPUValueInCPUFromExpression(cpuReqValue)) / currentCPUResource) * numCPUCost +
        ((currentMemResource - getMemoryValueInGBFromExpression(memReqValue)) / currentMemResource) * numMemCost) *
      30
    : -1

  const performanceOptimizedSavings = isLastDayCostDefined
    ? (((currentCPUResource - getCPUValueInCPUFromExpression(perfCPUReqValue)) / currentCPUResource) * numCPUCost +
        ((currentMemResource - getMemoryValueInGBFromExpression(perfMemReqValue)) / currentMemResource) * numMemCost) *
      30
    : -1

  const costOptimizedSavings = isLastDayCostDefined
    ? (((currentCPUResource - getCPUValueInCPUFromExpression(costOptimisedCPUReqValue)) / currentCPUResource) *
        numCPUCost +
        ((currentMemResource - getMemoryValueInGBFromExpression(costOptimisedMemReqValue)) / currentMemResource) *
          numMemCost) *
      30
    : -1

  const isCostOptimizedCustomized =
    selectedRecommendation === RecommendationType.CostOptimized && currentSavings !== costOptimizedSavings

  const isPerfOptimizedCustomized =
    selectedRecommendation === RecommendationType.PerformanceOptimized && currentSavings !== performanceOptimizedSavings

  const cpuChartRef = useRef<CustomHighcharts>()
  const memoryChartRef = useRef<CustomHighcharts>()

  const setCPUChartRef: (chart: CustomHighcharts) => void = chart => {
    cpuChartRef.current = chart
  }

  const setMemoryChartRef: (chart: CustomHighcharts) => void = chart => {
    memoryChartRef.current = chart
  }

  const resetReqLimitMarkers: (reqCpu: number, reqMem: number, limitMem: number) => void = (
    reqCpu,
    reqMem,
    limitMem
  ) => {
    cpuChartRef.current && cpuChartRef.current.rePlaceMarker(reqCpu)
    memoryChartRef.current && memoryChartRef.current.rePlaceMarker(reqMem, limitMem)
  }

  const resetToDefaultRecommendation: (recommendation: RecommendationType) => void = (
    recommendation: RecommendationType
  ) => {
    if (recommendation === RecommendationType.CostOptimized) {
      setCPUReqVal(PercentileValues.P50)
      setMemReqVal(PercentileValues.P50)
      setMemLimitVal(PercentileValues.P95)
      resetReqLimitMarkers(PercentileValues.P50, PercentileValues.P50, PercentileValues.P90)
    } else if (recommendation === RecommendationType.PerformanceOptimized) {
      setCPUReqVal(PercentileValues.P95)
      setMemReqVal(PercentileValues.P95)
      setMemLimitVal(PercentileValues.P95)
      resetReqLimitMarkers(PercentileValues.P95, PercentileValues.P95, PercentileValues.P95)
    }
    setRerenderChart(state => !state)
  }

  useEffect(() => {
    setMemLimitVal(qualityOfService === QualityOfService.GUARANTEED ? memReqVal : PercentileValues.P95)
  }, [qualityOfService])

  useEffect(() => {
    resetReqLimitMarkers(cpuReqVal, memReqVal, memLimitVal)
  }, [selectedRecommendation, cpuReqVal, memReqVal, memLimitVal])

  const updateCPUChart: (val: number) => void = val => {
    const {
      cpuHistogram: { precomputed }
    } = histogramData
    setCPUReqVal(val)
    const value = precomputed[val]

    cpuChartRef.current?.series[0].update({
      type: 'column',
      zones: [
        {
          value: convertNumberToFixedDecimalPlaces(value, 2) + 0.0001,
          color: ChartColors.BLUE
        },
        {
          color: ChartColors.GREY
        }
      ]
    })
  }

  const updateMemoryChart: (val: [number, number]) => void = val => {
    const {
      memoryHistogram: { precomputed }
    } = histogramData
    const [reqVal, limitVal] = val
    setMemReqVal(reqVal)
    setMemLimitVal(limitVal)

    const reqValHistogram = precomputed[reqVal]
    const limitValHistogram = precomputed[limitVal]

    memoryChartRef.current?.series[0].update({
      type: 'column',
      zones: [
        {
          value: convertNumberToFixedDecimalPlaces(reqValHistogram, 2) + 1,
          color: ChartColors.BLUE
        },
        {
          value: convertNumberToFixedDecimalPlaces(limitValHistogram, 2) + 1,
          color: ChartColors.GREEN
        },
        {
          color: ChartColors.GREY
        }
      ]
    })
  }

  return (
    <Container>
      <MultipleContainerHeader
        containerName={histogramData.containerName}
        containerVisible={containerVisible}
        currentContainer={currentContainer}
        totalContainers={totalContainers}
        toggleContainerVisble={() => setContainerVisible(prevState => !prevState)}
      />
      <Container
        className={cx(css.mainContainer, { [css.containerHidden]: !containerVisible })}
        padding="large"
        background="white"
      >
        <Layout.Horizontal padding={{ top: 'large' }}>
          <Container width="100%">
            <RecommendationDetailsSpendCard
              withRecommendationAmount={formatCost(
                recommendationStats?.totalMonthlyCost - recommendationStats?.totalMonthlySaving
              )}
              withoutRecommendationAmount={formatCost(recommendationStats?.totalMonthlyCost)}
              title={
                totalContainers > 1
                  ? getString('ce.recommendation.detailsPage.workloadMonthlyPotentialCostText')
                  : getString('ce.recommendation.listPage.monthlyPotentialCostText')
              }
              spentBy={getTimePeriodString(timeRangeFilter[1], 'MMM DD')}
            />
          </Container>
          <Container width="100%">
            <RecommendationDetailsSavingsCard
              amount={formatCost(recommendationStats?.totalMonthlySaving)}
              title={
                totalContainers > 1
                  ? getString('ce.recommendation.detailsPage.workloadMonthlySavingsText')
                  : getString('ce.recommendation.listPage.monthlySavingsText')
              }
              amountSubTitle={calculateSavingsPercentage(
                recommendationStats?.totalMonthlySaving,
                recommendationStats?.totalMonthlyCost
              )}
              subTitle={`${getTimePeriodString(timeRangeFilter[0], 'MMM DD')} - ${getTimePeriodString(
                timeRangeFilter[1],
                'MMM DD'
              )}`}
            />
          </Container>
        </Layout.Horizontal>
        <RecommendationTabs
          costOptimizedSavings={costOptimizedSavings}
          performanceOptimizedSavings={performanceOptimizedSavings}
          currentSavings={currentSavings}
          selectedRecommendation={selectedRecommendation}
          setSelectedRecommendation={setSelectedRecommendation}
          setCPUReqVal={setCPUReqVal}
          setMemReqVal={setMemReqVal}
          setMemLimitVal={setMemLimitVal}
          isPerfOptimizedCustomized={isPerfOptimizedCustomized}
          isCostOptimizedCustomized={isCostOptimizedCustomized}
        />
        <section className={css.diffContainer}>
          <Text
            padding="xsmall"
            color={Color.GREY_700}
            font={{ variation: FontVariation.TABLE_HEADERS, align: 'center' }}
            background={Color.GREY_100}
          >
            {getString('ce.recommendation.detailsPage.resourceChanges')}
          </Text>
          <section className={css.diffHeader}>
            <Layout.Horizontal className={css.heading} spacing="xsmall">
              <Text font={{ variation: FontVariation.SMALL_SEMI }}>{getString('common.current')}</Text>
              <Text font={{ variation: FontVariation.SMALL }}>
                {getString('ce.recommendation.detailsPage.recommendedResources')}
              </Text>
            </Layout.Horizontal>
            <Layout.Horizontal className={cx(css.optimizedHeader, css.heading)} spacing="xsmall">
              <Text font={{ variation: FontVariation.SMALL_SEMI }}>{selectedRecommendation}</Text>
              <Text font={{ variation: FontVariation.SMALL }}>
                {getString('ce.recommendation.detailsPage.recommendedResources')}
              </Text>
              <Icon
                name="duplicate"
                color="primary5"
                onClick={() => {
                  const yamlVal = getRecommendationYaml(
                    addBufferToValue(cpuReqValue, cpuAndMemoryValueBuffer),
                    addBufferToValue(memReqValue, cpuAndMemoryValueBuffer),
                    addBufferToValue(memLimitValue, cpuAndMemoryValueBuffer),
                    qualityOfService
                  )
                  copy(yamlVal)
                }}
                className={css.copyIcon}
                size={13}
              />
            </Layout.Horizontal>
          </section>
          <RecommendationDiffViewer
            recommendedResources={{
              limits: {
                memory: getMemValueInReadableForm(
                  addBufferToValue(histogramData?.memoryHistogram.precomputed[memLimitVal], cpuAndMemoryValueBuffer)
                )
              },
              requests: {
                memory: getMemValueInReadableForm(
                  addBufferToValue(histogramData?.memoryHistogram.precomputed[memReqVal], cpuAndMemoryValueBuffer)
                ),
                cpu: getCPUValueInReadableForm(
                  addBufferToValue(histogramData?.cpuHistogram.precomputed[cpuReqVal], cpuAndMemoryValueBuffer)
                )
              }
            }}
            currentResources={currentResources}
            qualityOfService={qualityOfService}
          />
        </section>
        <Container className={css.timeframeContainer}>
          <Layout.Horizontal
            background={Color.GREY_100}
            padding="xsmall"
            style={{
              alignItems: 'baseline',
              justifyContent: 'center'
            }}
            spacing="xsmall"
          >
            <Text color={Color.GREY_700} font={{ variation: FontVariation.TABLE_HEADERS }}>
              {selectedRecommendation === RecommendationType.CostOptimized
                ? getString('ce.recommendation.detailsPage.costOptimizedCaps')
                : getString('ce.recommendation.detailsPage.performanceOptimizedCaps')}
            </Text>
            <Popover
              interactionKind={PopoverInteractionKind.HOVER}
              position={Position.BOTTOM_LEFT}
              usePortal={false}
              modifiers={{
                arrow: { enabled: false },
                flip: { enabled: true },
                keepTogether: { enabled: true },
                preventOverflow: { enabled: true }
              }}
              content={
                <Container padding="medium" className={css.histogram}>
                  <Layout.Horizontal spacing="medium">
                    <img width="235" src={histogramImg} />
                    <Text>{getString('ce.recommendation.detailsPage.histogramTextDetails1')}</Text>
                  </Layout.Horizontal>
                  <Text padding={{ top: 'small' }}>
                    {getString('ce.recommendation.detailsPage.histogramTextDetails2')}
                  </Text>
                </Container>
              }
            >
              <Text
                color={Color.PRIMARY_5}
                className={css.actionText}
                font={{ variation: FontVariation.TABLE_HEADERS }}
              >
                {getString('ce.recommendation.detailsPage.histogramText')}
              </Text>
            </Popover>
            <Text color={Color.GREY_700} font={{ variation: FontVariation.TABLE_HEADERS, align: 'center' }}>
              {getString('ce.recommendation.detailsPage.timeChangeText')}
            </Text>
            <Text color={Color.GREY_700} font={{ variation: FontVariation.TABLE_HEADERS }} className={css.actionText}>
              {timeRange?.label}
            </Text>
          </Layout.Horizontal>
        </Container>
        <Container className={css.histogramContainer}>
          <RecommendationHistogram
            reRenderChart={reRenderChart}
            updateMemoryChart={updateMemoryChart}
            updateCPUChart={updateCPUChart}
            histogramData={histogramData}
            selectedRecommendation={selectedRecommendation}
            cpuReqVal={cpuReqVal}
            memReqVal={memReqVal}
            memLimitVal={memLimitVal}
            onCPUChartLoad={setCPUChartRef}
            onMemoryChartLoad={setMemoryChartRef}
          />
        </Container>
        <Container className={css.legendContainer}>
          <Container>
            {isPerfOptimizedCustomized || isCostOptimizedCustomized ? (
              <Button
                onClick={() => {
                  resetToDefaultRecommendation(selectedRecommendation)
                }}
                icon="reset-icon"
                withoutBoxShadow={true}
                intent="none"
                className={css.resetButton}
              >
                {getString('ce.recommendation.detailsPage.resetRecommendationText', {
                  recommendationType: selectedRecommendation
                })}
              </Button>
            ) : null}
          </Container>
          <img src={requestLegend} />
          <Text color={Color.GREY_500} font={{ variation: FontVariation.TINY_SEMI }}>
            {getString('ce.recommendation.detailsPage.reqPercentileLegendText')}
          </Text>
          <img src={limitLegend} />
          <Text color={Color.GREY_500} font={{ variation: FontVariation.TINY_SEMI }}>
            {getString('ce.recommendation.detailsPage.limitPercentileLegendText')}
          </Text>
        </Container>
      </Container>
    </Container>
  )
}

export default RecommendationDetails
