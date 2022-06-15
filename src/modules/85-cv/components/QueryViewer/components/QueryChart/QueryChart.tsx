import React, { useEffect, useMemo, useState } from 'react'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { IDrawerProps, Position, Drawer } from '@blueprintjs/core'
import cx from 'classnames'
import { Container, Text, Utils, useConfirmationDialog } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { ResponseListPrometheusSampleData, useGetSampleData } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { Records } from '@cv/components/Records/Records'
import { QueryContent } from '@cv/components/QueryViewer/QueryViewer'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { transformPrometheusSampleData, createPrometheusQuery } from './PrometheusQueryViewer.utils'
import {
  MapPrometheusQueryToService,
  PrometheusMonitoringSourceFieldNames
} from '../../PrometheusHealthSource.constants'
import css from './PrometheusQueryViewer.module.scss'

export function ChartAndRecords(props: ChartAndRecordsProps): JSX.Element {
  const { query, error, loading, data, onChange, isQueryExecuted, fetchData } = props
  const { getString } = useStrings()

  const { options: highchartsOptions, records } = useMemo(() => {
    onChange(PrometheusMonitoringSourceFieldNames.RECORD_COUNT, data?.data?.length)
    return transformPrometheusSampleData(data?.data)
  }, [data])
  if (!error && !loading && records?.length) {
    return (
      <>
        <Container className={css.chart}>
          {query?.length ? <HighchartsReact highcharts={Highcharts} options={highchartsOptions} /> : null}
        </Container>
      </>
    )
  }
  return null
}
