/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  HarnessDocTooltip,
  Heading,
  Icon,
  Layout,
  Text
} from '@wings-software/uicore'
import { Color, FontVariation } from '@wings-software/design-system'
import { Intent } from '@blueprintjs/core'
import { matchPath, useHistory, useLocation, useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { ErrorNodeSummary } from 'services/pipeline-ng'
import css from '@pipeline/components/RunPipelineModal/RunPipelineForm.module.scss'

export interface PipelineErrorViewProps {
  errorNodeSummary?: ErrorNodeSummary
  pipelineIdentifier: string
  repoIdentifier?: string
  branch?: string
}

export function PipelineErrorView({
  errorNodeSummary,
  pipelineIdentifier,
  repoIdentifier,
  branch
}: PipelineErrorViewProps): React.ReactElement {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const hasChildren = !isEmpty(errorNodeSummary?.childrenErrorNodes)
  const history = useHistory()
  const location = useLocation()
  const routeParams = {
    orgIdentifier,
    projectIdentifier,
    pipelineIdentifier,
    accountId,
    module,
    repoIdentifier,
    branch
  }

  const onOpenInPipelineStudio = () => {
    history.push(routes.toPipelineStudio(routeParams))
  }

  const isPipeLineStudioView = !!matchPath(location.pathname, { path: routes.toPipelineStudio(routeParams) })

  return (
    <Layout.Vertical>
      <Container className={css.templateErrorModalHeader}>
        <Heading
          level={2}
          font={{ weight: 'bold' }}
          color={Color.BLACK_100}
          className={css.runModalHeaderTitle}
          data-tooltip-id="runPipelineFormTitle"
        >
          {getString('runPipeline')}
          <HarnessDocTooltip tooltipId="runPipelineFormTitle" useStandAlone={true} />
        </Heading>
      </Container>
      <Container className={css.templateErrorView}>
        <Layout.Vertical height={'100%'} background={Color.RED_50} flex={{ align: 'center-center' }} spacing={'large'}>
          <Icon name="warning-sign" intent={Intent.DANGER} size={40} />
          <Text font={{ variation: FontVariation.BODY }} color={Color.RED_600}>
            {getString(
              hasChildren
                ? 'pipeline.outOfSyncErrorStrip.unsyncedTemplateInfo'
                : 'pipeline.outOfSyncErrorStrip.updatedTemplateInfo',
              { entity: 'pipeline' }
            )}
          </Text>
          {isPipeLineStudioView ? (
            <Button
              variation={ButtonVariation.SECONDARY}
              text={getString('close')}
              onClick={() => {
                window.location.reload()
              }}
            />
          ) : (
            <RbacButton
              variation={ButtonVariation.SECONDARY}
              permission={{
                resourceScope: { orgIdentifier, projectIdentifier, accountIdentifier: accountId },
                resource: {
                  resourceType: ResourceType.PIPELINE,
                  resourceIdentifier: pipelineIdentifier
                },
                permission: PermissionIdentifier.VIEW_PIPELINE
              }}
              text={getString('pipeline.openInPipelineStudio')}
              onClick={onOpenInPipelineStudio}
            />
          )}
        </Layout.Vertical>
      </Container>
    </Layout.Vertical>
  )
}
