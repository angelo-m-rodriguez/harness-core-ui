import React, { ReactElement } from 'react'
import { isNull, isNumber } from 'lodash-es'
import Highcharts, { PointOptionsObject } from 'highcharts'
import { Text, Layout, Color, Tag, FontVariation } from '@wings-software/uicore'
import HighchartsReact from 'highcharts-react-official'
import type { Renderer, CellProps } from 'react-table'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type {
  ChangeSummaryDTO,
  MonitoredServiceListItemDTO,
  RiskData,
  PageMonitoredServiceListItemDTO
} from 'services/cv'
import { getRiskColorValue, getRiskLabelStringId } from '@cv/utils/CommonUtils'
import ImageDeleteService from '@cv/assets/delete-service.svg'
import type { FilterCardItem } from '@cv/components/FilterCard/FilterCard.types'
import type { FilterEnvInterface, RiskTagWithLabelProps } from './CVMonitoredService.types'
import { HistoricalTrendChartOption, DefaultChangePercentage } from './CVMonitoredService.constants'
import css from './CVMonitoredService.module.scss'

export const getFilterAndEnvironmentValue = (environment: string, searchTerm: string): FilterEnvInterface => {
  const filter: FilterEnvInterface = {}
  if (environment && environment !== 'All') {
    filter['environmentIdentifier'] = environment
  }
  if (searchTerm) {
    filter['searchTerm'] = searchTerm
  }
  return filter
}

export const createTrendDataWithZone = (trendData: RiskData[]): Highcharts.SeriesLineOptions => {
  const highchartsLineData: PointOptionsObject[] = []
  let currentRiskColor: string | null = getRiskColorValue(trendData?.[0].riskStatus)
  const zones: Highcharts.SeriesZonesOptionsObject[] = [{ value: undefined, color: currentRiskColor }]

  trendData.forEach((dataPoint, index) => {
    const { riskStatus } = dataPoint || {}
    let { healthScore } = dataPoint || {}
    if (isNull(healthScore)) {
      healthScore = -2
    }
    const riskColor = getRiskColorValue(riskStatus)
    highchartsLineData.push({ x: index, y: healthScore })
    if (isNumber(healthScore) && riskStatus) {
      if (riskColor !== currentRiskColor) {
        zones[zones.length - 1].value = index
        zones.push({ value: undefined, color: riskColor })
        currentRiskColor = riskColor
      }
    } else {
      currentRiskColor = null
    }
  })

  return {
    data: highchartsLineData,
    zones,
    name: '',
    type: 'line',
    zoneAxis: 'x',
    clip: false
  }
}

export const getHistoricalTrendChartOption = (trendData: RiskData[]): Highcharts.Options => {
  return {
    ...HistoricalTrendChartOption,
    series: [
      {
        ...createTrendDataWithZone(trendData)
      }
    ]
  }
}

export const ServiceHealthTrend = ({ healthScores }: { healthScores?: RiskData[] }): JSX.Element => {
  if (!healthScores) {
    return <></>
  }

  return <HighchartsReact highcharts={Highcharts} options={getHistoricalTrendChartOption(healthScores)} />
}

export const RenderHealthTrend: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const healthScores = row.original.historicalTrend?.healthScores

  return <ServiceHealthTrend healthScores={healthScores} />
}

export const RiskTagWithLabel = ({ riskData, labelVariation, color, label }: RiskTagWithLabelProps): ReactElement => {
  const { getString } = useStrings()
  const { riskStatus, healthScore } = riskData ?? {}

  return (
    <Layout.Horizontal className={css.healthScoreCardContainer} spacing="small">
      <Tag className={css.healthScoreCard} style={{ backgroundColor: getRiskColorValue(riskStatus) }}>
        {healthScore}
      </Tag>
      <Text color={color ?? Color.BLACK} font={{ variation: labelVariation ?? FontVariation.BODY }}>
        {label ?? getString(getRiskLabelStringId(riskStatus))}
      </Text>
    </Layout.Horizontal>
  )
}

export const RenderHealthScore: Renderer<CellProps<MonitoredServiceListItemDTO>> = ({ row }) => {
  const monitoredService = row.original

  if (!monitoredService.healthMonitoringEnabled) {
    return <></>
  }

  return <RiskTagWithLabel riskData={monitoredService.currentHealthScore} />
}

export const calculateChangePercentage = (changeSummary: ChangeSummaryDTO): { color: string; percentage: number } => {
  if (changeSummary?.categoryCountMap) {
    const { categoryCountMap } = changeSummary
    const { Infrastructure, Deployment, Alert } = categoryCountMap as any
    const totalCount = Infrastructure?.count + Deployment?.count + Alert?.count
    const totalCountInPrecedingWindow =
      Infrastructure?.countInPrecedingWindow + Deployment?.countInPrecedingWindow + Alert?.countInPrecedingWindow
    const percentageChange: number =
      ((totalCount - totalCountInPrecedingWindow) / (totalCount + totalCountInPrecedingWindow)) * 100
    if (isNaN(totalCount) || isNaN(totalCountInPrecedingWindow) || isNaN(percentageChange)) {
      return DefaultChangePercentage
    }
    return {
      color: percentageChange > 0 ? Color.SUCCESS : Color.ERROR,
      percentage: Math.abs(Math.floor(percentageChange))
    }
  }
  return DefaultChangePercentage
}

export const ServiceDeleteContext = ({ serviceName }: { serviceName?: string }): ReactElement => {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Text color={Color.GREY_800}>
        {getString('cv.monitoredServices.deleteMonitoredServiceWarning', { name: serviceName })}
      </Text>
      <div>
        <img src={ImageDeleteService} width="204px" height="202px" />
      </div>
    </Layout.Horizontal>
  )
}

export const getMonitoredServiceFilterOptions = (
  getString: UseStringsReturn['getString'],
  monitoredServiceListData?: PageMonitoredServiceListItemDTO
): FilterCardItem[] => {
  return [
    {
      title: getString('cv.allServices'),
      icon: 'services',
      iconSize: 18,
      count: monitoredServiceListData?.totalItems ?? 0
    }
  ]
}
