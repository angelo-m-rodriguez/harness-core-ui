/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

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
} from '../../SplunkMetricsHealthSource.constants'
import css from './PrometheusQueryViewer.module.scss'

export interface PrometheusQueryViewerProps {
  values?: MapPrometheusQueryToService
  className?: string
  connectorIdentifier?: string
  onChange: (fieldName: string, value: any) => void
}

interface ChartAndRecordsProps {
  query?: string
  error?: string | null
  loading?: boolean
  data?: ResponseListPrometheusSampleData | null
  isQueryExecuted?: boolean
  fetchData: () => void
  onChange: PrometheusQueryViewerProps['onChange']
}

const DrawerProps: IDrawerProps = {
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: true,
  enforceFocus: true,
  isOpen: false,
  hasBackdrop: true,
  position: Position.RIGHT,
  usePortal: true,
  size: '50%'
}

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
        <Records
          fetchRecords={fetchData}
          loading={loading}
          data={!query?.length ? null : records}
          error={error}
          query={query}
          isQueryExecuted={isQueryExecuted}
          queryNotExecutedMessage={getString('cv.monitoringSources.prometheus.submitQueryToSeeRecords')}
        />
      </>
    )
  }
  return (
    <Records
      fetchRecords={fetchData}
      loading={loading}
      data={records}
      error={error}
      query={query}
      isQueryExecuted={isQueryExecuted}
      queryNotExecutedMessage={getString('cv.monitoringSources.prometheus.submitQueryToSeeRecords') as string}
    />
  )
}

export function PrometheusQueryViewer(props: PrometheusQueryViewerProps): JSX.Element {
  const { values, className, connectorIdentifier, onChange } = props
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const [isQueryExecuted, setIsQueryExecuted] = useState(false)
  const query = useMemo(() => {
    if (values?.isManualQuery) {
      return values.query?.length ? values.query : ''
    }
    return createPrometheusQuery(values)
  }, [
    values?.isManualQuery,
    values?.envFilter,
    values?.serviceFilter,
    values?.additionalFilter,
    values?.aggregator,
    values?.query,
    values?.prometheusMetric
  ])
  const { data, refetch, cancel, error, loading } = useGetSampleData({ lazy: true })
  // useEffect(() => {
  //   if (!isManualQuery) {
  //     onChange(PrometheusMonitoringSourceFieldNames.QUERY, query)
  //   }
  // }, [query])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  // const { openDialog } = useConfirmationDialog({
  //   titleText: getString('cv.monitoringSources.prometheus.querySettingsNotEditable'),
  //   contentText: getString('cv.monitoringSources.prometheus.querySettingsSubtext'),
  //   confirmButtonText: getString('cv.proceedToEdit'),
  //   cancelButtonText: getString('cancel'),
  //   onCloseDialog: (proceed: boolean) => {
  //     if (proceed) onChange(PrometheusMonitoringSourceFieldNames.IS_MANUAL_QUERY, true)
  //   }
  // })

  let content = (
    <>
      <QueryContent
        handleFetchRecords={async () => {
          cancel()
          await refetch({
            queryParams: {
              accountId,
              projectIdentifier,
              orgIdentifier,
              query: query || '',
              tracingId: Utils.randomId(),
              connectorIdentifier: connectorIdentifier as string
            }
          })
          if (!isQueryExecuted) {
            setIsQueryExecuted(true)
          }
        }}
        query={query}
        loading={loading}
        textAreaName={PrometheusMonitoringSourceFieldNames.QUERY}
        onClickExpand={setIsDrawerOpen}
        isDialogOpen={isDrawerOpen}
        mandatoryFields={[values?.prometheusMetric]}
        isAutoFetch={false}
      />
      <ChartAndRecords
        fetchData={async () =>
          refetch({
            queryParams: {
              accountId,
              projectIdentifier,
              orgIdentifier,
              query: query || '',
              tracingId: Utils.randomId(),
              connectorIdentifier: connectorIdentifier as string
            }
          })
        }
        query={query}
        isQueryExecuted={isQueryExecuted}
        onChange={onChange}
        data={data}
        error={getErrorMessage(error)}
        loading={loading}
      />
    </>
  )

  if (isDrawerOpen) {
    content = (
      <Drawer {...DrawerProps} isOpen={true} onClose={() => setIsDrawerOpen(false)} className={css.queryViewDialog}>
        {content}
      </Drawer>
    )
  }

  return (
    <Container className={cx(css.main, className)}>
      <Text className={css.labelText}>{getString('cv.query')}</Text>
      {content}
    </Container>
  )
}
