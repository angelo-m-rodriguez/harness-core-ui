/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Reducer, useCallback } from 'react'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import { GroupedVirtuosoHandle, Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Button, ButtonSize, ButtonVariation, Color, Container, Layout, SelectOption, Text } from '@harness/uicore'
import { useStrings, String as StrTemplate } from 'framework/strings'

import LogContentHeader from '../LogContentHeader/LogContentHeader'
import LogContentToolbar from '../LogContentToolbar/LogContentToolbar'
import ExecutionLogSearch from './ExecutionLogSearch'
import { reducer, useActionCreator } from './ExecutionLogState'
import { defaultReducerState } from './ExecutionLog.constants'
import { isPositiveNumber, isTimeRangeChanged } from '../../useLogContentHook.utils'
import { ExecutionAndAPICallLogProps, LogTypes, TimeRange } from '../../useLogContentHook.types'
import { MultiLogLine } from '../MultiLogLine/MultiLogLine'
import { convertLogDataToLogLineData } from './ExecutionLog.utils'
import type { State, Action, ActionType } from './ExecutionLog.types'
import css from './ExecutionLog.module.scss'

const ExecutionLog: React.FC<ExecutionAndAPICallLogProps> = ({
  isFullScreen,
  setIsFullScreen,
  verifyStepExecutionId,
  monitoredServiceIdentifier,
  serviceName,
  envName,
  resource,
  loading,
  errorMessage,
  refetchLogs,
  healthSource,
  setHealthSource,
  timeRange,
  setTimeRange,
  errorLogsOnly,
  setErrorLogsOnly,
  pageNumber,
  setPageNumber,
  handleDownloadLogs,
  showTimelineSlider
}) => {
  const { getString } = useStrings()
  const [state, dispatch] = React.useReducer<Reducer<State, Action<ActionType>>>(reducer, defaultReducerState)
  const actions = useActionCreator(dispatch)

  const [isAtBottom, setIsAtBottom] = React.useState(false)
  const virtuosoRef = React.useRef<null | GroupedVirtuosoHandle | VirtuosoHandle>(null)
  const { currentIndex, linesWithResults } = state.searchData
  const length = state.data.length

  const { content, totalPages = 0 } = defaultTo(resource, {})

  const isMonitoredService = Boolean(monitoredServiceIdentifier)

  React.useEffect(() => {
    /* istanbul ignore else */ if (content?.length) {
      actions.setExecutionLogs(content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  React.useEffect(() => {
    const index = linesWithResults[currentIndex]

    /* istanbul ignore next */
    if (virtuosoRef.current && isPositiveNumber(index)) {
      virtuosoRef.current.scrollToIndex(index)
    }
  }, [currentIndex, linesWithResults])

  const handleHealthSource = useCallback(
    (_healthSource: SelectOption): void => {
      if (_healthSource.value !== healthSource?.value) {
        actions.resetExecutionLogs()
        setPageNumber(0)
        setHealthSource?.(_healthSource)
      }
    },
    [healthSource, actions, setPageNumber, setHealthSource]
  )

  const handleTimeRange = (newTimeRange: TimeRange): void => {
    if (isTimeRangeChanged(newTimeRange, timeRange)) {
      actions.resetExecutionLogs()
      setPageNumber(0)
      setTimeRange?.(newTimeRange)
    }
  }

  const handleDisplayOnlyErrors = (_errorLogsOnly: boolean): void => {
    actions.resetExecutionLogs()
    setPageNumber(0)
    setErrorLogsOnly(_errorLogsOnly)
  }

  const handleClick = (): void => {
    const handle = virtuosoRef.current
    /* istanbul ignore else */ if (handle) {
      handle.scrollToIndex(isAtBottom ? 0 : length)
    }
  }

  return (
    <div>
      <LogContentHeader
        logType={LogTypes.ExecutionLog}
        verifyStepExecutionId={verifyStepExecutionId}
        monitoredServiceIdentifier={monitoredServiceIdentifier}
        serviceName={serviceName}
        envName={envName}
        healthSource={healthSource}
        handleHealthSource={handleHealthSource}
        timeRange={timeRange}
        handleTimeRange={handleTimeRange}
        errorLogsOnly={errorLogsOnly}
        handleDisplayOnlyErrors={handleDisplayOnlyErrors}
      />
      <LogContentToolbar
        logType={LogTypes.ExecutionLog}
        data={state.data.map(log => log.text)}
        searchInput={<ExecutionLogSearch state={state} actions={actions} />}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isVerifyStep={Boolean(verifyStepExecutionId)}
        timeRange={timeRange}
        isMonitoredService={isMonitoredService}
        handleDownloadLogs={handleDownloadLogs}
      />
      <div className={cx(css.main, { [css.fullScreen]: isFullScreen })}>
        <pre className={css.container}>
          {length > 0 && (
            <Virtuoso
              height="100%"
              overscan={50}
              ref={virtuosoRef}
              atBottomThreshold={Math.ceil(length / 3)}
              atBottomStateChange={setIsAtBottom}
              totalCount={length}
              followOutput={/* istanbul ignore next */ _ => 'smooth'}
              itemContent={index => (
                <MultiLogLine
                  {...convertLogDataToLogLineData(state.data[index])}
                  limit={length}
                  lineNumber={index}
                  searchText={state.searchData.text}
                  currentSearchIndex={currentIndex}
                  isFullScreen={isFullScreen}
                />
              )}
            />
          )}
          {!length && !loading && !errorMessage && (
            <StrTemplate
              tagName="div"
              className={css.noLogs}
              stringID={
                isMonitoredService && !showTimelineSlider
                  ? 'cv.monitoredServices.noAvailableLogData'
                  : 'common.logs.noLogsText'
              }
            />
          )}
        </pre>

        <div className={css.footer}>
          <Container flex>
            <Container width="80%">
              {loading && <StrTemplate tagName="div" className={css.text} stringID="loading" />}
              {!loading && errorMessage && (
                <Layout.Horizontal spacing="small">
                  <Text lineClamp={1} color={Color.RED_500} className={css.text}>
                    {errorMessage}
                  </Text>
                  <a className={css.buttonLink} onClick={() => refetchLogs()}>
                    {getString('retry')}
                  </a>
                </Layout.Horizontal>
              )}
            </Container>
            {length > 0 && (
              <div>
                {pageNumber !== totalPages - 1 && (
                  <Button
                    text={getString('pipeline.verification.loadMore')}
                    icon="down"
                    className={css.button}
                    size={ButtonSize.SMALL}
                    margin={{ right: 'small' }}
                    variation={ButtonVariation.PRIMARY}
                    disabled={!!errorMessage}
                    onClick={() => setPageNumber(_prevPageNumber => _prevPageNumber + 1)}
                  />
                )}
                <Button
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.PRIMARY}
                  text={getString(isAtBottom ? 'cv.top' : 'cv.bottom')}
                  icon={isAtBottom ? 'arrow-up' : 'arrow-down'}
                  iconProps={{ size: 10 }}
                  onClick={handleClick}
                  className={css.button}
                />
              </div>
            )}
          </Container>
        </div>
      </div>
    </div>
  )
}

export default ExecutionLog
