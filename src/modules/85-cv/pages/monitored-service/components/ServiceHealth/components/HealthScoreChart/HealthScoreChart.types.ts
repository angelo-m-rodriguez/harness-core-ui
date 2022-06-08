/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ColumnChartProps } from '@cv/components/ColumnChart/ColumnChart.types'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { RiskData } from 'services/cv'
export interface HealthScoreChartProps {
  monitoredServiceIdentifier: string
  duration: SelectOption
  setHealthScoreData?: (healthScoreData: RiskData[]) => void
  timeFormat?: string
  endTime?: number
  columChartProps?: Pick<ColumnChartProps, 'columnHeight' | 'columnWidth' | 'timestampMarker'>
  hasTimelineIntegration?: boolean
  isChangeEventView?: boolean
}
