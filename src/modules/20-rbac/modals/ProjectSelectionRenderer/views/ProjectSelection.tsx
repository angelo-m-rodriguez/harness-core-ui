/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Color,
  Container,
  ExpandingSearchInput,
  Layout,
  TagsPopover,
  Text
} from '@harness/uicore'
import type { CellProps, Renderer } from 'react-table'
import ResourceHandlerTable from '@rbac/components/ResourceHandlerTable/ResourceHandlerTable'
import { Project, useGetProjectList } from 'services/cd-ng'
import { PageSpinner } from '@common/components'
import { useStrings } from 'framework/strings'
import DescriptionPopover from '@common/components/DescriptionPopover.tsx/DescriptionPopover'
import type { ScopedObjectDTO } from '@common/components/EntityReference/EntityReference'
import css from './ProjectSelection.module.scss'

interface ProjectSelectionProps {
  scope: ScopedObjectDTO
  selectedData: string[]
  onSuccess: (projects: string[]) => void
  onClose: () => void
}

const RenderColumnProject: Renderer<CellProps<Project>> = ({ row }) => {
  const project = row.original
  const { getString } = useStrings()
  return (
    <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      <div className={css.colorbox} style={{ backgroundColor: `${project.color}` }} />
      <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }} className={css.verticalCenter}>
        <Layout.Horizontal spacing="small">
          <Text color={Color.BLACK} lineClamp={1} className={css.project}>
            {project.name}
          </Text>
          {project.tags && Object.keys(project.tags).length ? <TagsPopover tags={project.tags} /> : null}
          {project.description && <DescriptionPopover text={project.description} />}
        </Layout.Horizontal>
        <Text color={Color.GREY_600} lineClamp={1} className={css.project} font={{ size: 'small' }}>
          {getString('idLabel', { id: project.identifier })}
        </Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

const ProjectSelection: React.FC<ProjectSelectionProps> = ({ scope, selectedData, onClose, onSuccess }) => {
  const { accountIdentifier = '', orgIdentifier } = scope
  const [page, setPage] = useState(0)
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedData)
  const { data, loading } = useGetProjectList({
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      searchTerm,
      pageIndex: page,
      pageSize: 5
    },
    debounce: 300
  })
  const projectData = data?.data?.content?.map(projectResponse => projectResponse.project)

  if (loading) return <PageSpinner />
  return (
    <>
      <Layout.Horizontal padding={{ top: 'large' }} flex>
        <ExpandingSearchInput
          alwaysExpanded
          onChange={text => {
            setSearchTerm(text.trim())
          }}
        />
        <Text color={Color.PRIMARY_7}>
          {getString('rbac.addResourceModal.selectedText', {
            name: getString('projectsText'),
            number: selectedItems.length
          })}
        </Text>
      </Layout.Horizontal>
      {projectData ? (
        <Container>
          <ResourceHandlerTable
            data={projectData}
            selectedData={selectedItems}
            columns={[
              {
                id: 'name',
                accessor: 'name',
                width: '25%',
                Cell: RenderColumnProject,
                disableSortBy: true
              }
            ]}
            pagination={{
              itemCount: data?.data?.totalItems || 0,
              pageSize: data?.data?.pageSize || 10,
              pageCount: data?.data?.totalPages || -1,
              pageIndex: data?.data?.pageIndex || 0,
              gotoPage: pageNumber => setPage(pageNumber)
            }}
            onSelectChange={items => {
              setSelectedItems(items)
            }}
          />
        </Container>
      ) : null}

      <Layout.Horizontal spacing="small">
        <Button
          variation={ButtonVariation.PRIMARY}
          text={`${getString('add')} ${selectedItems.length} ${getString('projectsText')}`}
          onClick={() => onSuccess(selectedItems)}
        />
        <Button text={getString('cancel')} onClick={onClose} />
      </Layout.Horizontal>
    </>
  )
}

export default ProjectSelection
