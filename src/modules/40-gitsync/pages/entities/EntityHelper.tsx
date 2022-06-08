/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, Text, Icon, Layout } from '@wings-software/uicore'
import type { CellProps, Renderer, Column } from 'react-table'
import { Color } from '@harness/design-system'
import type { GitSyncEntityListDTO, GitSyncEntityDTO } from 'services/cd-ng'
import { Entities } from '@common/interfaces/GitSyncInterface'

export const getEntityIconName = (entityType: string | undefined): IconName => {
  switch (entityType) {
    case Entities.PROJECTS:
      return 'nav-project'
    case Entities.PIPELINES:
      return 'pipeline-ng'
    case Entities.INPUT_SETS:
      return 'yaml-builder-input-sets'
    case Entities.TEMPLATE:
      return 'templates-icon'
    case Entities.FEATURE_FLAGS:
      return 'cf-main'
    case Entities.CONNECTORS:
      return 'connectors-icon'
    case Entities.SECRETS:
      return 'secret-manager'
    default:
      return 'placeholder'
  }
}

export const getEntityIconColor = (iconName: IconName): Color | undefined => {
  switch (iconName) {
    case 'nav-project':
      return Color.PRIMARY_7
  }
}

const RenderEntity: Renderer<CellProps<GitSyncEntityDTO>> = ({ row }) => {
  const data = row.original
  const iconName = getEntityIconName(data.entityType)
  return (
    <Layout.Horizontal>
      <Icon inline name={getEntityIconName(data.entityType)} color={getEntityIconColor(iconName)}></Icon>
      <Text padding={{ left: 'small' }} inline lineClamp={1}>
        {data.entityName}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderEntityId: Renderer<CellProps<GitSyncEntityDTO>> = ({ row }) => {
  const data = row.original
  return <Text lineClamp={1}>{data.entityIdentifier}</Text>
}

const RenderYamlPath: Renderer<CellProps<GitSyncEntityDTO>> = ({ row }) => {
  const data = row.original

  return (
    <a href={data?.entityUrl} target="_blank" rel="noopener noreferrer">
      <Text color={Color.PRIMARY_7} lineClamp={1}>
        {data?.entityUrl}
      </Text>
    </a>
  )
}

export const getEntityHeaderText = (data: GitSyncEntityListDTO): JSX.Element => {
  return (
    <Layout.Horizontal>
      <Text margin="small" font={{ size: 'medium', weight: 'semi-bold' }} color={Color.GREY_600}>
        {data.entityType}
      </Text>
      <Text
        margin="small"
        padding={{ left: 'small', right: 'small' }}
        border={false}
        font={{ size: 'medium', weight: 'semi-bold' }}
        color={Color.PRIMARY_6}
        background={Color.PRIMARY_1}
      >
        {data.count}
      </Text>
    </Layout.Horizontal>
  )
}

export const getTableColumns = (): Column<GitSyncEntityDTO>[] => {
  return [
    {
      Header: 'NAME',
      accessor: 'entityName',
      width: '25%',
      Cell: RenderEntity,
      disableSortBy: false
    },
    {
      Header: 'IDENTIFIER',
      accessor: 'entityIdentifier',
      width: '25%',
      Cell: RenderEntityId,
      disableSortBy: false
    },
    {
      Header: 'PATH',
      accessor: 'entityGitPath',
      width: '50%',
      Cell: RenderYamlPath,
      disableSortBy: false
    }
  ]
}
