/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import {
  Text,
  Button,
  Card,
  Layout,
  PageSpinner,
  ButtonVariation,
  useToaster,
  ButtonSize
} from '@wings-software/uicore'
import { Classes, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { ExecutionInfo, useLatestExecutionId, useRetryHistory } from 'services/pipeline-ng'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { formatDatetoLocale } from '@common/utils/dateUtils'
import { TimeAgoPopover } from '@common/components'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import routes from '@common/RouteDefinitions'
import RbacButton from '@rbac/components/Button/Button'
import css from './RetryHistory.module.scss'

interface RetryHistoryProps {
  canExecute: boolean
  showRetryHistory: boolean
  canRetry: boolean
}

function RetryHistory({ canExecute, showRetryHistory, canRetry }: RetryHistoryProps): React.ReactElement {
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, pipelineIdentifier, accountId, executionIdentifier, module, source } =
    useParams<PipelineType<ExecutionPathProps>>()
  const history = useHistory()
  const { clear, showPrimary } = useToaster()

  const { data: latestExecutionId, refetch: refetchLatestExecutionId } = useLatestExecutionId({
    planExecutionId: executionIdentifier,
    queryParams: {
      orgIdentifier,
      pipelineIdentifier: pipelineIdentifier,
      projectIdentifier,
      accountIdentifier: accountId
    },
    lazy: true
  })
  useEffect(() => {
    if (latestExecutionId?.data?.latestExecutionId) {
      clear()
      history.push(
        routes.toExecutionPipelineView({
          orgIdentifier,
          pipelineIdentifier: pipelineIdentifier,
          projectIdentifier,
          executionIdentifier: latestExecutionId.data.latestExecutionId || '',
          accountId,
          module,
          source
        })
      )
    }
  }, [latestExecutionId])

  useEffect(() => {
    if (showRetryHistory && !canRetry) {
      showPrimary(
        <Layout.Horizontal spacing="medium">
          <Text color={Color.WHITE} margin={{ left: 'small' }}>
            {getString('pipeline.viewLatestExecution')}
          </Text>
          <Text
            color={Color.WHITE}
            font={{ weight: 'bold' }}
            className={css.viewLatest}
            onClick={() => refetchLatestExecutionId()}
          >
            {getString('common.viewLatest')}
          </Text>
        </Layout.Horizontal>,
        0
      )
    }
  }, [showRetryHistory, canRetry])

  const {
    data: retryHistoryResponse,
    loading: loadingRetryHistory,
    refetch: refetchRetryHistory
  } = useRetryHistory({
    planExecutionId: executionIdentifier,
    queryParams: {
      pipelineIdentifier: pipelineIdentifier,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })
  const executionInfo = retryHistoryResponse?.data?.executionInfos

  const gotoExecutionDetails = (planExecutionId: string): void => {
    if (planExecutionId !== executionIdentifier) {
      history.push(
        routes.toExecutionPipelineView({
          orgIdentifier,
          pipelineIdentifier: pipelineIdentifier,
          projectIdentifier,
          executionIdentifier: planExecutionId || '',
          accountId,
          module,
          source
        })
      )
    }
  }

  const getExecutionDetail = (index: number): JSX.Element => {
    return (
      <Text color={Color.PRIMARY_7} font={{ size: 'normal', weight: 'semi-bold' }}>
        {index === 0
          ? `${getString('pipeline.recentExecutionText')} ${executionInfo?.length}/${executionInfo?.length}`
          : `${getString('executionText')} ${(executionInfo as ExecutionInfo[])?.length - index}/${
              executionInfo?.length
            }`}
      </Text>
    )
  }

  function RetryExecutionList(): JSX.Element {
    return (
      <div className={css.modalContent}>
        <Layout.Vertical>
          <div className={css.retryHeaderSection}>
            <div className={css.retryModalHeader}>
              <Text
                icon="execution-history"
                iconProps={{ size: 24 }}
                style={{ fontSize: 20 }}
                font={{ weight: 'bold' }}
                color={Color.GREY_700}
              >
                {getString('pipeline.retryHistory')}
              </Text>
            </div>
          </div>
          <div>
            {loadingRetryHistory ? (
              <PageSpinner />
            ) : (
              <>
                <Text color={Color.GREY_800} font={{ size: 'normal' }} margin="medium">
                  {getString('pipeline.retryHistoryDescription')}
                </Text>
                {executionInfo?.map((retryHistory, index) => {
                  return (
                    <Card
                      elevation={0}
                      className={cx(css.card, css.hoverCard, Classes.POPOVER_DISMISS)}
                      key={retryHistory.uuid}
                      onClick={() => gotoExecutionDetails(retryHistory?.uuid as string)}
                    >
                      <div className={css.content}>
                        <div className={cx(css.cardSection, css.executionDetail)}>
                          {getExecutionDetail(index)}
                          <ExecutionStatusLabel status={retryHistory.status as ExecutionStatus} />
                        </div>
                        <div className={cx(css.cardSection)}>
                          <Text
                            color={Color.GREY_400}
                            font={{ size: 'small', weight: 'light' }}
                            icon="calendar"
                            iconProps={{ size: 12 }}
                          >
                            {formatDatetoLocale(retryHistory.startTs as number)}
                          </Text>
                          <div>
                            <TimeAgoPopover
                              iconProps={{ size: 12, className: css.timerIcon }}
                              icon="time"
                              time={defaultTo(retryHistory.startTs, 0)}
                              inline={false}
                              className={css.timeAgo}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </>
            )}
          </div>
        </Layout.Vertical>
        <Button minimal icon="cross" className={cx(css.crossIcon, Classes.POPOVER_DISMISS)} />
      </div>
    )
  }

  return (
    <Popover
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_RIGHT}
      content={<RetryExecutionList />}
      popoverClassName={css.retryPopover}
      autoFocus
    >
      <RbacButton
        icon="execution-history"
        text={getString('pipeline.retryHistory')}
        variation={ButtonVariation.SECONDARY}
        size={ButtonSize.SMALL}
        iconProps={{ size: 24, color: Color.PRIMARY_7 }}
        onClick={() => refetchRetryHistory()}
        disabled={!canExecute}
        className={cx(css.cardBtns, css.retryHistoryBtn)}
      />
    </Popover>
  )
}

export default RetryHistory
