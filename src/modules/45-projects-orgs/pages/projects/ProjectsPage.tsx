/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Layout,
  SelectOption,
  ExpandingSearchInput,
  Container,
  GridListToggle,
  Views,
  ButtonVariation,
  DropDown,
  Page,
  ButtonSize
} from '@harness/uicore'

import { useGetOrganizationsQuery } from '@harnessio/react-ng-manager-client'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useGetProjectAggregateDTOList } from 'services/cd-ng'
import type { Project } from 'services/cd-ng'
import { useProjectModal } from '@projects-orgs/modals/ProjectModal/useProjectModal'
import { useCollaboratorModal } from '@projects-orgs/modals/ProjectModal/useCollaboratorModal'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/components'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import { projectsPageQueryParamOptions, ProjectsPageQueryParams } from '@projects-orgs/utils/utils'
import ProjectsListView from './views/ProjectListView/ProjectListView'
import ProjectsGridView from './views/ProjectGridView/ProjectGridView'
import ProjectsEmptyState from './projects-empty-state.png'
import css from './ProjectsPage.module.scss'

enum OrgFilter {
  ALL = '$$ALL$$'
}

const ProjectsListPage: React.FC = () => {
  const { getString } = useStrings()
  useDocumentTitle(getString('projectsText'))
  const { accountId } = useParams<AccountPathProps>()
  const {
    verify,
    orgIdentifier: orgIdentifierQuery,
    page: pageIndex,
    size: pageSize
  } = useQueryParams<ProjectsPageQueryParams>(projectsPageQueryParamOptions)

  const {
    preference: orgFilterPreference,
    setPreference: setOrgFilterPreference,
    clearPreference: clearOrgFilterPreference
  } = usePreferenceStore<string>(PreferenceScope.USER, 'orgFilterOnProjectListing')
  const { preference: view = Views.GRID, setPreference: setView } = usePreferenceStore<Views | undefined>(
    PreferenceScope.MACHINE,
    'projectsViewType'
  )
  const [searchParam, setSearchParam] = useState<string>()
  const { updateQueryParams } = useUpdateQueryParams<ProjectsPageQueryParams>()
  const orgFilter = orgIdentifierQuery || orgFilterPreference

  const allOrgsSelectOption: SelectOption = useMemo(
    () => ({
      label: getString('all'),
      value: OrgFilter.ALL
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { data: orgsData, refetch: refetchQuery } = useGetOrganizationsQuery(
    {
      queryParams: {
        limit: 100
      }
    },
    {
      staleTime: 60 * 1000
    }
  )

  useEffect(() => {
    refetchQuery()
  }, [refetchQuery])

  const { showSuccess } = useToaster()

  useEffect(
    () => {
      if (verify) {
        showSuccess(getString('common.banners.trial.success'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verify]
  )

  const organizations: SelectOption[] = useMemo(
    () =>
      orgsData?.reduce(
        (orgList, item) => {
          if (item?.org) {
            orgList.push({
              label: item?.org?.name,
              value: item?.org?.identifier
            })
          }
          return orgList
        },
        [allOrgsSelectOption]
      ) || [],
    [orgsData, allOrgsSelectOption]
  )

  const { data, loading, refetch, error } = useGetProjectAggregateDTOList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgFilter,
      searchTerm: searchParam,
      pageIndex,
      pageSize
    },
    debounce: 300
  })

  const projectCreateSuccessHandler = (): void => {
    refetch()
  }

  const { openProjectModal, closeProjectModal } = useProjectModal({
    onSuccess: projectCreateSuccessHandler,
    onWizardComplete: () => {
      closeProjectModal()
      projectCreateSuccessHandler()
    }
  })

  const showEditProject = (project: Project): void => {
    openProjectModal(project)
  }

  const { openCollaboratorModal } = useCollaboratorModal()

  const showCollaborators = (project: Project): void => {
    openCollaboratorModal({ projectIdentifier: project.identifier, orgIdentifier: project.orgIdentifier || 'default' })
  }

  return (
    <Container className={css.projectsPage} height="inherit">
      <Page.Header breadcrumbs={<NGBreadcrumbs />} title={getString('projectsText')} />
      {data?.data?.totalItems || searchParam || loading || error || orgFilter ? (
        <Layout.Horizontal spacing="large" className={css.header}>
          <RbacButton
            featuresProps={{
              featuresRequest: {
                featureNames: [FeatureIdentifier.MULTIPLE_PROJECTS]
              }
            }}
            variation={ButtonVariation.PRIMARY}
            text={getString('projectsOrgs.newProject')}
            icon="plus"
            onClick={() => openProjectModal()}
          />
          <DropDown
            disabled={loading}
            filterable={false}
            items={organizations}
            value={orgFilter || OrgFilter.ALL}
            onChange={item => {
              if (item.value === OrgFilter.ALL) {
                clearOrgFilterPreference()
                updateQueryParams({ orgIdentifier: undefined, page: 0 })
              } else {
                setOrgFilterPreference(item.value as string)
                updateQueryParams({ orgIdentifier: item.value as string, page: 0 })
              }
            }}
            getCustomLabel={item => getString('common.tabOrgs', { name: item.label })}
          />
          <div style={{ flex: 1 }}></div>
          <ExpandingSearchInput
            alwaysExpanded
            onChange={text => {
              setSearchParam(text.trim())
              updateQueryParams({ page: 0 })
            }}
            width={300}
            className={css.expandSearch}
          />
          <GridListToggle initialSelectedView={view} onViewToggle={setView} />
        </Layout.Horizontal>
      ) : null}
      <Page.Body
        loading={loading}
        retryOnError={() => refetch()}
        error={(error?.data as Error)?.message || error?.message}
        noData={
          !searchParam && openProjectModal
            ? {
                when: () => !data?.data?.content?.length,
                image: ProjectsEmptyState,
                imageClassName: css.imageClassName,
                messageTitle: getString('projectsOrgs.youHaveNoProjects'),
                message: getString('projectDescription'),
                button: (
                  <RbacButton
                    featuresProps={{
                      featuresRequest: {
                        featureNames: [FeatureIdentifier.MULTIPLE_PROJECTS]
                      }
                    }}
                    size={ButtonSize.LARGE}
                    variation={ButtonVariation.PRIMARY}
                    text={getString('projectsOrgs.createAProject')}
                    onClick={() => openProjectModal?.()}
                  />
                )
              }
            : {
                when: () => !data?.data?.content?.length,
                image: ProjectsEmptyState,
                imageClassName: css.imageClassName,
                messageTitle: getString('noProjects')
              }
        }
      >
        {view === Views.GRID ? (
          <ProjectsGridView
            data={data}
            showEditProject={showEditProject}
            collaborators={showCollaborators}
            reloadPage={refetch}
          />
        ) : null}
        {view === Views.LIST ? (
          <ProjectsListView
            data={data}
            showEditProject={showEditProject}
            collaborators={showCollaborators}
            reloadPage={refetch}
          />
        ) : null}
      </Page.Body>
    </Container>
  )
}

export default ProjectsListPage
