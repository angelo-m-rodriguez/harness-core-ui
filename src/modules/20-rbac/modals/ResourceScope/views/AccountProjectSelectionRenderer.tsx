/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Color, Layout, PageSpinner, Text } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { ResourceGroupDetailsPathProps, ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { useGetProjectList } from 'services/cd-ng'
import css from './ResourceScopeForm.module.scss'

interface ProjectSelectionRendererProps {
  projects: string[]
  onDelete: (item: string) => void
}

const AccountProjectSelectionRenderer: React.FC<ProjectSelectionRendererProps> = ({ projects, onDelete }) => {
  const { accountId, orgIdentifier } = useParams<ResourceGroupDetailsPathProps & ModulePathParams>()
  const { getString } = useStrings()

  const { data, loading } = useGetProjectList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      identifiers: projects
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    }
  })

  /* istanbul ignore else */ if (!projects.length) {
    return <></>
  }
  return (
    <Layout.Vertical spacing="xsmall" padding="xsmall">
      {loading && /* istanbul ignore next */ <PageSpinner />}
      {data?.data?.content?.map(({ project }) => (
        <Layout.Horizontal flex key={project.identifier} className={css.projectSelection} padding="small">
          <Layout.Horizontal spacing="small">
            <Text color={Color.BLACK}>{project.name}</Text>
            <Text>
              {` (${getString('idLabel', {
                id: project.identifier
              })})`}
            </Text>
          </Layout.Horizontal>
          <Button
            variation={ButtonVariation.ICON}
            icon="main-trash"
            iconProps={{ size: 20 }}
            onClick={() => {
              onDelete(project.identifier)
            }}
          />
        </Layout.Horizontal>
      ))}
    </Layout.Vertical>
  )
}

export default AccountProjectSelectionRenderer
