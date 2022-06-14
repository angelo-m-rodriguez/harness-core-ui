/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { SelectOption, Select } from '@wings-software/uicore'
import { DashboardTimeRange, useLandingDashboardContext } from '@common/factories/LandingDashboardContext'
import { useStrings } from 'framework/strings'

interface TimeRangeSelectProps {
  className?: string
}

const TimeRangeSelect: React.FC<TimeRangeSelectProps> = props => {
  const { selectTimeRange, selectedTimeRange } = useLandingDashboardContext()
  const { getString } = useStrings()

  const options: SelectOption[] = [
    { label: getString('projectsOrgs.landingDashboard.last30Days'), value: DashboardTimeRange['30Days'] },
    { label: getString('projectsOrgs.landingDashboard.last60Days'), value: DashboardTimeRange['60Days'] },
    { label: getString('projectsOrgs.landingDashboard.last90Days'), value: DashboardTimeRange['90Days'] },
    { label: getString('projectsOrgs.landingDashboard.last1Year'), value: DashboardTimeRange['1Year'] }
  ]

  const defaultTime = options.filter(i => i.value === selectedTimeRange)
  return (
    <Select
      items={options}
      onChange={option => {
        selectTimeRange(option.value as DashboardTimeRange)
      }}
      className={props.className}
      defaultSelectedItem={defaultTime.length ? defaultTime[0] : options[0]}
    />
  )
}

export default TimeRangeSelect
