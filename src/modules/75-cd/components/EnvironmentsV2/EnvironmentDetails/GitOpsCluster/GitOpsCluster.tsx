/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'

import { Button, ButtonSize, ButtonVariation, Container } from '@harness/uicore'
import { useGetClusterList } from 'services/cd-ng'

import AddCluster from '../AddCluster'
import ClusterTableView from '../ClusterTableView'

const GitOpsCluster = (props: any): React.ReactElement => {
  const [showSelectClusterModal, setShowClusterModal] = React.useState(false)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()

  const { data, refetch, loading } = useGetClusterList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: props?.envRef
    }
  })

  return (
    <Container padding={{ left: 'medium', right: 'medium' }}>
      <>
        <Button
          minimal
          intent="primary"
          onClick={() => {
            setShowClusterModal(true)
          }}
          icon="plus"
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
        >
          Select Cluster
        </Button>
        <Container border={{ top: true }}>
          <ClusterTableView
            linkedClusters={data}
            loading={loading}
            accountIdentifier={accountId}
            orgIdentifier
            projectIdentifier
            {...props}
          />
          {showSelectClusterModal ? (
            <AddCluster
              linkedClusters={data?.data?.content}
              onHide={() => {
                setShowClusterModal(false)
              }}
              refetch={refetch}
              {...props}
            />
          ) : null}
        </Container>
      </>
    </Container>
  )
}

export default GitOpsCluster
