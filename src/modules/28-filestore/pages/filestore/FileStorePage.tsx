/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useContext, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, PageSpinner } from '@harness/uicore'

import {
  Container,
  ExpandingSearchInput,
  FormInput,
  SelectOption,
} from "@wings-software/uicore";
import { debounce, pick } from "lodash-es";
import { useModalHook } from '@harness/use-modal'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { Page, StringUtils } from '@common/exports'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useStrings } from 'framework/strings'
import EmptyNodeView from '@filestore/components/EmptyNodeView/EmptyNodeView'
import StoreExplorer from '@filestore/components/StoreExplorer/StoreExplorer'
import StoreView from '@filestore/components/StoreView/StoreView'
import { FileStoreContext, FileStoreContextProvider } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FILE_STORE_ROOT, SEARCH_FILES } from '@filestore/utils/constants'
import { FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import {
  FilesFilterProperties,
  FileStoreNodeDTO,
  FilterDTO,
  GetFolderNodesQueryParams,
  GetReferencedByInScopeQueryParams, ListFilesWithFilterQueryParams,
  useDeleteFilter,
  useGetCreatedByList,
  useGetEntityTypes,
  useGetFilterList,
  useGetFolderNodes,
  useGetReferencedByInScope,
  useListFilesWithFilter,
  usePostFilter,
  useUpdateFilter
} from 'services/cd-ng'
import FilterSelector from "@common/components/Filter/FilterSelector/FilterSelector";
import {
  flattenObject, getFilterByIdentifier,
  isObjectEmpty,
  removeNullAndEmpty,
  UNSAVED_FILTER
} from "@common/components/Filter/utils/FilterUtils";
import {
  createRequestBodyPayload, FileStoreFilterFormType,
} from "@filestore/utils/RequestUtils";
import { Filter, FilterRef } from "@common/components/Filter/Filter";
import type { CrudOperation } from "@common/components/Filter/FilterCRUD/FilterCRUD";
import type { FilterDataInterface, FilterInterface } from "@common/components/Filter/Constants";
import { getFileUsageNameByType } from "@filestore/utils/textUtils";

import css from "./FileStorePage.module.scss";

const fileUsageOptions: SelectOption[] = [
  {
    label: getFileUsageNameByType(FileUsage.MANIFEST_FILE),
    value: FileUsage.MANIFEST_FILE
  },
  {
    label: getFileUsageNameByType(FileUsage.CONFIG),
    value: FileUsage.CONFIG
  },
  {
    label: getFileUsageNameByType(FileUsage.SCRIPT),
    value: FileUsage.SCRIPT
  }
]

const FileStore: React.FC = () => {
  const params = useParams<PipelineType<ProjectPathProps>>()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterDTO[]>()
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)
  const [referencedByEntitySelected, setReferencedByEntitySelected] = useState<string>()
  const [referenceIdentifier, setReferenceIdentifier] = useState<string>()
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | null>()
  const { accountId, orgIdentifier, projectIdentifier } = params
  const { getString } = useStrings()
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)
  const { fileStore, setFileStore, setCurrentNode, setLoading } = useContext(FileStoreContext)

  const defaultQueryParams: GetFolderNodesQueryParams = {
    projectIdentifier,
    orgIdentifier,
    accountIdentifier: accountId
  }

  const { mutate: getRootNodes, loading } = useGetFolderNodes({
    queryParams: defaultQueryParams
  })

  const { data: createdByListResponse } = useGetCreatedByList({ queryParams: defaultQueryParams })

  const { data: entityTypeResponse } = useGetEntityTypes({ queryParams: defaultQueryParams })

  const {
    loading: isFetchingFilters,
    data: fetchedFilterResponse,
    refetch: refetchFilterList
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'FileStore'
    }
  })

  const { mutate: createFilter } = usePostFilter({
    queryParams: {
      accountIdentifier: accountId,
    }
  })

  const { mutate: updateFilter } = useUpdateFilter({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: deleteFilter } = useDeleteFilter({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'FileStore'
    }
  })

  const { mutate: getFilesWithFilter } = useListFilesWithFilter({ queryParams: defaultQueryParams })

  const reset = (): void => {
    refetchFileStoreList(defaultQueryParams)
    setAppliedFilter(undefined)
  }

  const { data: referencedByListForScopeResponse } = useGetReferencedByInScope({
    queryParams: {
      ...defaultQueryParams,
      entityType: referencedByEntitySelected as GetReferencedByInScopeQueryParams["entityType"]
    }
  })

  const referenceNameOptions: SelectOption[] = (referencedByListForScopeResponse?.data?.content || []).map((entity) => ({
    label: entity.referredEntity?.name || '',
    value: entity.referredEntity?.entityRef?.identifier || ''
  }))

  const createdByOptions: SelectOption[] = (createdByListResponse?.data || []).map(user => ({
      label: user.name || '',
      value: user.email || ''
    })
  )

  const referencedByOptions: SelectOption[] = (entityTypeResponse?.data || []).map(entityType => ({
      label: entityType,
      value: entityType
    })
  )

  const [selectedCreatedBy, setSelectedCreatedBy] = useState<SelectOption>()

  const FileStoreFilterForm = (): React.ReactElement => {
    return (
      <>
        <FormInput.Select
          items={fileUsageOptions}
          name="fileUsage"
          label={getString('filestore.filter.fileUsage')}
          key="fileUsage"
          placeholder={getString('filestore.filter.fileUsagePlaceholder')}
        />
        <FormInput.KVTagInput name="tags" label={getString('tagsLabel')} key="tags"/>
        <FormInput.Select
          items={createdByOptions}
          value={selectedCreatedBy}
          onChange={() => setSelectedCreatedBy({ value: "bl", label: "bla" })}
          name="createdBy"
          label={getString('filestore.filter.createdBy')}
          key="createdBy"
        />
        <FormInput.Select
          items={referencedByOptions}
          onChange={option => setReferencedByEntitySelected(option.value as string)}
          name="referencedBy"
          label={getString('filestore.filter.referencedBy')}
          key="referencedBy"
        />
        {
          referencedByEntitySelected &&
          <FormInput.Select
            style={{ marginLeft: 20, paddingLeft: 20, borderLeft: "1px solid #CBCBCB" }}
            items={referenceNameOptions}
            onChange={option => setReferenceIdentifier(option.value as string)}
            name="referenceName"
            label={getString('filestore.filter.referenceName')}
            key="referenceName"
          />
        }
      </>
    )
  }

  const refetchFileStoreList = React.useCallback(
    async (
      params?: ListFilesWithFilterQueryParams,
      filter?: FilesFilterProperties
    ): Promise<void> => {
      const { tags, fileUsage, createdBy, referencedBy } = filter || {}

      const requestBodyPayload = Object.assign(
        filter
          ? {
            tags,
            fileUsage,
            createdBy: (createdByListResponse?.data || []).find(user => user.email === createdBy),
            referencedBy: (referencedBy && referenceIdentifier) ? {
              type: referencedBy,
              entityRef: {
                identifier: referenceIdentifier,
                ...params
              }
            } : null,
          }
          : {},
        {
          filterType: 'FileStore'
        }
      ) as FilesFilterProperties

      const sanitizedFilterRequest = removeNullAndEmpty(requestBodyPayload)
      setLoading(true)

      try {
        const { status, data } = await getFilesWithFilter(sanitizedFilterRequest, { queryParams: params })
        /* istanbul ignore else */
        if (status === 'SUCCESS') {
          const filteredFiles: FileStoreNodeDTO[] = data?.content?.map(file => ({
            identifier: file.identifier,
            lastModifiedBy: file.lastModifiedBy,
            lastModifiedAt: file.lastModifiedAt,
            name: file.name,
            parentIdentifier: file.parentIdentifier,
            fileUsage: file.fileUsage,
            type: file.type
          })) || []

          setCurrentNode({
            identifier: SEARCH_FILES,
            name: SEARCH_FILES,
            type: FileStoreNodeTypes.FOLDER,
            children: filteredFiles
          })
        }
      } /* istanbul ignore next */ catch (e) {

      }

      setLoading(false)
    },
    [createdByListResponse]
  )

  useEffect(() => {
    getRootNodes({ identifier: FILE_STORE_ROOT, name: FILE_STORE_ROOT, type: FileStoreNodeTypes.FOLDER }).then(
      response => {
        if (response?.data?.children) {
          setFileStore(response.data.children)
          setCurrentNode(response.data)
        }
      }
    )
  }, [])

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<FileStoreFilterFormType, FilterInterface>
  ): Promise<void> => {
    setIsRefreshingFilters(true)
    const requestBodyPayload = createRequestBodyPayload({
      accountIdentifier: "",
      isUpdate, data, projectIdentifier, orgIdentifier, createdByList: createdByListResponse?.data || []
    })
    const saveOrUpdateHandler = filterRef.current?.saveOrUpdateFilterHandler
    if (saveOrUpdateHandler && typeof saveOrUpdateHandler === 'function') {
      const updatedFilter = await saveOrUpdateHandler(isUpdate, requestBodyPayload)
      setAppliedFilter(updatedFilter)
    }
    await refetchFilterList()
    setIsRefreshingFilters(false)
  }

  const handleDelete = async (identifier: string): Promise<void> => {
    setIsRefreshingFilters(true)
    const deleteHandler = filterRef.current?.deleteFilterHandler
    if (deleteHandler && typeof deleteFilter === 'function') {
      await deleteHandler(identifier)
    }
    if (identifier === appliedFilter?.identifier) {
      reset()
    }
    await refetchFilterList()
    setIsRefreshingFilters(false)
  }

  const unsavedFilter = {
    name: UNSAVED_FILTER,
    identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER)
  }

  const handleFilterClick = (identifier: string): void => {
    if (identifier !== unsavedFilter.identifier) {
      const filter = getFilterByIdentifier(filters || [], identifier);
      setAppliedFilter(filter)
    }
  }

  useEffect(() => {
    setFilters(fetchedFilterResponse?.data?.content || [])
    setIsRefreshingFilters(isFetchingFilters)
  }, [fetchedFilterResponse])

  const handleFilterSelection = (
    option: SelectOption,
    event?: React.SyntheticEvent<HTMLElement, Event> | undefined
  ): void => {
    event?.stopPropagation()
    event?.preventDefault()
    /* istanbul ignore else */
    if (option.value) {
      const selectedFilter = getFilterByIdentifier((filters || []), option.value?.toString())
      setAppliedFilter(selectedFilter)
      const updatedQueryParams = {
        ...defaultQueryParams,
        searchTerm
      }
      refetchFileStoreList(updatedQueryParams, selectedFilter?.filterProperties)
    } else {
      reset()
    }
  }

  const [openFilterDrawer, hideFilterDrawer] = useModalHook(() => {
    const onFilterApply = (formData: Record<string, any>) => {
      if (!isObjectEmpty(formData)) {
        const filterFromFormData = {
          createdBy: formData.createdBy,
          referencedBy: formData.referencedBy,
          fileUsage: formData.fileUsage,
          tags: formData.tags,
        }
        refetchFileStoreList(defaultQueryParams, filterFromFormData)
        setAppliedFilter({ ...unsavedFilter, filterProperties: filterFromFormData })
        hideFilterDrawer()
      }
    }

    const { tags, fileUsage, createdBy } = (appliedFilter?.filterProperties as FilesFilterProperties) || {}
    const { name = '', filterVisibility } = appliedFilter || {}

    console.log(createdBy)

    return (
      <Filter<FileStoreFilterFormType, FilterDTO>
        onApply={onFilterApply}
        onClose={() => {
          hideFilterDrawer()
          refetchFilterList()
        }}
        filters={filters}
        initialFilter={{
          formValues: {
            tags,
            fileUsage,
            createdBy: typeof createdBy === 'string' ? createdBy : createdBy?.email
          },
          metadata: {
            name,
            filterVisibility: filterVisibility,
            identifier: appliedFilter?.identifier || '',
            filterProperties: {}
          }
        }}
        onSaveOrUpdate={handleSaveOrUpdate}
        onDelete={handleDelete}
        onFilterSelect={handleFilterClick}
        isRefreshingFilters={isRefreshingFilters}
        formFields={<FileStoreFilterForm/>}
        dataSvcConfig={
          new Map<CrudOperation, (...rest: any[]) => Promise<any>>([
            ['ADD', createFilter],
            ['UPDATE', updateFilter],
            ['DELETE', deleteFilter]
          ])
        }
        onSuccessfulCrudOperation={refetchFilterList}
        ref={filterRef}
        onClear={reset}
      />
    )
  }, [
    isRefreshingFilters,
    filters,
    appliedFilter,
    searchTerm,
    referencedByEntitySelected,
  ])

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('fileUsage', getString('filestore.filter.fileUsage'))
  fieldToLabelMapping.set('createdBy', getString('filestore.filter.createdBy'))
  fieldToLabelMapping.set('referencedBy', getString('filestore.filter.referencedBy'))
  fieldToLabelMapping.set('tags', getString('tagsLabel'))

  /* Through expandable filter text search */
  const debouncedFilesSearch = useCallback(
    debounce((query: string): void => {

      const updatedQueryParams = {
        defaultQueryParams,
        searchTerm: query
      }
      refetchFileStoreList(updatedQueryParams, appliedFilter?.filterProperties)

    }, 500),
    [refetchFileStoreList, appliedFilter?.filterProperties]
  )

  return (
    <>
      <Page.Header
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
        title={getString('resourcePage.fileStore')}
        content={
          <Layout.Horizontal margin={{ left: 'small' }}>
            <Container data-name="fileStoreSearchContainer">
              <ExpandingSearchInput
                alwaysExpanded
                width={200}
                placeholder={getString('search')}
                throttle={200}
                onChange={(query: string) => {
                  debouncedFilesSearch(encodeURIComponent(query))
                  setSearchTerm(query)
                }}
                className={css.expandSearch}
              />
            </Container>
            <FilterSelector<FilterDTO>
              appliedFilter={appliedFilter}
              filters={filters}
              onFilterBtnClick={openFilterDrawer}
              onFilterSelect={handleFilterSelection}
              fieldToLabelMapping={fieldToLabelMapping}
              filterWithValidFields={removeNullAndEmpty(
                pick(flattenObject(appliedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
              )}
            />
          </Layout.Horizontal>
        }
      />

      <Page.Body>
        {loading ? (
          <PageSpinner/>
        ) : (
          <>
            {!fileStore?.length ? (
              <EmptyNodeView
                title={getString('filestore.noFilesInStore')}
                description={getString('filestore.noFilesTitle')}
              />
            ) : (
              <Layout.Horizontal height="100%">
                <StoreExplorer fileStore={fileStore}/>
                <StoreView/>
              </Layout.Horizontal>
            )}
          </>
        )}
      </Page.Body>
    </>
  )
}

export default function FileStorePage(): React.ReactElement {
  return (
    <FileStoreContextProvider>
      <FileStore/>
    </FileStoreContextProvider>
  )
}
