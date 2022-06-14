/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useModalHook } from '@harness/use-modal'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, pick } from 'lodash-es'
import {
  Container,
  FormInput,
  getErrorInfoFromErrorObject,
  MultiSelectOption,
  SelectOption,
  useToaster
} from '@harness/uicore'
import {
  FilterDTO,
  useDeleteRuleFilter,
  useGetRulesMetadata,
  useSaveRuleFilter,
  useUpdateRuleFilter,
  useGetAllRuleFilters
} from 'services/lw'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import {
  GetAggregatedUsersQueryParams,
  GetConnectorListV2QueryParams,
  useGetAggregatedUsers,
  useGetConnectorListV2,
  UserAggregate,
  ConnectorResponse
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { allCloudProvidersList, GatewayKindType } from '@ce/constants'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import { flattenObject, removeNullAndEmpty, UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import { StringUtils } from '@common/exports'
import type { FilterDataInterface } from '@common/components/Filter/Constants'
import { Utils } from '@ce/common/Utils'

interface GatewayListFiltersProps {
  applyFilter: (filter?: FilterDTO) => void
  appliedFilter?: FilterDTO
}

const getMultiSelectOptionsValueMap = (data: MultiSelectOption[]) => {
  const map: { [key: string]: MultiSelectOption } = {}
  data.forEach(item => {
    map[item.value as string] = item
  })
  return map
}

interface RulesFilterFormProps {
  connectors: MultiSelectOption[]
  users: MultiSelectOption[]
  namespaces: MultiSelectOption[]
  resourceTypes: MultiSelectOption[]
  serviceProviders: MultiSelectOption[]
}

const RulesFilterForm: React.FC<RulesFilterFormProps> = ({
  connectors,
  users,
  namespaces,
  resourceTypes,
  serviceProviders
}) => {
  const { getString } = useStrings()

  return (
    <Container>
      <FormInput.MultiSelect
        items={connectors}
        name="cloud_account_id"
        multiSelectProps={{
          allowCreatingNewItems: false
        }}
        label={getString('connector')}
      />
      <FormInput.MultiSelect
        items={serviceProviders}
        name="service_provider"
        multiSelectProps={{
          allowCreatingNewItems: false
        }}
        label={getString('cloudProviders')}
      />
      <FormInput.MultiSelect
        items={resourceTypes}
        name="resource_kind"
        label={getString('ce.co.filters.resourceTypeLabelWithExample')}
        multiSelectProps={{
          allowCreatingNewItems: false
        }}
      />
      <FormInput.MultiSelect
        items={users}
        name="created_by"
        label={getString('createdBy')}
        multiSelectProps={{
          allowCreatingNewItems: false
        }}
      />
      <FormInput.MultiSelect
        items={namespaces}
        label={getString('ce.co.filters.namespaceLabel')}
        name="namespace"
        multiSelectProps={{
          allowCreatingNewItems: false
        }}
      />
    </Container>
  )
}

interface GatewayListFilterDrawerProps {
  savedFilters: FilterDTO[]
  closeFilterDrawer: () => void
  setSelectedFilter: (filter: FilterDTO) => void
  refetchSavedFilters: () => Promise<void>
  selectedFilter?: FilterDTO
  applyFilter: (filter: FilterDTO) => void
  connectors: MultiSelectOption[]
  users: MultiSelectOption[]
  connectorToIdMap: { [key: string]: MultiSelectOption }
  userToIdMap: { [key: string]: MultiSelectOption }
  resourceTypes: MultiSelectOption[]
}

const GatewayListFilterDrawer: React.FC<GatewayListFilterDrawerProps> = ({
  savedFilters,
  closeFilterDrawer,
  setSelectedFilter,
  refetchSavedFilters,
  selectedFilter,
  applyFilter,
  connectors,
  users,
  connectorToIdMap,
  userToIdMap,
  resourceTypes
}) => {
  const { accountId } = useParams<AccountPathProps>()
  const { showError } = useToaster()
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)

  const [loading, setLoading] = useState(false)

  const { mutate: createFilter } = useSaveRuleFilter({ account_id: accountId })

  const { mutate: updateFilter } = useUpdateRuleFilter({ account_id: accountId })

  const { mutate: deleteFilter } = useDeleteRuleFilter({ account_id: accountId })

  const { data: metadata } = useGetRulesMetadata({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const namespaces: MultiSelectOption[] = defaultTo(get(metadata, 'response.namespaces', []), []).map(
    (item: string) => ({
      label: item,
      value: item
    })
  )

  const onFilterSelect = (identifier: string) => {
    /* istanbul ignore else */
    if (identifier !== UNSAVED_FILTER) {
      const filter = savedFilters.find(filtr => filtr.identifier === identifier)
      if (filter) {
        setSelectedFilter(filter)
      }
    }
  }

  const getFormValuesFromFilterData = () => {
    const values: { [key: string]: any } = {}
    const { cloud_account_id, created_by, resource_kind, namespace, service_provider } = get(
      selectedFilter,
      'data',
      {}
    ) as {
      [key: string]: any
    }

    if (cloud_account_id && !isEmpty(connectorToIdMap)) {
      values.cloud_account_id = cloud_account_id.map((id: string) => connectorToIdMap[id])
    }
    if (created_by && !isEmpty(userToIdMap)) {
      values.created_by = created_by.map((id: string) => userToIdMap[id])
    }
    if (resource_kind) {
      values.resource_kind = resource_kind.map((kindType: string) => {
        return resourceTypes.find(rt => rt.value === kindType)
      })
    }
    if (namespace) {
      values.namespace = namespace.map((item: string) => ({ label: item, value: item }))
    }
    if (service_provider) {
      values.service_provider = service_provider.map((item: string) =>
        allCloudProvidersList.find(provider => provider.value === item)
      )
    }
    return values
  }

  const getFilterPropertiesFromFormValues = (formValues: { [key: string]: any }) => {
    const properties: { [key: string]: any } = {}
    Object.entries(formValues)
      .filter(([, value]) => !isEmpty(value))
      .forEach(([key, value]) => {
        properties[key] = Array.isArray(value) ? value.map(item => item.value) : /* istanbul ignore next */ value
      })
    return properties
  }

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<RulesFilterFormProps, FilterDTO>
  ): Promise<void> => {
    setLoading(true)
    const saveOrUpdateHandler = get(filterRef, 'current.saveOrUpdateFilterHandler')
    try {
      const filterProperties = getFilterPropertiesFromFormValues(data.formValues)
      if (isEmpty(filterProperties)) {
        /* istanbul ignore next */
        throw new Error(`Empty filter can't be saved.`)
      }
      /* istanbul ignore else */
      if (saveOrUpdateHandler && typeof saveOrUpdateHandler === 'function') {
        const payload = {
          ...data.metadata,
          identifier: Utils.getConditionalResult(isUpdate, data.metadata.identifier, undefined),
          type: 'rule',
          data: filterProperties
        }
        await saveOrUpdateHandler(isUpdate, payload as FilterDTO)
      }
      await refetchSavedFilters()
    } catch (err) {
      /* istanbul ignore next */
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* istanbul ignore next */
  const handleDelete = async (identifier: string): Promise<void> => {
    setLoading(true)
    const deleteHandler = get(filterRef, 'current.deleteFilterHandler')
    if (deleteHandler && typeof deleteFilter === 'function') {
      await deleteHandler(identifier)
    }
    await refetchSavedFilters()
    setLoading(false)
    if (identifier === selectedFilter?.identifier) {
      setSelectedFilter({
        name: UNSAVED_FILTER,
        identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
        data: {}
      })
      onClear()
    }
  }

  const onFilterApply = (formData: { [key: string]: any }) => {
    const filterData = getFilterPropertiesFromFormValues(formData)
    applyFilter({
      name: UNSAVED_FILTER,
      identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
      data: filterData
    })
  }

  const onClear = () => {
    applyFilter({
      name: UNSAVED_FILTER,
      identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER),
      data: {}
    })
  }

  return (
    <Filter<RulesFilterFormProps, FilterDTO>
      ref={filterRef}
      filters={savedFilters}
      isRefreshingFilters={loading}
      formFields={
        <RulesFilterForm
          connectors={connectors}
          users={users}
          namespaces={namespaces}
          resourceTypes={resourceTypes}
          serviceProviders={allCloudProvidersList}
        />
      }
      initialFilter={{
        formValues: getFormValuesFromFilterData() as RulesFilterFormProps,
        metadata: {
          name: get(selectedFilter, 'name', ''),
          identifier: get(selectedFilter, 'identifier', ''),
          filterVisibility: get(selectedFilter, 'filterVisibility'),
          data: {}
        }
      }}
      onApply={onFilterApply}
      onClose={closeFilterDrawer}
      onDelete={handleDelete}
      onFilterSelect={onFilterSelect}
      onSaveOrUpdate={handleSaveOrUpdate}
      onClear={onClear}
      dataSvcConfig={
        new Map<CrudOperation, (...rest: any[]) => Promise<any>>([
          ['ADD', createFilter],
          ['UPDATE', updateFilter],
          ['DELETE', deleteFilter]
        ])
      }
    />
  )
}

const GatewayListFilters: React.FC<GatewayListFiltersProps> = ({ applyFilter, appliedFilter }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const unsavedFilter = {
    name: UNSAVED_FILTER,
    identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER)
  }
  const defaultQueryParams: GetConnectorListV2QueryParams = {
    pageIndex: 0,
    pageSize: 100,
    accountIdentifier: accountId,
    searchTerm: ''
  }
  const fetchUsersDefaultQueryParams: GetAggregatedUsersQueryParams = {
    pageIndex: 0,
    pageSize: 100,
    accountIdentifier: accountId
  }

  const [selectedFilter, setSelectedFilter] = useState<FilterDTO>({
    ...unsavedFilter,
    ...(appliedFilter as FilterDTO)
  })
  const [connectors, setConnectors] = useState<MultiSelectOption[]>([])
  const [users, setUsers] = useState<MultiSelectOption[]>([])

  const { data: allFiltersData, refetch: refetchSavedFilters } = useGetAllRuleFilters({
    account_id: accountId,
    filterType: 'rule',
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const { mutate: fetchAllUsers } = useGetAggregatedUsers({
    queryParams: fetchUsersDefaultQueryParams
  })

  const savedFilters = defaultTo(get(allFiltersData, 'response'), [])

  const connectorToIdMap: { [key: string]: MultiSelectOption } = useMemo(
    () => getMultiSelectOptionsValueMap(connectors),
    [connectors]
  )
  const userToIdMap = useMemo(() => getMultiSelectOptionsValueMap(users), [users])

  const resourceTypes: MultiSelectOption[] = useMemo(
    () => [
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.ec2Vms'),
        value: `aws.${GatewayKindType.INSTANCE}`
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.azureVms'),
        value: `azure.${GatewayKindType.INSTANCE}`
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.gcpVms'),
        value: `gcp.${GatewayKindType.INSTANCE}`
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.asg'),
        value: `aws.${GatewayKindType.CLUSTERS}`
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.ig'),
        value: `gcp.${GatewayKindType.CLUSTERS}`
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.kubernetes'),
        value: GatewayKindType.KUBERNETES
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.ecsService'),
        value: GatewayKindType.CONTAINERS
      },
      {
        label: getString('ce.co.autoStoppingRule.helpText.step2.description.resourceList.rdsInstances'),
        value: GatewayKindType.DATABASE
      }
    ],
    [getString]
  )

  useEffect(() => {
    fetchAndSetConnectors()
    fetchAndSetUsers()
  }, [])

  useEffect(() => {
    /* istanbul ignore else */
    if (!isEmpty(savedFilters) && appliedFilter?.identifier !== unsavedFilter.identifier) {
      const usedFilter = savedFilters.find(item => item.identifier === selectedFilter.identifier)
      if (usedFilter) {
        setSelectedFilter(usedFilter)
      }
    }
  }, [savedFilters])

  const fetchAndSetUsers = async () => {
    try {
      const response = await fetchAllUsers({})
      const content = defaultTo(get(response, 'data.content', []), []).map((item: UserAggregate) => ({
        label: item.user.name as string,
        value: item.user.uuid as string
      }))
      setUsers(content)
    } catch (e) {
      /* istanbul ignore next */
      showError(getErrorInfoFromErrorObject(e))
    }
  }

  const fetchAndSetConnectors = async () => {
    try {
      const { data: connectorResponse } = await fetchConnectors({
        filterType: 'Connector',
        types: ['CEAws', 'CEAzure', 'CEK8sCluster', 'GcpCloudCost'] // only CCM connectors
      })
      const content = defaultTo(get(connectorResponse, 'content', []), []).map((item: ConnectorResponse) => ({
        label: get(item, 'connector.name', ''),
        value: get(item, 'connector.identifier', '')
      }))
      setConnectors(content)
    } catch (e) {
      /* istanbul ignore next */
      showError(getErrorInfoFromErrorObject(e))
    }
  }

  const handleFilterSelect = (filter: SelectOption) => {
    const filterToUse = defaultTo(
      savedFilters.find(item => item.identifier === filter.value),
      { ...unsavedFilter, data: {} }
    )
    setSelectedFilter(filterToUse)
    applyFilter(filterToUse)
  }

  const handleApplyFilter = (filter: FilterDTO) => {
    closeFilterDrawer()
    setSelectedFilter(filter)
    applyFilter(filter)
  }

  const fieldToLabelMapping = new Map<string, string>([
    ['cloud_account_id', getString('connector')],
    ['resource_kind', getString('common.resourceTypeLabel')],
    ['created_by', getString('createdBy')],
    ['namespace', getString('ce.co.filters.namespaceLabel')],
    ['service_provider', getString('cloudProviders')]
  ])

  const filterWithValidFields = useMemo(() => {
    const values = removeNullAndEmpty(
      pick(flattenObject(get(selectedFilter, 'data', {})), ...fieldToLabelMapping.keys())
    )
    if (values.cloud_account_id) {
      values.cloud_account_id = values.cloud_account_id.map((id: string) => connectorToIdMap[id]?.label)
    }
    if (values.created_by) {
      values.created_by = values.created_by.map((id: string) => userToIdMap[id]?.label)
    }
    if (values.resource_kind) {
      values.resource_kind = values.resource_kind.map(
        (id: string) => resourceTypes.find(item => item.value === id)?.label
      )
    }
    if (values.service_provider) {
      values.service_provider = values.service_provider.map(
        (id: string) => allCloudProvidersList.find(provider => provider.value === id)?.label
      )
    }
    return values
  }, [selectedFilter, connectorToIdMap, userToIdMap])

  const [openFilterDrawer, closeFilterDrawer] = useModalHook(() => {
    return (
      <GatewayListFilterDrawer
        savedFilters={savedFilters}
        closeFilterDrawer={closeFilterDrawer}
        refetchSavedFilters={refetchSavedFilters}
        setSelectedFilter={setSelectedFilter}
        selectedFilter={selectedFilter}
        applyFilter={handleApplyFilter}
        connectors={connectors}
        users={users}
        connectorToIdMap={connectorToIdMap}
        userToIdMap={userToIdMap}
        resourceTypes={resourceTypes}
      />
    )
  }, [savedFilters, selectedFilter, connectors, users, connectorToIdMap, userToIdMap])

  return (
    <FilterSelector<FilterDTO>
      appliedFilter={selectedFilter}
      fieldToLabelMapping={fieldToLabelMapping}
      filterWithValidFields={filterWithValidFields}
      filters={savedFilters}
      onFilterBtnClick={openFilterDrawer}
      onFilterSelect={handleFilterSelect}
    />
  )
}

export default GatewayListFilters
