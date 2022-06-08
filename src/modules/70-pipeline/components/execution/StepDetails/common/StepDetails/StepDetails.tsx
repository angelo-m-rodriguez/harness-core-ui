/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams, Link } from 'react-router-dom'
import { Duration } from '@common/exports'
import { useDelegateSelectionLogsModal } from '@common/components/DelegateSelectionLogs/DelegateSelectionLogs'
import type { DelegateInfo, ExecutableResponse, ExecutionNode } from 'services/pipeline-ng'
import { String, useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'

import type { ProjectPathProps, AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  ExecutionStatusEnum,
  isExecutionComplete,
  isExecutionCompletedWithBadState
} from '@pipeline/utils/statusHelpers'
import { encodeURIWithReservedChars } from './utils'
import css from './StepDetails.module.scss'

export interface StepLabels {
  label: string
  value: React.ReactNode
}
export interface StepDetailsProps {
  step: ExecutionNode
  labels?: StepLabels[]
}

export function StepDetails(props: StepDetailsProps): React.ReactElement {
  const { step, labels = [] } = props
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps & AccountPathProps>()
  //TODO - types will modified when the backend swagger docs are updated
  const deploymentTag = step?.stepParameters?.deploymentTag as any
  const serviceIdentifier = step?.stepParameters?.serviceIdentifier as any
  const activityId = step?.progressData?.activityId as any
  const estimatedRemainingTime = step?.progressData?.estimatedRemainingTime
  const progressPercentage = step?.progressData?.progressPercentage
  const timeout = step?.stepParameters?.timeout as any
  const [taskList, setTaskList] = React.useState<Array<ExecutableResponse>>([])
  const { openDelegateSelectionLogsModal } = useDelegateSelectionLogsModal()

  React.useEffect(() => {
    const tasks = step.executableResponses?.map(item => item.taskChain || item.task).filter(item => item !== undefined)
    if (tasks) {
      setTaskList(tasks)
    }
  }, [step.executableResponses])

  const showDelegateRow = (
    delegateList: DelegateInfo[] | undefined,
    tasks: ExecutableResponse[],
    status: string | undefined
  ): boolean => {
    return ((delegateList && delegateList?.length > 0) || tasks?.length > 0) && isExecutionComplete(status)
  }

  const delegateListContainsTask = (delegateList: DelegateInfo[] | undefined, taskId: string): boolean => {
    return !!delegateList?.find((item: DelegateInfo) => item.taskId === taskId)
  }

  return (
    <table className={css.detailsTable}>
      <tbody>
        <tr>
          <th>{getString('startedAt')}</th>
          <td>{step?.startTs ? new Date(step.startTs).toLocaleString() : '-'}</td>
        </tr>
        <tr>
          <th>{getString('endedAt')}</th>
          <td>{step?.endTs ? new Date(step.endTs).toLocaleString() : '-'}</td>
        </tr>

        <tr>
          <th>{getString('pipeline.duration')}</th>
          <td>
            <Duration
              className={css.timer}
              durationText=""
              startTime={step?.startTs}
              endTime={step?.endTs}
              showZeroSecondsResult
            />
          </td>
        </tr>
        {!!timeout && (
          <tr>
            <th>{getString('pipelineSteps.timeoutLabel')}</th>
            <td>{timeout}</td>
          </tr>
        )}
        {labels.map((label, index) => (
          <tr key={index}>
            <th>{label.label}</th>
            <td>{label.value}</td>
          </tr>
        ))}
        {showDelegateRow(step.delegateInfoList, taskList, step.status) && (
          <tr className={css.delegateRow}>
            <th>
              {isExecutionCompletedWithBadState(step.status) && (
                <Icon className={css.iconLabel} size={12} name="warning-sign" color={Color.ORANGE_500} />
              )}
              {getString('delegate.delegates')}
            </th>
            <td>
              <Layout.Vertical spacing="xsmall">
                {step.delegateInfoList &&
                  step.delegateInfoList.length > 0 &&
                  step.delegateInfoList.map((item, index) => (
                    <div key={`${item.id}-${index}`}>
                      <Text font={{ size: 'small', weight: 'bold' }}>
                        <String
                          stringID="common.delegateForTask"
                          vars={{ delegate: item.name, taskName: item.taskName }}
                          useRichText
                        />
                      </Text>{' '}
                      (
                      <Text
                        font={{ size: 'small' }}
                        onClick={() =>
                          openDelegateSelectionLogsModal({
                            taskId: item.taskId as string,
                            taskName: item.taskName as string,
                            delegateName: item.name as string
                          })
                        }
                        style={{ cursor: 'pointer' }}
                        color={Color.PRIMARY_7}
                      >
                        {getString('common.logs.delegateSelectionLogs')}
                      </Text>
                      )
                    </div>
                  ))}
                {taskList &&
                  taskList.length > 0 &&
                  isExecutionComplete(step.status) &&
                  taskList.map((item, index) =>
                    delegateListContainsTask(step.delegateInfoList, item.taskId) ? null : (
                      <div key={`${item.taskId}-${index}`}>
                        <Text font={{ size: 'small', weight: 'bold' }} color={Color.ORANGE_500}>
                          <String stringID="common.noDelegateForTask" vars={{ taskName: item.taskName }} useRichText />
                        </Text>{' '}
                        (
                        <Text
                          font={{ size: 'small' }}
                          onClick={() =>
                            openDelegateSelectionLogsModal({
                              taskId: item.taskId as string,
                              taskName: item.taskName as string
                            })
                          }
                          style={{ cursor: 'pointer' }}
                          color={Color.PRIMARY_7}
                        >
                          {getString('common.logs.delegateSelectionLogs')}
                        </Text>
                        )
                      </div>
                    )
                  )}
              </Layout.Vertical>
            </td>
          </tr>
        )}
        {/* TODO - this will be moved to step level once the support is added in pipeline factory */}
        {step.stepType === StepType.Verify &&
          deploymentTag &&
          serviceIdentifier &&
          step?.status !== ExecutionStatusEnum.Queued && (
            <>
              {estimatedRemainingTime && (
                <tr>
                  <th>{getString('pipeline.estimatedTimeRemaining')}</th>
                  <td>{estimatedRemainingTime}</td>
                </tr>
              )}
              {(progressPercentage || progressPercentage === 0) && (
                <tr>
                  <th>{getString('pipeline.progressPercentage')}</th>
                  <td>{progressPercentage}</td>
                </tr>
              )}
              <tr>
                <th>{getString('pipeline.verificationResult')}</th>
                <td>
                  <Link
                    to={routes.toCVDeploymentPage({
                      accountId,
                      projectIdentifier,
                      orgIdentifier,
                      deploymentTag: encodeURIWithReservedChars(deploymentTag),
                      serviceIdentifier,
                      ...(activityId && { activityId })
                    })}
                    target="_blank"
                  >
                    {getString('pipeline.clickHere')}
                  </Link>
                </td>
              </tr>
            </>
          )}
      </tbody>
    </table>
  )
}
