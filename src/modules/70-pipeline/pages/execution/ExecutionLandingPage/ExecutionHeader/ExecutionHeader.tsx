/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, isEmpty } from 'lodash-es'
import { ButtonSize, ButtonVariation } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { Duration } from '@common/components/Duration/Duration'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import ExecutionActions from '@pipeline/components/ExecutionActions/ExecutionActions'
import { formatDatetoLocale } from '@common/utils/dateUtils'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import GitPopover from '@pipeline/components/GitPopover/GitPopover'
import { String, useStrings } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { usePermission } from '@rbac/hooks/usePermission'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { TagsPopover } from '@common/components'
import { StoreType } from '@common/constants/GitSyncTypes'

import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RetryHistory from '@pipeline/components/RetryPipeline/RetryHistory/RetryHistory'
import css from './ExecutionHeader.module.scss'

export function ExecutionHeader(): React.ReactElement {
  const { orgIdentifier, projectIdentifier, executionIdentifier, accountId, pipelineIdentifier, module } =
    useParams<PipelineType<ExecutionPathProps>>()
  const { refetch, pipelineExecutionDetail, selectedStageId, selectedStepId, allNodeMap, isPipelineInvalid } =
    useExecutionContext()
  const { getString } = useStrings()
  const { pipelineExecutionSummary = {} } = pipelineExecutionDetail || {}
  const history = useHistory()

  const [canEdit, canExecute] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier as string
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE, PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [orgIdentifier, projectIdentifier, accountId, pipelineIdentifier]
  )

  useDocumentTitle([
    `${pipelineExecutionSummary.name || getString('pipelines')} ${getString(
      module === 'cd' ? 'execution.pipelineIdentifierTextCD' : 'execution.pipelineIdentifierTextCI',
      pipelineExecutionSummary
    )}`
  ])

  return (
    <header className={css.header}>
      <div className={css.headerTopRow}>
        <NGBreadcrumbs
          links={[
            {
              url: routes.toPipelines({ orgIdentifier, projectIdentifier, accountId, module }),
              label: getString('pipelines')
            },
            {
              url: routes.toPipelineDeploymentList({
                orgIdentifier,
                projectIdentifier,
                pipelineIdentifier,
                accountId,
                module,
                branch: pipelineExecutionSummary?.gitDetails?.branch,
                repoIdentifier: pipelineExecutionSummary?.gitDetails?.repoIdentifier
              }),
              label: pipelineExecutionSummary.name || getString('common.pipeline')
            }
          ]}
        />
        <div className={css.actionsBar}>
          {pipelineExecutionSummary.status ? (
            <ExecutionStatusLabel status={pipelineExecutionSummary.status as ExecutionStatus} />
          ) : null}
          {pipelineExecutionSummary.startTs && (
            <div className={css.startTime}>
              <String tagName="div" className={css.startTimeText} stringID="pipeline.startTime" />
              <span>{formatDatetoLocale(pipelineExecutionSummary.startTs)}</span>
            </div>
          )}
          <Duration
            className={css.duration}
            startTime={pipelineExecutionSummary.startTs}
            endTime={pipelineExecutionSummary.endTs}
            icon="time"
            iconProps={{ size: 12 }}
            durationText={' '}
          />
          {pipelineExecutionSummary.showRetryHistory && (
            <RetryHistory
              canExecute={canExecute}
              showRetryHistory={pipelineExecutionSummary.showRetryHistory}
              canRetry={pipelineExecutionSummary.canRetry || false}
            />
          )}
          <RbacButton
            variation={ButtonVariation.SECONDARY}
            size={ButtonSize.SMALL}
            permission={{
              resourceScope: { orgIdentifier, projectIdentifier, accountIdentifier: accountId },
              resource: {
                resourceType: ResourceType.PIPELINE,
                resourceIdentifier: pipelineIdentifier as string
              },
              permission: PermissionIdentifier.VIEW_PIPELINE
            }}
            text={getString('common.viewText')}
            icon="main-view"
            onClick={ev => {
              ev.stopPropagation()
              const allNodes = Object.values(allNodeMap)
              const matchedStepNode = allNodes?.find(eachNode => eachNode.uuid === selectedStepId)
              const matchedStageNode = allNodes?.find(eachNode => eachNode.setupId === selectedStageId)
              history.push(
                routes.toPipelineStudio({
                  orgIdentifier,
                  projectIdentifier,
                  pipelineIdentifier,
                  accountId,
                  module,
                  repoIdentifier: pipelineExecutionSummary?.gitDetails?.repoIdentifier,
                  branch: pipelineExecutionSummary?.gitDetails?.branch,
                  stageId: matchedStageNode?.identifier,
                  stepId: matchedStepNode?.identifier
                })
              )
            }}
          />

          <ExecutionActions
            executionStatus={pipelineExecutionSummary.status as ExecutionStatus}
            refetch={refetch}
            params={{
              orgIdentifier,
              pipelineIdentifier,
              projectIdentifier,
              accountId,
              executionIdentifier,
              module,
              repoIdentifier: defaultTo(
                pipelineExecutionSummary?.gitDetails?.repoIdentifier,
                pipelineExecutionSummary?.gitDetails?.repoName
              ),
              branch: pipelineExecutionSummary?.gitDetails?.branch,
              stagesExecuted: pipelineExecutionSummary?.stagesExecuted,
              storeType: pipelineExecutionSummary?.gitDetails?.repoName ? StoreType.REMOTE : StoreType.INLINE
            }}
            isPipelineInvalid={isPipelineInvalid}
            canEdit={canEdit}
            showEditButton={false}
            canExecute={canExecute}
            canRetry={pipelineExecutionSummary.canRetry}
            modules={pipelineExecutionSummary.modules}
          />
        </div>
      </div>
      <div className={css.titleContainer}>
        <div className={css.title}>{pipelineExecutionSummary.name}</div>
        <String
          tagName="div"
          className={css.pipelineId}
          stringID={module === 'cd' ? 'execution.pipelineIdentifierTextCD' : 'execution.pipelineIdentifierTextCI'}
          vars={pipelineExecutionSummary}
        />
        {!isEmpty(pipelineExecutionSummary?.tags) ? (
          <TagsPopover
            iconProps={{ size: 14 }}
            className={css.tags}
            popoverProps={{ wrapperTagName: 'div', targetTagName: 'div' }}
            tags={(pipelineExecutionSummary?.tags || []).reduce((val, tag) => {
              return Object.assign(val, { [tag.key]: tag.value })
            }, {} as { [key: string]: string })}
          />
        ) : null}
        {pipelineExecutionSummary.gitDetails ? (
          <GitSyncStoreProvider>
            <GitPopover
              data={pipelineExecutionSummary.gitDetails}
              popoverProps={{ targetTagName: 'div', wrapperTagName: 'div', className: css.git }}
            />
          </GitSyncStoreProvider>
        ) : null}
      </div>
    </header>
  )
}
