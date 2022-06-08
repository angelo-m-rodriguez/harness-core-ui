/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Container, Layout, PageError } from '@harness/uicore'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { getErrorMessage } from '@cf/utils/CFUtils'
import { GetTargetSegmentsQueryParams, Target, useGetTargetSegments } from 'services/cf'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import InclusionSubSection from './InclusionSubSection'
import ExclusionSubSection from './ExclusionSubSection'

export interface TargetGroupsProps {
  target: Target
}

const TargetGroups: React.FC<TargetGroupsProps> = ({ target }) => {
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    targetIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { loading, error, data, refetch } = useGetTargetSegments({
    identifier: targetIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    } as GetTargetSegmentsQueryParams
  })

  if (error) {
    return (
      <Container height="100%" width="100%" flex={{ align: 'center-center' }}>
        <PageError
          message={getErrorMessage(error)}
          onClick={() => {
            refetch()
          }}
        />
      </Container>
    )
  }

  if (loading) {
    return (
      <Container height="100%" flex={{ align: 'center-center' }}>
        <ContainerSpinner />
      </Container>
    )
  }

  return (
    <Layout.Vertical style={{ gap: 'var(--spacing-xlarge)' }}>
      <InclusionSubSection
        target={target as Target}
        targetGroups={data?.includedSegments || []}
        onAddTargetGroups={refetch}
        onRemoveTargetGroup={refetch}
      />

      <ExclusionSubSection
        target={target as Target}
        targetGroups={data?.excludedSegments || []}
        onAddTargetGroups={refetch}
        onRemoveTargetGroup={refetch}
      />
    </Layout.Vertical>
  )
}

export default TargetGroups
