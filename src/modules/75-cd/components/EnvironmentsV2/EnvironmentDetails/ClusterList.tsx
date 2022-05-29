/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, FontVariation, Icon, Text } from '@harness/uicore'
import cx from 'classnames'

import React from 'react'
import clusters from './clusters.json'
import css from './AddCluster.module.scss'

const ClusterCard = (props: any): React.ReactElement => {
  const { cluster, selectedClusters } = props
  return (
    <div
      onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.stopPropagation()
        if (selectedClusters.length) {
          props.setSelectedClusters([...selectedClusters, cluster])
        } else {
          props.setSelectedClusters([cluster])
        }
      }}
      className={cx(css.gitopsClusterCard, {
        [css.selected]: selectedClusters.find((clstr: any) => clstr.identifier === cluster.identifier)
      })}
      data-cy="cluster-card"
    >
      <Icon name="gitops-clusters" />
      <div className={css.clusterDetails}>
        <Text
          data-id="cluster-id-label"
          width={200}
          lineClamp={1}
          font={{ variation: FontVariation.BODY }}
          color={Color.BLACK}
          className={css.clusterName}
        >
          {cluster.cluster.name}
        </Text>
        <Text
          data-id="cluster-id-text"
          width={200}
          lineClamp={1}
          font={{ variation: FontVariation.FORM_LABEL }}
          color={Color.GREY_400}
          className={css.clusterId}
        >
          ID: {cluster.identifier}
        </Text>
      </div>
    </div>
  )
}

const ClusterList = (props: any): React.ReactElement => {
  if (clusters.totalItems > 0) {
    return (
      <div>
        {clusters.content.map(cluster => {
          return (
            <ClusterCard
              cluster={cluster}
              key={cluster.identifier}
              setSelectedClusters={props.setSelectedClusters}
              selectedClusters={props.selectedClusters}
            />
          )
        })}
      </div>
    )
  }
  return <div />
}

export default ClusterList
