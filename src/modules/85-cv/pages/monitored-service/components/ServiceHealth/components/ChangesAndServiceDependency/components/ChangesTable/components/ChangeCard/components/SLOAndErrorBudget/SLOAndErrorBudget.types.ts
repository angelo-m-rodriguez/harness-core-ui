/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ChangeEventDTO, MonitoredServiceChangeDetailSLO } from 'services/cv'

export interface SLOAndErrorBudgetProps {
  monitoredServiceIdentifier: string
  startTime: number
  endTime: number
  eventTime?: number
  eventType: ChangeEventDTO['type']
}

export enum SLOCardToggleViews {
  SLO = 'SLO',
  ERROR_BUDGET = 'ERROR_BUDGET'
}

export interface SLOTargetChartWrapperProps {
  type: SLOCardToggleViews
  selectedSLO: MonitoredServiceChangeDetailSLO
  startTime: number
  endTime: number
  eventTime?: number
  eventType: ChangeEventDTO['type']
}
