/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, PageSpinner } from '@harness/uicore'

import {
  Container,
  ExpandingSearchInput,
  FormInput,
  SelectOption,
} from "@wings-software/uicore";
import {pick} from "lodash-es";
import {useModalHook} from '@harness/use-modal'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { Page, StringUtils } from '@common/exports'
import type { ProjectPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useStrings } from 'framework/strings'

import EmptyNodeView from '@filestore/components/EmptyNodeView/EmptyNodeView'
import StoreExplorer from '@filestore/components/StoreExplorer/StoreExplorer'
import StoreView from '@filestore/components/StoreView/StoreView'
import { FileStoreContext, FileStoreContextProvider } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import {
  FilesFilterProperties,
  FileStoreNodeDTO,
  FilterDTO,
  GetFolderNodesQueryParams,
  GetReferencedByInScopeQueryParams,
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
  flattenObject,
  isObjectEmpty,
  removeNullAndEmpty,
  UNSAVED_FILTER
} from "@common/components/Filter/utils/FilterUtils";
import {
  createRequestBodyPayload, FileStoreFilterFormType,
} from "@filestore/utils/RequestUtils";
import {Filter, FilterRef} from "@common/components/Filter/Filter";
import type {CrudOperation} from "@common/components/Filter/FilterCRUD/FilterCRUD";
import type {FilterDataInterface, FilterInterface} from "@common/components/Filter/Constants";
import css from "./FileStorePage.module.scss";

const fileUsageOptions: SelectOption[] = [
  {
    label: "MANIFEST_FILE",
    value: "MANIFEST_FILE"
  },
  {
    label: "CONFIG",
    value: "CONFIG"
  },
  {
    label: "SCRIPT",
    value: "SCRIPT"
  }
]

const FileStore: React.FC = () => {
  const params = useParams<PipelineType<ProjectPathProps>>()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterDTO[]>()
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)
  const [createdByOptions, setCreatedByOptions] = useState<SelectOption[]>([])
  const [referencedByOptions, setReferencedByOptions] = useState<SelectOption[]>([])
  const [referenceNameOptions, setReferenceNameOptions] = useState<SelectOption[]>([])
  const [referencedByEntitySelected, setReferencedByEntitySelected] = useState<string>()
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | null>()
  const { accountId, orgIdentifier, projectIdentifier } = params
  const { getString } = useStrings()
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)
  const { fileStore, setFileStore, setCurrentNode } = useContext(FileStoreContext)

  const defaultQueryParams: GetFolderNodesQueryParams = {
    projectIdentifier,
    orgIdentifier,
    accountIdentifier: accountId
  }

  const { mutate: getRootNodes, loading } = useGetFolderNodes({
    queryParams: defaultQueryParams
  })

  const { data : createdByListResponse } = useGetCreatedByList( { queryParams: defaultQueryParams })

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

  const { mutate: getFilesWithFilter } = useListFilesWithFilter( { queryParams:  defaultQueryParams })

  const reset = (): void => {
    refetchFileStoreList(defaultQueryParams)
    setAppliedFilter(undefined)
  }

  const { data: referencedByListForScopeResponse } = useGetReferencedByInScope({ queryParams: {
      ...defaultQueryParams,
      entityType: referencedByEntitySelected as GetReferencedByInScopeQueryParams["entityType"]
    }
  })

  useEffect(() => {
    const referenceNameOptions: SelectOption[] = (referencedByListForScopeResponse?.data?.content || []).map((entity) => ({
      label: entity.referredEntity?.name || '',
      value: entity.referredEntity?.entityRef?.identifier || ''
    }))

    setReferenceNameOptions(referenceNameOptions)
  }, [referencedByListForScopeResponse])

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
        <FormInput.KVTagInput name="tags" label={getString('tagsLabel')} key="tags" />
        <FormInput.Select
          items={createdByOptions}
          name="createdBy"
          label={getString('filestore.filter.createdBy')}
          key="createdBy"
        />
        <FormInput.Select
          items={referencedByOptions}
          onChange={val => setReferencedByEntitySelected(val.value as string)}
          name="referencedBy"
          label={getString('filestore.filter.referencedBy')}
          key="referencedBy"
        />
        {
          referencedByEntitySelected &&
          <FormInput.Select
            style={ { marginLeft: 20, paddingLeft: 20, borderLeft: "1px solid #CBCBCB" }}
            items={referenceNameOptions}
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
      params?: GetFolderNodesQueryParams,
      filter?: FilesFilterProperties
    ): Promise<void> => {
      const { tags, fileUsage, createdBy } = filter || {}

      const requestBodyPayload = Object.assign(
        filter
          ? {
            tags,
            fileUsage,
            createdBy: (createdByListResponse?.data || []).find(user => createdBy === user.email)
          }
          : {},
        {
          filterType: 'FileStore'
        }
      ) as FilesFilterProperties
      const sanitizedFilterRequest = removeNullAndEmpty(requestBodyPayload)

      try {
        const { status, data } = await getFilesWithFilter(sanitizedFilterRequest, { queryParams: params })
        /* istanbul ignore else */ if (status === 'SUCCESS') {

          const filteredFiles : FileStoreNodeDTO[] = data?.content?.map(file => ({
            identifier: file.identifier,
            lastModifiedBy: file.createdBy,
            name: file.name,
            parentIdentifier: file.parentIdentifier,
            type: file.type
          })) || []

          setFileStore(filteredFiles)
        }
      } /* istanbul ignore next */ catch (e) {

      }
    },
    [getRootNodes, createdByListResponse]
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
      isUpdate, data, projectIdentifier, orgIdentifier, createdByList : createdByListResponse?.data || [] })
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

      const filter = getFilterByIdentifier(identifier);

      setAppliedFilter(filter)
    }
  }

  const getFilterByIdentifier = (identifier: string): FilterDTO | undefined =>
    /* istanbul ignore if */
    filters?.find((filter: FilterDTO) => filter.identifier?.toLowerCase() === identifier.toLowerCase())

  useEffect(() => {
    setFilters(fetchedFilterResponse?.data?.content || [])
    setIsRefreshingFilters(isFetchingFilters)
  }, [fetchedFilterResponse])

  useEffect(() => {
    const createdByOptions: SelectOption[] = (createdByListResponse?.data || []).map(user =>  ({
          label: user.name || '',
          value: user.email || ''
        })
    )

    setCreatedByOptions(createdByOptions)
  }, [createdByListResponse])

  useEffect(() => {
    const referencedByOptions: SelectOption[] = (entityTypeResponse?.data || []).map(entityType =>  ({
        label: entityType,
        value: entityType
      })
    )

    setReferencedByOptions(referencedByOptions)
  }, [entityTypeResponse])

  const handleFilterSelection = (
    option: SelectOption,
    event?: React.SyntheticEvent<HTMLElement, Event> | undefined
  ): void => {
    event?.stopPropagation()
    event?.preventDefault()
    /* istanbul ignore else */
    if (option.value) {
      const selectedFilter = getFilterByIdentifier(option.value?.toString())
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
        setAppliedFilter({...unsavedFilter, filterProperties: filterFromFormData})
        hideFilterDrawer()
      }
    }

    const { tags, fileUsage, createdBy } = (appliedFilter?.filterProperties as FilesFilterProperties) || {}
    const { name = '', filterVisibility } = appliedFilter || {}

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
            createdBy: createdBy?.email || undefined
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
        formFields={<FileStoreFilterForm />}
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
    createdByOptions,
    referencedByOptions,
    referencedByEntitySelected,
    referenceNameOptions
  ])

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('tags', getString('tagsLabel'))

  return (
    <div className={css.fileStore}>
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
          <PageSpinner />
        ) : (
          <>
            {!fileStore?.length ? (
              <EmptyNodeView
                title={getString('filestore.noFilesInStore')}
                description={getString('filestore.noFilesTitle')}
              />
            ) : (
              <Layout.Horizontal height="100%">
                <StoreExplorer fileStore={fileStore} />
                <StoreView />
              </Layout.Horizontal>
            )}
          </>
        )}
      </Page.Body>
    </div>
  )
}

export default function FileStorePage(): React.ReactElement {
  return (
    <FileStoreContextProvider>
      <FileStore />
    </FileStoreContextProvider>
  )
}
