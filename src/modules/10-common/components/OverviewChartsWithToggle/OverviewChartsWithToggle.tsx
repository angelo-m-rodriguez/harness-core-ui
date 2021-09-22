import React, { useState } from 'react'
import { merge } from 'lodash-es'
import type { SeriesColumnOptions } from 'highcharts'
import { Button, Color, Container, Layout } from '@wings-software/uicore'
import cx from 'classnames'
import { TimeSeriesAreaChart } from '@common/components/TimeSeriesAreaChart/TimeSeriesAreaChart'
import { StackedColumnChart } from '@common/components/StackedColumnChart/StackedColumnChart'
import css from './OverviewChartsWithToggle.module.scss'

type DataType = Omit<SeriesColumnOptions, 'type'>[]

export enum ChartType {
  BAR = 'BAR',
  LINE = 'LINE'
}

export interface OverviewChartsWithToggleProps {
  defaultChartType?: ChartType
  customChartOptions?: Highcharts.Options
  data: DataType
  summaryCards?: JSX.Element
}

const renderChart = (selectedView: ChartType, props: OverviewChartsWithToggleProps): JSX.Element => {
  const customChartOptions = merge({ chart: { height: 200 } }, props.customChartOptions)

  return selectedView === ChartType.BAR ? (
    <StackedColumnChart options={customChartOptions} data={props.data}></StackedColumnChart>
  ) : (
    <TimeSeriesAreaChart customChartOptions={customChartOptions} seriesData={props?.data} />
  )
}

export const OverviewChartsWithToggle: React.FC<OverviewChartsWithToggleProps> = (
  props: OverviewChartsWithToggleProps
) => {
  const [selectedView, setSelectedView] = useState<ChartType>(props.defaultChartType || ChartType.BAR)

  return (
    <Layout.Vertical spacing="large">
      <Container flex>
        <Layout.Horizontal spacing={'medium'}>{props.summaryCards}</Layout.Horizontal>
        <Container flex className={css.toggleBtns}>
          <Button
            minimal
            icon="bar-chart"
            active={selectedView === ChartType.BAR}
            className={cx(css.chartIcon, { [css.active]: selectedView === ChartType.BAR })}
            iconProps={{ size: 12, color: selectedView === ChartType.BAR ? Color.PRIMARY_6 : Color.GREY_700 }}
            onClick={e => {
              e.stopPropagation()
              if (selectedView !== ChartType.BAR) {
                setSelectedView(ChartType.BAR)
              }
            }}
          />
          <Button
            minimal
            icon="line-chart"
            active={selectedView === ChartType.LINE}
            iconProps={{ size: 12, color: selectedView === ChartType.LINE ? Color.PRIMARY_6 : Color.GREY_700 }}
            className={cx(css.chartIcon, { [css.active]: selectedView === ChartType.LINE })}
            onClick={e => {
              e.stopPropagation()
              if (selectedView !== ChartType.LINE) {
                setSelectedView(ChartType.LINE)
              }
            }}
          />
        </Container>
      </Container>
      {renderChart(selectedView, props)}
    </Layout.Vertical>
  )
}
