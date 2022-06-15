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
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'

import AddCluster from './AddCluster'
import ClusterTableView from './ClusterTableView'

const GitOpsCluster = (props: { envRef: string }): React.ReactElement => {
  const [showSelectClusterModal, setShowClusterModal] = React.useState(false)
  const { projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
  }>()

  const { accountId } = useParams<AccountPathProps>()

  const { data, refetch, loading } = useGetClusterList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: props?.envRef
    }
  })
  const { getString } = useStrings()
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
          {getString('cd.selectClusterLabel')}
        </Button>
        <Container border={{ top: true }}>
          <ClusterTableView linkedClusters={data} loading={loading} refetch={refetch} {...props} />
          {showSelectClusterModal ? (
            <AddCluster
              linkedClusterResponse={data}
              onHide={() => {
                setShowClusterModal(false)
              }}
              refetch={refetch}
              envRef={props.envRef}
            />
          ) : null}
        </Container>
      </>
    </Container>
  )
}

export default GitOpsCluster
