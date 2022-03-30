/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Reducer } from 'react'
import cx from 'classnames'
import { GroupedVirtuosoHandle, Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Button, ButtonSize, ButtonVariation, Color, Container, Layout, Text } from '@harness/uicore'
import { useStrings, String as StrTemplate } from 'framework/strings'
import { MultiLogLine } from '@pipeline/components/LogsContent/components/MultiLogLine/MultiLogLine'
import ExecutionLogHeader from '../ExecutionLogHeader'
import ExecutionLogToolbar from '../ExecutionLogToolbar'
import { reducer, useActionCreator } from './ExecutionLogState'
import { defaultReducerState } from './ExecutionLog.constants'
import { isPositiveNumber } from '../../useLogContentHook.utils'
import { convertLogDataToLogLineData } from './ExecutionLog.utils'
import type { State, Action, ActionType, ExecutionLogProps } from './ExecutionLog.types'
import css from '../../useLogContentHook.module.scss'

const ExecutionLog: React.FC<ExecutionLogProps> = ({
  isFullScreen,
  setIsFullScreen,
  verifyStepExecutionId,
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
  setPageNumber
}) => {
  const { getString } = useStrings()
  const [state, dispatch] = React.useReducer<Reducer<State, Action<ActionType>>>(reducer, defaultReducerState)
  const actions = useActionCreator(dispatch)

  const [isAtBottom, setIsAtBottom] = React.useState(false)
  const virtuosoRef = React.useRef<null | GroupedVirtuosoHandle | VirtuosoHandle>(null)
  const { currentIndex, linesWithResults } = state.searchData
  const length = state.data.length

  const { content, totalPages = 0 } = resource ?? {}

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

  const handleClick = (): void => {
    const handle = virtuosoRef.current
    /* istanbul ignore else */ if (handle) {
      handle.scrollToIndex(isAtBottom ? 0 : length)
    }
  }

  return (
    <div>
      <ExecutionLogHeader
        verifyStepExecutionId={verifyStepExecutionId}
        serviceName={serviceName}
        envName={envName}
        healthSource={healthSource}
        setHealthSource={setHealthSource}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        errorLogsOnly={errorLogsOnly}
        setErrorLogsOnly={setErrorLogsOnly}
        setPageNumber={setPageNumber}
        actions={actions}
      />
      <ExecutionLogToolbar
        state={state}
        actions={actions}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isVerifyStep={Boolean(verifyStepExecutionId)}
        timeRange={timeRange}
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
                />
              )}
            />
          )}
          {!length && !loading && !errorMessage && (
            <StrTemplate tagName="div" className={css.noLogs} stringID="common.logs.noLogsText" />
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
