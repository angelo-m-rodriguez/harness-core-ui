/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, isEmpty } from 'lodash-es'
import { Layout, Text } from '@wings-software/uicore'
import { String, useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import type {
  GitQueryParams,
  PipelineType,
  TemplateStudioPathProps,
  TemplateStudioQueryParams
} from '@common/interfaces/RouteInterfaces'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { StoreType } from '@common/constants/GitSyncTypes'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import type { Error, ResponseMessage } from 'services/pipeline-ng'
import noEntityFoundImage from './images/no-entity-found.svg'
import css from './NoEntityFound.module.scss'

interface NoEntityFoundProps {
  identifier: string
  entityType: 'pipeline' | 'inputSet' | 'template'
  errorObj?: Error
}

const entityTypeLabelMapping = {
  pipeline: 'pipeline',
  inputSet: 'input set',
  template: 'template'
}

function NoEntityFound(props: NoEntityFoundProps): JSX.Element {
  const { identifier, entityType, errorObj } = props
  const { repoIdentifier, branch, versionLabel, connectorRef, storeType, repoName } =
    useQueryParams<TemplateStudioQueryParams>()

  const { getString } = useStrings()
  const history = useHistory()
  const { isGitSimplificationEnabled } = useAppStore()
  const { replaceQueryParams } = useUpdateQueryParams<GitQueryParams>()

  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE

  const { accountId, projectIdentifier, orgIdentifier, module, templateType } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }> &
      TemplateStudioPathProps
  >()

  const onGitBranchChange = React.useMemo(
    () => (selectedFilter: GitFilterScope) => {
      if (branch !== selectedFilter.branch) {
        if (entityType === 'pipeline') {
          history.push(
            routes.toPipelineStudio({
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier: identifier || '-1',
              accountId,
              module,
              branch: selectedFilter.branch,
              repoIdentifier: selectedFilter.repo,
              ...(isPipelineRemote
                ? {
                    repoName,
                    connectorRef,
                    storeType
                  }
                : {})
            })
          )
          location.reload()
        } else if (entityType === 'inputSet') {
          replaceQueryParams(
            {
              branch: selectedFilter.branch,
              repoIdentifier: selectedFilter.repo,
              ...(isPipelineRemote
                ? {
                    repoName,
                    connectorRef,
                    storeType
                  }
                : {})
            },
            { skipNulls: true },
            true
          )
          location.reload()
        } else {
          history.push(
            routes.toTemplateStudio({
              projectIdentifier,
              orgIdentifier,
              accountId,
              module,
              templateType: templateType,
              templateIdentifier: identifier,
              versionLabel: versionLabel,
              repoIdentifier: selectedFilter.repo,
              branch: selectedFilter.branch
            })
          )
        }
      }
    },
    [repoIdentifier, branch, identifier, orgIdentifier, projectIdentifier, accountId, module]
  )

  return (
    <div className={css.noPipelineFoundContainer}>
      <Layout.Vertical spacing="small" flex={{ justifyContent: 'center', alignItems: 'center' }}>
        {!isEmpty(errorObj?.responseMessages) && (
          <ErrorHandler
            responseMessages={errorObj?.responseMessages as ResponseMessage[]}
            className={css.errorHandler}
          />
        )}
        <img src={noEntityFoundImage} className={css.noPipelineFoundImage} />
        <Text className={css.noPipelineFound} margin={{ top: 'medium', bottom: 'small' }}>
          <String
            stringID={'pipeline.gitExperience.noEntityFound'}
            vars={{ entityType: defaultTo(entityTypeLabelMapping[entityType], entityType) }}
          />
        </Text>
        <Text className={css.selectDiffBranch} margin={{ top: 'xsmall', bottom: 'xlarge' }}>
          {getString('pipeline.gitExperience.selectDiffBranch')}
        </Text>
        {isPipelineRemote && connectorRef && (
          <GitRemoteDetails
            connectorRef={connectorRef}
            repoName={repoName}
            branch={branch}
            flags={{ borderless: false, showRepo: false, normalInputStyle: true }}
            onBranchChange={onGitBranchChange}
          />
        )}
        {!isPipelineRemote && (
          <GitFilters
            onChange={onGitBranchChange}
            showRepoSelector={false}
            defaultValue={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
            branchSelectClassName={css.branchSelector}
          />
        )}
      </Layout.Vertical>
    </div>
  )
}

export default NoEntityFound
