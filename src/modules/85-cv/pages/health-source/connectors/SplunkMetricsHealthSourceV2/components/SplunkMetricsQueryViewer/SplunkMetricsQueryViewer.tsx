/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Utils } from '@wings-software/uicore'
import React, { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapSplunkToServiceFieldNames } from '@cv/pages/health-source/connectors/SplunkHealthSource/components/MapQueriesToHarnessService/constants'
import { useGetSplunkMetricSampleData } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { QueryViewer } from '@cv/components/QueryViewer/QueryViewer'
import type { MapQueriesToHarnessServiceLayoutProps } from './SplunkMetricsQueryViewer.types'
import css from './SplunkMetricsQueryViewer.module.scss'

export default function SplunkMetricsQueryViewer(props: MapQueriesToHarnessServiceLayoutProps): JSX.Element {
  const { formikProps, connectorIdentifier, onChange } = props
  const [isQueryExecuted, setIsQueryExecuted] = useState(false)
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const values = formikProps?.values

  const query = useMemo(() => (values?.query?.length ? values.query : ''), [values])
  const queryParams = useMemo(
    () => ({
      accountId,
      projectIdentifier,
      orgIdentifier,
      tracingId: Utils.randomId(),
      connectorIdentifier: connectorIdentifier as string
    }),
    [accountId, projectIdentifier, orgIdentifier, connectorIdentifier]
  )

  const { data: splunkData, loading, refetch, error } = useGetSplunkMetricSampleData({ lazy: true })

  const fetchSplunkRecords = useCallback(async () => {
    await refetch({
      queryParams: {
        accountId,
        orgIdentifier,
        projectIdentifier,
        connectorIdentifier,
        requestGuid: queryParams?.tracingId,
        query
      }
    })
    setIsQueryExecuted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const postFetchingRecords = useCallback(() => {
    // resetting values of service once fetch records button is clicked.
    onChange(MapSplunkToServiceFieldNames.SERVICE_INSTANCE, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    onChange(MapSplunkToServiceFieldNames.IS_STALE_RECORD, false)
  }, [])

  const staleRecordsWarningMessage = useMemo(
    () => (values?.isStaleRecord ? getString('cv.monitoringSources.splunk.staleRecordsWarning') : ''),
    [values?.isStaleRecord]
  )

  return (
    <div className={css.queryViewContainer}>
      <QueryViewer
        isQueryExecuted={isQueryExecuted}
        className={css.validationContainer}
        records={splunkData?.resource}
        fetchRecords={fetchSplunkRecords}
        postFetchingRecords={postFetchingRecords}
        loading={loading}
        error={error}
        query={query}
        queryNotExecutedMessage={getString('cv.monitoringSources.splunk.submitQueryToSeeRecords')}
        queryTextAreaProps={{
          onChangeCapture: () => {
            onChange(MapSplunkToServiceFieldNames.IS_STALE_RECORD, true)
          }
        }}
        staleRecordsWarning={staleRecordsWarningMessage}
        dataTooltipId={'splunkQuery'}
      />
    </div>
  )
}
