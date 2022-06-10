/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react-hooks/exhaustive-deps */
import {
  Button,
  ButtonVariation,
  Container,
  Text,
  MultiSelectDropDown,
  MultiSelectOption,
  Select,
  SelectOption
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { Column } from 'react-table'
import moment from 'moment'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import {
  useGetHarnessEnvironments,
  useGetHarnessServices
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { useStrings } from 'framework/strings'
import type { TimeRangeParams } from 'services/cv'
import { getStartAndEndTime } from '@cv/components/ChangeTimeline/ChangeTimeline.utils'
import { TimeLine } from '@cv/components/Timeline/TimeLine'
import type { StringsMap } from 'stringTypes'
import { prepareFilterInfo } from '@cv/utils/CommonUtils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import {
  ChangeSourceCategoryName,
  ChangeSourceTypes
} from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { ChangeSourceConnectorOptions } from '../ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import type { CardSelectOption } from '../ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.types'
import { getChangeSourceOptions } from '../ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.utils'
import { HorizontalLayout } from '../health-source/common/StyledComponents'
import { TimePeriodEnum } from '../monitored-service/components/ServiceHealth/ServiceHealth.constants'
import { getTimePeriods } from '../monitored-service/components/ServiceHealth/ServiceHealth.utils'
import { ChangesHeader, ChangeTimeLineHeader, PBody } from './changes.styled'
import ChangesTable from '../monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/ChangesTable'
import {
  renderChangeType,
  renderImpact,
  renderName,
  renderTime,
  renderType
} from '../monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/ChangesTable.utils'
import css from './CVChanges.module.scss'

export const CVChanges = ({ updateTime }: { updateTime?: Date }): JSX.Element => {
  const { serviceOptions } = useGetHarnessServices()
  const { environmentOptions } = useGetHarnessEnvironments()
  const { getString } = useStrings()

  useDocumentTitle([getString('cv.srmTitle'), getString('changes')])

  const sourceTypes = useMemo(() => {
    return getChangeSourceOptions(getString).map((changeSourceOption: SelectOption) => {
      if (changeSourceOption?.value === ChangeSourceCategoryName.ALERT) {
        return { label: ChangeSourceCategoryName.INCIDENTS, value: ChangeSourceCategoryName.ALERT }
      }
      return changeSourceOption
    })
  }, [])
  const connectorOptions = useMemo(() => {
    return ChangeSourceConnectorOptions.map((option: CardSelectOption) => ({
      label: getString(option.label as keyof StringsMap),
      value: option.value
    }))
  }, [])
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<SelectOption>({
    value: TimePeriodEnum.TWENTY_FOUR_HOURS,
    label: getString('cv.monitoredServices.serviceHealth.last24Hrs')
  })
  const [selectedServices, setSelectedServices] = useState<MultiSelectOption[]>()
  const [selectedEnvs, setSelectedEnvs] = useState<MultiSelectOption[]>()
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<MultiSelectOption[]>()
  const [selectedSources, setSelectedSources] = useState<MultiSelectOption[]>()
  const [timestamps, setTimestamps] = useState<number[]>([])
  const [timeRange, setTimeRange] = useState<TimeRangeParams>()
  const [showTimelineSlider, setShowTimelineSlider] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>()

  const getStartTime = useMemo(() => {
    return getStartAndEndTime((selectedTimePeriod?.value as string) || '').startTimeRoundedOffToNearest30min
  }, [selectedTimePeriod, serviceOptions, environmentOptions, sourceTypes, connectorOptions])

  const getEndTime = useMemo(() => {
    return getStartAndEndTime((selectedTimePeriod?.value as string) || '').endTimeRoundedOffToNearest30min
  }, [selectedTimePeriod, serviceOptions, environmentOptions, sourceTypes, connectorOptions])

  const clearFilter = () => {
    setSelectedTimePeriod({
      value: TimePeriodEnum.TWENTY_FOUR_HOURS,
      label: getString('cv.monitoredServices.serviceHealth.last24Hrs')
    })
    setSelectedEnvs([])
    setSelectedServices([])
    setSelectedChangeTypes([])
    setSelectedSources([])
  }
  useEffect(() => {
    setLastUpdated(updateTime || new Date())
  }, [selectedServices, selectedEnvs, selectedChangeTypes, selectedSources, selectedTimePeriod])
  const getFilteredText = useCallback(
    (selectedOptions: MultiSelectOption[] = [], filterText = ' '): string => {
      const baseText = getString(filterText as keyof StringsMap)
      return selectedOptions?.length > 0 ? baseText : baseText + `: ${getString('all')}`
    },
    [selectedServices, selectedEnvs, selectedChangeTypes, selectedSources, selectedTimePeriod]
  )
  const columns: Column<any>[] = useMemo(
    () => [
      {
        Header: getString('timeLabel'),
        Cell: renderTime,
        accessor: 'eventTime',
        width: '15%'
      },
      {
        Header: getString('description'),
        Cell: renderName,
        accessor: 'name',
        width: '30%'
      },
      {
        Header: getString('connectors.cdng.monitoredService.label' as keyof StringsMap),
        Cell: renderImpact,
        accessor: 'serviceIdentifier',
        width: '25%'
      },
      {
        Header: getString('typeLabel'),
        width: '15%',
        accessor: 'category',
        Cell: renderChangeType
      },
      {
        Header: getString('source'),
        Cell: renderType,
        accessor: 'type',
        width: '15%'
      }
    ],
    []
  )

  const queryParams = useMemo(
    () => ({
      serviceIdentifier: ((prepareFilterInfo(selectedServices).length > 0 && prepareFilterInfo(selectedServices)) ||
        prepareFilterInfo(serviceOptions)) as string[],
      environmentIdentifier: ((prepareFilterInfo(selectedEnvs).length > 0 && prepareFilterInfo(selectedEnvs)) ||
        prepareFilterInfo(environmentOptions)) as string[],
      changeSourceTypes: ((prepareFilterInfo(selectedSources).length > 0 && prepareFilterInfo(selectedSources)) ||
        prepareFilterInfo(connectorOptions)) as ChangeSourceTypes[],
      changeCategories: ((prepareFilterInfo(selectedChangeTypes).length > 0 &&
        prepareFilterInfo(selectedChangeTypes)) ||
        prepareFilterInfo(sourceTypes)) as ('Infrastructure' | 'Deployment' | 'Alert')[]
    }),
    [
      selectedServices,
      serviceOptions,
      selectedEnvs,
      environmentOptions,
      connectorOptions,
      selectedSources,
      selectedChangeTypes,
      sourceTypes
    ]
  )
  return (
    <>
      <ChangesHeader height={'80px'}>
        <HorizontalLayout alignItem={'flex-end'}>
          <NGBreadcrumbs />
        </HorizontalLayout>
        <Text font={{ variation: FontVariation.H4 }} tooltipProps={{ dataTooltipId: 'changesDashboardTitle' }}>
          {getString('changes')}
        </Text>
      </ChangesHeader>
      <ChangeTimeLineHeader>
        <Container className={css.serviceHealthCard} flex style={{ justifyContent: 'flex-start' }}>
          <Select
            name={'timePeriod'}
            value={selectedTimePeriod}
            items={getTimePeriods(getString)}
            className={css.timePeriods}
            onChange={setSelectedTimePeriod}
          />

          <MultiSelectDropDown
            placeholder={getFilteredText(selectedServices, 'services')}
            value={selectedServices}
            items={serviceOptions}
            className={css.timePeriods}
            onChange={setSelectedServices}
            buttonTestId={'serviceFilter'}
          />

          <MultiSelectDropDown
            placeholder={getFilteredText(selectedEnvs, 'environments')}
            value={selectedEnvs}
            items={environmentOptions}
            className={css.timePeriods}
            onChange={setSelectedEnvs}
            buttonTestId={'envFilter'}
          />
          <MultiSelectDropDown
            placeholder={getFilteredText(selectedChangeTypes, 'cv.cvChanges.changeTypeFilterDefault')}
            value={selectedChangeTypes}
            items={sourceTypes}
            className={css.timePeriods}
            onChange={setSelectedChangeTypes}
            buttonTestId={'changeTypeFilter'}
          />

          <MultiSelectDropDown
            placeholder={getFilteredText(selectedSources, 'cv.cvChanges.sourceFilterDefault')}
            value={selectedSources}
            items={connectorOptions}
            className={css.timePeriods}
            onChange={setSelectedSources}
            buttonTestId={'sourceFilter'}
          />
          <Button
            variation={ButtonVariation.LINK}
            onClick={clearFilter}
            text={getString('cv.cvChanges.clearFilters')}
          />
        </Container>
      </ChangeTimeLineHeader>
      <PBody>
        <HorizontalLayout>
          <Text tooltipProps={{ dataTooltipId: 'changesTimeline' }} className={css.timelineText}>
            {getString('cv.cvChanges.changesTimeline')}
          </Text>
          <Text className={css.timelineText}>{`${getString('lastUpdated')}: ${moment(lastUpdated).format(
            'lll'
          )}`}</Text>
        </HorizontalLayout>
        <Container>
          <TimeLine
            {...queryParams}
            selectedTimePeriod={selectedTimePeriod}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            timestamps={timestamps}
            setTimestamps={setTimestamps}
            showTimelineSlider={showTimelineSlider}
            setShowTimelineSlider={setShowTimelineSlider}
            isOptionalHealthSource={true}
            resetFilter={lastUpdated}
          />
        </Container>
        <Container>
          <ChangesTable
            startTime={showTimelineSlider ? (timeRange?.startTime as number) : getStartTime}
            endTime={showTimelineSlider ? (timeRange?.endTime as number) : getEndTime}
            hasChangeSource
            {...queryParams}
            recordsPerPage={25}
            customCols={columns}
            dataTooltipId={'CVChangesTable'}
          />
        </Container>
      </PBody>
    </>
  )
}
