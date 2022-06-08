/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, TabNavigation } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { useGetPipelineSummary, ResponsePMSPipelineSummaryResponse } from 'services/pipeline-ng'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useStrings } from 'framework/strings'
import type { GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { StoreType } from '@common/constants/GitSyncTypes'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import css from './TriggerDetails.module.scss'

export const TriggerBreadcrumbs = ({
  pipelineResponse
}: {
  pipelineResponse: ResponsePMSPipelineSummaryResponse | null
}): JSX.Element => {
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
      triggerIdentifier: string
    }>
  >()
  const { repoIdentifier, branch, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()

  const { getString } = useStrings()

  return (
    <NGBreadcrumbs
      links={[
        {
          url: routes.toPipelines({
            orgIdentifier,
            projectIdentifier,
            accountId,
            module
          }),
          label: getString('pipelines')
        },
        {
          url: routes.toTriggersPage({
            orgIdentifier,
            projectIdentifier,
            accountId,
            pipelineIdentifier,
            module,
            repoIdentifier,
            connectorRef,
            repoName,
            branch,
            storeType
          }),
          label: pipelineResponse?.data?.name || ''
        }
      ]}
    />
  )
}
const GetTriggerRightNav = (pipelineResponse: ResponsePMSPipelineSummaryResponse | null): JSX.Element => {
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
      triggerIdentifier: string
    }>
  >()

  const { getString } = useStrings()
  return (
    <Container>
      <TabNavigation
        size={'small'}
        links={[
          {
            label: getString('pipelineStudio'),
            to: routes.toPipelineStudio({
              orgIdentifier,
              projectIdentifier,
              pipelineIdentifier,
              accountId,
              module,
              branch: pipelineResponse?.data?.gitDetails?.branch,
              repoIdentifier: pipelineResponse?.data?.gitDetails?.repoIdentifier,
              connectorRef: pipelineResponse?.data?.connectorRef,
              repoName: pipelineResponse?.data?.gitDetails?.repoName,
              storeType: pipelineResponse?.data?.storeType as StoreType
            })
          },
          {
            label: getString('inputSetsText'),
            to: routes.toInputSetList({
              orgIdentifier,
              projectIdentifier,
              pipelineIdentifier,
              accountId,
              module,
              branch: pipelineResponse?.data?.gitDetails?.branch,
              repoIdentifier: pipelineResponse?.data?.gitDetails?.repoIdentifier,
              connectorRef: pipelineResponse?.data?.connectorRef,
              repoName: pipelineResponse?.data?.gitDetails?.repoName,
              storeType: pipelineResponse?.data?.storeType as StoreType
            })
          },
          {
            label: getString('common.triggersLabel'),
            to: routes.toTriggersPage({
              orgIdentifier,
              projectIdentifier,
              pipelineIdentifier,
              accountId,
              module,
              branch: pipelineResponse?.data?.gitDetails?.branch,
              repoIdentifier: pipelineResponse?.data?.gitDetails?.repoIdentifier,
              connectorRef: pipelineResponse?.data?.connectorRef,
              repoName: pipelineResponse?.data?.gitDetails?.repoName,
              storeType: pipelineResponse?.data?.storeType as StoreType
            })
          },
          {
            label: getString('executionHeaderText'),
            to: routes.toPipelineDeploymentList({
              orgIdentifier,
              projectIdentifier,
              pipelineIdentifier,
              accountId,
              module,
              branch: pipelineResponse?.data?.gitDetails?.branch,
              repoIdentifier: pipelineResponse?.data?.gitDetails?.repoIdentifier,
              connectorRef: pipelineResponse?.data?.connectorRef,
              repoName: pipelineResponse?.data?.gitDetails?.repoName,
              storeType: pipelineResponse?.data?.storeType as StoreType
            })
          }
        ]}
      />
    </Container>
  )
}

export default function TriggerDetails({
  children,
  wizard
}: {
  children: React.ReactElement
  wizard?: boolean
}): React.ReactElement {
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
      triggerIdentifier: string
    }>
  >()
  const { getString } = useStrings()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const { data: pipeline } = useGetPipelineSummary({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  })

  useDocumentTitle([
    pipeline?.data?.name || getString('pipelines'),
    getString('triggers.newTriggerWithoutPlus') || getString('common.triggersLabel')
  ])

  return (
    <GitSyncStoreProvider>
      <Page.Header
        className={cx(wizard && css.wizard)}
        toolbar={GetTriggerRightNav(pipeline)}
        title={
          <Layout.Vertical spacing="xsmall">
            <TriggerBreadcrumbs pipelineResponse={pipeline} />
          </Layout.Vertical>
        }
      />
      <Page.Body className={cx(wizard && css.wizardBody)}>{children}</Page.Body>
    </GitSyncStoreProvider>
  )
}
