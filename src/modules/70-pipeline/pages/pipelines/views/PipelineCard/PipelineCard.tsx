/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Card,
  Text,
  Container,
  Layout,
  SparkChart,
  CardBody,
  Icon,
  Button,
  ButtonVariation,
  ButtonSize,
  IconName,
  useToggleOpen
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import { Classes, Intent, Menu, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { useParams, useHistory } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { isExecutionComplete } from '@pipeline/utils/statusHelpers'
import { TimeAgoPopover } from '@common/exports'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import type { PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { TagsPopover } from '@common/components'
import routes from '@common/RouteDefinitions'
import { getRepoDetailsByIndentifier } from '@common/utils/gitSyncUtils'
import { StoreType } from '@common/constants/GitSyncTypes'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import useDeleteConfirmationDialog from '@pipeline/pages/utils/DeleteConfirmDialog'
import { Badge } from '@pipeline/pages/utils/Badge/Badge'
import { formatCount } from '@common/utils/utils'
import { useRunPipelineModal } from '@pipeline/components/RunPipelineModal/useRunPipelineModal'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { ClonePipelineForm } from '../ClonePipelineForm/ClonePipelineForm'
import { getIconsForPipeline } from '../../PipelineListUtils'

import css from './PipelineCard.module.scss'

interface PipelineDTO extends PMSPipelineSummaryResponse {
  status?: string
}
export interface PipelineCardProps {
  pipeline: PipelineDTO
  goToPipelineDetail: (pipeline?: PMSPipelineSummaryResponse) => void
  goToPipelineStudio: (pipeline?: PMSPipelineSummaryResponse) => void
  refetchPipeline: () => void
  onDeletePipeline: (commitMsg: string) => Promise<void>
  onDelete: (pipeline: PMSPipelineSummaryResponse) => void
}

interface ContextMenuProps {
  pipeline: PMSPipelineSummaryResponse
  goToPipelineStudio: (pipeline?: PMSPipelineSummaryResponse) => void
  goToPipelineDetail: (pipeline?: PMSPipelineSummaryResponse) => void
  refetchPipeline: () => void
  projectIdentifier: string
  orgIdentifier: string
  accountIdentifier: string
  isGitSyncEnabled: boolean
  openClonePipelineModal(): void
  onDeletePipeline: (commitMsg: string) => Promise<void>
  onDelete: (pipeline: PMSPipelineSummaryResponse) => void
}

function ContextMenu({
  pipeline,
  goToPipelineStudio,
  goToPipelineDetail,
  projectIdentifier,
  orgIdentifier,
  openClonePipelineModal,
  accountIdentifier,
  onDeletePipeline,
  onDelete,
  isGitSyncEnabled
}: ContextMenuProps): React.ReactElement {
  const { getString } = useStrings()
  const { confirmDelete } = useDeleteConfirmationDialog(pipeline, 'pipeline', onDeletePipeline)

  const [canDelete, canRun] = usePermission(
    {
      resourceScope: {
        accountIdentifier,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipeline.identifier as string
      },
      permissions: [PermissionIdentifier.DELETE_PIPELINE, PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [orgIdentifier, projectIdentifier, accountIdentifier, pipeline.identifier]
  )

  const runPipeline = (): void => {
    openRunPipelineModal()
  }

  const { openRunPipelineModal } = useRunPipelineModal({
    pipelineIdentifier: (pipeline.identifier || '') as string,
    repoIdentifier: isGitSyncEnabled ? pipeline?.gitDetails?.repoIdentifier : pipeline?.gitDetails?.repoName,
    branch: pipeline?.gitDetails?.branch,
    connectorRef: pipeline?.connectorRef,
    storeType: pipeline?.storeType as StoreType
  })

  const isPipelineInvalid = pipeline?.entityValidityDetails?.valid === false

  return (
    <Menu style={{ minWidth: 'unset' }} onClick={e => e.stopPropagation()}>
      <Menu.Item
        icon="play"
        text={getString('runPipelineText')}
        disabled={!canRun || isPipelineInvalid}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          runPipeline()
        }}
      />
      <Menu.Item
        icon="cog"
        text={getString('launchStudio')}
        onClick={() => {
          goToPipelineStudio(pipeline)
        }}
      />
      <Menu.Item
        icon="list-detail-view"
        text={getString('viewExecutions')}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          goToPipelineDetail(pipeline)
        }}
      />
      <Menu.Divider />
      <Menu.Item
        icon="duplicate"
        text={getString('projectCard.clone')}
        disabled={isGitSyncEnabled}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          openClonePipelineModal()
        }}
      />
      <Menu.Item
        icon="trash"
        text={getString('delete')}
        disabled={!canDelete}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          onDelete(pipeline)
          confirmDelete()
        }}
      />
    </Menu>
  )
}

const LEFT_COLUMN_WIDTH = 80

function AdditionalEntitiesCountPopUp(props: { entityList: string[]; iconName?: IconName }): React.ReactElement {
  const { entityList, iconName } = props
  return (
    <Layout.Vertical style={{ padding: 'var(--spacing-4)' }}>
      {entityList.map(entity => (
        <Container key={entity} flex={{ justifyContent: 'flex-start' }}>
          {iconName && <Icon name={iconName} style={{ height: 'var(--spacing-5)', marginRight: 'var(--spacing-3)' }} />}
          <Text font="small" color={Color.WHITE} style={{ lineHeight: '22px' }}>
            {entity}
          </Text>
        </Container>
      ))}
    </Layout.Vertical>
  )
}

const renderEntityWithAdditionalCountInfo = (entityList: string[], iconName?: IconName): React.ReactElement | null => {
  if (!entityList?.length) {
    return null
  }
  const [firstElement, ...otherElements] = entityList

  return (
    <Layout.Horizontal>
      {firstElement && (
        <Text
          font="small"
          className={css.firstEntity}
          lineClamp={1}
          tooltip={
            <Container style={{ padding: 'var(--spacing-4)' }}>
              <Text font="small" color={Color.WHITE} style={{ lineHeight: '22px' }}>
                {firstElement}
              </Text>
            </Container>
          }
          tooltipProps={{ isDark: true }}
        >
          {firstElement}
        </Text>
      )}
      {otherElements && otherElements.length > 0 && (
        <Popover
          interactionKind={PopoverInteractionKind.HOVER}
          position={Position.RIGHT}
          usePortal={true}
          className={Classes.DARK}
          content={<AdditionalEntitiesCountPopUp entityList={otherElements} iconName={iconName} />}
        >
          <Text
            font="small"
            color={Color.GREY_600}
            style={{ marginLeft: 'var(--spacing-4)' }}
          >{`+${otherElements.length}`}</Text>
        </Popover>
      )}
    </Layout.Horizontal>
  )
}

export function PipelineCard({
  pipeline,
  goToPipelineDetail,
  goToPipelineStudio,
  refetchPipeline,
  onDeletePipeline,
  onDelete
}: PipelineCardProps): React.ReactElement {
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()
  const { gitSyncRepos, loadingRepos } = useGitSyncStore()
  const { storeType, gitDetails: { repoName } = {} } = pipeline
  const { isGitSimplificationEnabled, isGitSyncEnabled } = useAppStore()
  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE
  const history = useHistory()
  const goToExecutionPipelineView = (executionId: string | undefined): void => {
    if (executionId && pipeline.identifier) {
      history.push(
        routes.toExecutionPipelineView({
          orgIdentifier,
          pipelineIdentifier: pipeline.identifier,
          projectIdentifier,
          executionIdentifier: executionId,
          accountId,
          module
        })
      )
    }
  }

  const { getString } = useStrings()
  const deployments = pipeline.executionSummaryInfo?.deployments?.reduce((acc, val) => acc + val, 0) || 0

  const runPipeline = (): void => {
    openRunPipelineModal()
  }

  const { openRunPipelineModal } = useRunPipelineModal({
    pipelineIdentifier: (pipeline.identifier || '') as string,
    repoIdentifier: isGitSyncEnabled ? pipeline?.gitDetails?.repoIdentifier : pipeline?.gitDetails?.repoName,
    branch: pipeline?.gitDetails?.branch,
    connectorRef: pipeline?.connectorRef,
    storeType: pipeline?.storeType as StoreType
  })
  const {
    open: openClonePipelineModal,
    isOpen: isClonePipelineModalOpen,
    close: closeClonePipelineModal
  } = useToggleOpen()

  const pipelineIcons = getIconsForPipeline(pipeline)
  const status = pipeline.executionSummaryInfo?.lastExecutionStatus
  const isPipelineInvalid = pipeline?.entityValidityDetails?.valid === false

  function handleCloseClonePipelineModal(e?: React.SyntheticEvent): void {
    e?.stopPropagation()
    closeClonePipelineModal()
  }

  return (
    <Card className={css.pipelineCard} interactive onClick={() => goToPipelineStudio(pipeline)}>
      <Container padding={'xlarge'} border={{ bottom: true }}>
        <CardBody.Menu
          menuContent={
            <ContextMenu
              pipeline={pipeline}
              goToPipelineStudio={goToPipelineStudio}
              goToPipelineDetail={goToPipelineDetail}
              refetchPipeline={refetchPipeline}
              projectIdentifier={projectIdentifier}
              accountIdentifier={accountId}
              orgIdentifier={orgIdentifier}
              isGitSyncEnabled={!!(isGitSyncEnabled || isGitSimplificationEnabled)}
              onDeletePipeline={onDeletePipeline}
              onDelete={onDelete}
              openClonePipelineModal={openClonePipelineModal}
            />
          }
          menuPopoverProps={{
            className: Classes.DARK
          }}
        />
        <Container>
          <Layout.Horizontal spacing={'small'} margin={{ bottom: 'small' }} flex>
            <Container>
              {!isEmpty(pipelineIcons) &&
                pipelineIcons.map(iconObj => <Icon key={iconObj.icon} name={iconObj.icon} size={16} />)}
            </Container>
            {isPipelineInvalid && (
              <Badge
                text={'common.invalid'}
                iconName="error-outline"
                showTooltip={true}
                entityName={pipeline.name}
                entityType={'Pipeline'}
                showInvalidText={true}
              />
            )}
          </Layout.Horizontal>
          <Layout.Horizontal spacing={'medium'} flex={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
            <Container>
              <Text lineClamp={1} font={{ weight: 'bold' }} color={Color.GREY_800} data-testid={pipeline.identifier}>
                {pipeline.name}
              </Text>
              <Text font="small" lineClamp={1} color={Color.GREY_600} margin={{ top: 'xsmall' }}>
                {getString('idLabel', { id: pipeline.identifier })}
              </Text>
            </Container>
            {!isEmpty(pipeline.tags) && pipeline.tags && (
              <TagsPopover
                className={css.tagsPopover}
                iconProps={{ size: 14, color: Color.GREY_600 }}
                tags={pipeline.tags}
              />
            )}
          </Layout.Horizontal>
        </Container>
      </Container>
      <Container padding={{ left: 'xlarge', right: 'xlarge' }}>
        {pipeline.stageNames && !isEmpty(pipeline.stageNames) && !isPipelineRemote && (
          <Container border={{ bottom: true }} padding={{ top: 'medium', bottom: 'medium' }}>
            <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'small'}>
              <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                {getString('stages')}
              </Text>
              {renderEntityWithAdditionalCountInfo(pipeline.stageNames)}
            </Layout.Horizontal>
          </Container>
        )}
        {!isPipelineRemote && (
          <Container
            className={css.infoContainer}
            border={{ bottom: true }}
            padding={{ top: 'medium', bottom: 'medium' }}
          >
            {(module === 'ci' || !!pipeline.filters?.ci?.repoNames?.length) && (
              <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'small'}>
                <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                  {getString('pipeline.buildRepo')}
                </Text>
                {pipeline.filters?.ci?.repoNames?.length ? (
                  <Text font="small" color={Color.BLACK} lineClamp={1}>
                    {pipeline.filters?.ci?.repoNames.join(', ')}
                  </Text>
                ) : (
                  <Text font="small" color={Color.GREY_500}>
                    {getString('none')}
                  </Text>
                )}
              </Layout.Horizontal>
            )}
            {(module === 'cd' || !!pipeline.filters?.cd?.serviceNames?.length) && (
              <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'small'}>
                <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                  {getString('services')}
                </Text>
                {pipeline.filters?.cd?.serviceNames?.length ? (
                  renderEntityWithAdditionalCountInfo(pipeline.filters?.cd?.serviceNames as string[], 'infrastructure')
                ) : (
                  <Text font="small" color={Color.GREY_500}>
                    {getString('none')}
                  </Text>
                )}
              </Layout.Horizontal>
            )}
          </Container>
        )}

        {isPipelineRemote && (
          <Container
            className={css.infoContainer}
            border={{ bottom: true }}
            padding={{ top: 'medium', bottom: 'medium' }}
          >
            <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
              <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                {getString('pipeline.gitRepo')}
              </Text>
              <Layout.Horizontal style={{ alignItems: 'center' }} spacing={'small'}>
                <Icon name="repository" size={10} color={Color.GREY_600} />
                <Text font={{ size: 'small' }} color={Color.BLACK} title={repoName} lineClamp={1} width={90}>
                  {repoName}
                </Text>
              </Layout.Horizontal>
            </Layout.Horizontal>
          </Container>
        )}

        {isGitSyncEnabled && !!pipeline.gitDetails?.repoIdentifier && !!pipeline.gitDetails.branch && (
          <Container
            className={css.infoContainer}
            border={{ bottom: true }}
            padding={{ top: 'medium', bottom: 'medium' }}
          >
            <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
              <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                {getString('pipeline.gitRepo')}
              </Text>
              <Layout.Horizontal style={{ alignItems: 'center' }} spacing={'small'}>
                <Icon name="repository" size={10} color={Color.GREY_600} />
                <Text
                  font={{ size: 'small' }}
                  color={Color.BLACK}
                  title={pipeline?.gitDetails?.repoIdentifier}
                  lineClamp={1}
                  width={90}
                >
                  {(!loadingRepos &&
                    getRepoDetailsByIndentifier(pipeline.gitDetails.repoIdentifier, gitSyncRepos)?.name) ||
                    ''}
                </Text>
              </Layout.Horizontal>
            </Layout.Horizontal>

            <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
              <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                {getString('pipelineSteps.deploy.inputSet.branch')}
              </Text>
              <Layout.Horizontal style={{ alignItems: 'center' }} spacing={'small'}>
                <Icon name="git-new-branch" size={10} color={Color.GREY_500} />
                <Text
                  font={{ size: 'small' }}
                  color={Color.BLACK}
                  title={pipeline?.gitDetails?.branch}
                  lineClamp={1}
                  width={90}
                >
                  {pipeline.gitDetails.branch}
                </Text>
              </Layout.Horizontal>
            </Layout.Horizontal>
          </Container>
        )}

        <Container className={css.infoContainer} padding={{ top: 'medium', bottom: 'xlarge' }}>
          {pipeline.executionSummaryInfo?.lastExecutionTs && (
            <>
              <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
                <Text className={css.label} font="small" width={LEFT_COLUMN_WIDTH} color={Color.GREY_700}>
                  {getString('lastRunAtDate')}
                </Text>
                <Layout.Horizontal flex spacing={'small'}>
                  <TimeAgoPopover
                    font="small"
                    color={Color.BLACK}
                    onClick={event => {
                      event.stopPropagation()
                      goToExecutionPipelineView(pipeline.executionSummaryInfo?.lastExecutionId)
                    }}
                    time={pipeline.executionSummaryInfo?.lastExecutionTs}
                  />
                  {isExecutionComplete(status) ? (
                    <Icon
                      name={
                        pipeline.executionSummaryInfo?.lastExecutionStatus === 'Success'
                          ? 'deployment-success-legacy'
                          : 'warning-sign'
                      }
                      intent={
                        pipeline.executionSummaryInfo?.lastExecutionStatus !== 'Success' ? Intent.DANGER : Intent.NONE
                      }
                      size={12}
                    />
                  ) : null}
                </Layout.Horizontal>
              </Layout.Horizontal>
              <Layout.Horizontal
                margin={{ top: deployments ? 'xsmall' : 0 }}
                flex={{ justifyContent: 'flex-start', alignItems: deployments ? 'flex-end' : 'center' }}
              >
                <Container className={css.label} width={LEFT_COLUMN_WIDTH}>
                  <Text color={Color.GREY_700} font="small">
                    {getString('executionsText')}
                  </Text>
                  <Text color={Color.GREY_500} font="xsmall">
                    {getString('pipeline.lastSevenDays')}
                  </Text>
                </Container>
                <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'flex-end' }}>
                  {deployments ? (
                    <>
                      <SparkChart
                        data={pipeline.executionSummaryInfo?.deployments || []}
                        data2={pipeline.executionSummaryInfo?.numOfErrors || []}
                        color={Color.PRIMARY_4}
                        color2={Color.RED_600}
                        className={css.sparkChart}
                      />
                      <Text
                        color={Color.PRIMARY_7}
                        font={{ size: 'medium', weight: 'semi-bold' }}
                        iconProps={{ size: 18 }}
                        className={css.deploymentsCount}
                        onClick={event => {
                          event.stopPropagation()
                          goToPipelineDetail(pipeline)
                        }}
                      >
                        {formatCount(deployments)}
                      </Text>
                    </>
                  ) : (
                    <Text color={Color.GREY_500} font={{ size: 'small' }}>
                      {getString('none')}
                    </Text>
                  )}
                </Layout.Horizontal>
              </Layout.Horizontal>
            </>
          )}
          <Layout.Horizontal
            margin={{ top: pipeline.executionSummaryInfo?.lastExecutionTs ? 'small' : 0 }}
            spacing={'small'}
            flex
          >
            {!pipeline.executionSummaryInfo?.lastExecutionTs && (
              <Text font={{ size: 'xsmall', weight: 'semi-bold' }} color={Color.GREY_400}>
                {getString('pipeline.neverRan')}
              </Text>
            )}
            <RbacButton
              withoutCurrentColor
              data-testid="card-run-pipeline"
              icon="command-start"
              variation={ButtonVariation.SECONDARY}
              size={ButtonSize.SMALL}
              intent="success"
              iconProps={{ size: 9, color: Color.SUCCESS }}
              className={cx(css.cardBtns, css.runBtn)}
              text={getString('runPipelineText')}
              permission={{
                resource: {
                  resourceType: ResourceType.PIPELINE,
                  resourceIdentifier: pipeline.identifier as string
                },
                permission: PermissionIdentifier.EXECUTE_PIPELINE
              }}
              featuresProps={getFeaturePropsForRunPipelineButton({ modules: pipeline.modules, getString })}
              onClick={e => {
                e.stopPropagation()
                runPipeline()
              }}
              disabled={isPipelineInvalid}
              tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
            />
            {pipeline.executionSummaryInfo?.lastExecutionTs && (
              <Button
                variation={ButtonVariation.SECONDARY}
                size={ButtonSize.SMALL}
                className={cx(css.cardBtns, css.viewExecutionsBtn)}
                text={getString('viewExecutions')}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  goToPipelineDetail(pipeline)
                }}
              />
            )}
          </Layout.Horizontal>
        </Container>
      </Container>
      <ClonePipelineForm
        isOpen={isClonePipelineModalOpen}
        onClose={handleCloseClonePipelineModal}
        originalPipeline={pipeline}
      />
    </Card>
  )
}
