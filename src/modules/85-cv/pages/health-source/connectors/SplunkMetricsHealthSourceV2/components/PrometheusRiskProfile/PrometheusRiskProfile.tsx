/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo } from 'react'
import { Classes } from '@blueprintjs/core'
import { Container, FormInput, SelectOption, Text } from '@wings-software/uicore'
import { useToaster } from '@common/exports'
import { useStrings } from 'framework/strings'
import type { useGetMetricPacks, useGetLabelNames } from 'services/cv'
import { ServiceInstanceLabel } from '@cv/pages/health-source/common/ServiceInstanceLabel/ServiceInstanceLabel'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { getRiskCategoryOptions } from '../../../GCOMetricsHealthSource/GCOMetricsHealthSource.utils'
import { PrometheusMonitoringSourceFieldNames } from '../../PrometheusHealthSource.constants'
import css from './PrometheusRiskProfile.module.scss'

interface PrometheusRiskProfileProps {
  metricPackResponse: ReturnType<typeof useGetMetricPacks>
  labelNamesResponse: ReturnType<typeof useGetLabelNames>
}

export function PrometheusRiskProfile(props: PrometheusRiskProfileProps): JSX.Element {
  const { metricPackResponse, labelNamesResponse } = props
  const { error, loading, data } = metricPackResponse
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const metricPackOptions = useMemo(() => getRiskCategoryOptions(data?.resource), [data])
  useEffect(() => {
    if (error) {
      clear()
      showError(getErrorMessage(error), 7000)
    }
  })

  const transformedLabelNames: SelectOption[] = useMemo(
    () => labelNamesResponse?.data?.data?.map(label => ({ label, value: label })) || [],
    [labelNamesResponse]
  )

  let metricPackContent: React.ReactNode = <Container />
  if (loading) {
    metricPackContent = (
      <Container>
        <Text className={css.groupLabel}>{getString('cv.monitoringSources.baselineDeviation')}</Text>
        {[1, 2, 3, 4].map(val => (
          <Container
            key={val}
            width={150}
            height={15}
            style={{ marginBottom: 'var(--spacing-small)' }}
            className={Classes.SKELETON}
          />
        ))}
      </Container>
    )
  } else if (metricPackOptions?.length) {
    metricPackContent = (
      <FormInput.RadioGroup
        label={getString('cv.monitoringSources.riskCategoryLabel')}
        name={PrometheusMonitoringSourceFieldNames.RISK_CATEGORY}
        items={metricPackOptions}
      />
    )
  }

  return (
    <Container className={css.main}>
      {metricPackContent}
      <Container className={css.checkBoxGroup}>
        <Text className={css.groupLabel}>{getString('cv.monitoringSources.baselineDeviation')}</Text>
        <FormInput.CheckBox
          label={getString('cv.monitoringSources.higherCounts')}
          name={PrometheusMonitoringSourceFieldNames.HIGHER_BASELINE_DEVIATION}
        />
        <FormInput.CheckBox
          label={getString('cv.monitoringSources.lowerCounts')}
          name={PrometheusMonitoringSourceFieldNames.LOWER_BASELINE_DEVIATION}
        />
      </Container>
      <FormInput.Select
        name={PrometheusMonitoringSourceFieldNames.SERVICE_INSTANCE}
        label={<ServiceInstanceLabel />}
        items={transformedLabelNames}
      />
    </Container>
  )
}
