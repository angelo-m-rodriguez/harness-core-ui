/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { useParams } from 'react-router-dom'
import PipelineDeploymentList from '@pipeline/pages/pipeline-deployment-list/PipelineDeploymentList'
import type { GitQueryParams, PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useGetPipelineSummary } from 'services/pipeline-ng'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useQueryParams } from '@common/hooks'
import { useRunPipelineModal } from '@pipeline/components/RunPipelineModal/useRunPipelineModal'

export default function CDPipelineDeploymentList(): React.ReactElement {
  const { pipelineIdentifier, orgIdentifier, projectIdentifier, accountId } =
    useParams<PipelineType<PipelinePathProps>>()

  const { branch, repoIdentifier, storeType, repoName } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  useDocumentTitle([getString('pipelines'), getString('executionsText')])

  const onRunPipeline = (): void => {
    openRunPipelineModal()
  }
  const { openRunPipelineModal } = useRunPipelineModal({
    pipelineIdentifier,
    repoIdentifier: defaultTo(repoIdentifier, repoName),
    branch,
    storeType
  })

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

  const isPipelineInvalid = pipeline?.data?.entityValidityDetails?.valid === false

  useDocumentTitle([pipeline?.data?.name || getString('pipelines'), getString('executionsText')])

  return (
    <PipelineDeploymentList
      showHealthAndExecution
      onRunPipeline={onRunPipeline}
      isPipelineInvalid={isPipelineInvalid}
    />
  )
}
