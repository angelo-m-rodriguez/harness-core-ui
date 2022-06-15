/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption, SelectOption } from '@wings-software/uicore'
import { omit, startCase } from 'lodash-es'
import type { PipelineExecutionFilterProperties, FilterDTO } from 'services/pipeline-ng'

import { EXECUTION_STATUS } from '@pipeline/utils/statusHelpers'
import type { FilterDataInterface, FilterInterface } from '@common/components/Filter/Constants'
import { StringUtils } from '@common/exports'
import type { CIWebhookInfoDTO } from 'services/ci'

export interface DeploymentTypeContext {
  deploymentType?: MultiSelectOption[]
  infrastructureType?: string
  services?: MultiSelectOption[]
  environments?: MultiSelectOption[]
}

export interface BuildTypeContext {
  buildType?: BUILD_TYPE
  repositoryName?: string
  sourceBranch?: string
  targetBranch?: string
  branch?: string
  tag?: string
}

const exclusionList = [
  'buildType',
  'repositoryName',
  'sourceBranch',
  'targetBranch',
  'tag',
  'branch',
  'services',
  'environments',
  'deploymentType'
]

export const getValidFilterArguments = (formData: Record<string, any>): PipelineExecutionFilterProperties => {
  const {
    status,
    buildType,
    repositoryName,
    sourceBranch,
    targetBranch,
    branch,
    tag,
    services,
    environments,
    deploymentType,
    infrastructureType
  } = formData
  return Object.assign(omit(formData, ...exclusionList), {
    status: status?.map((statusOption: MultiSelectOption) => statusOption?.value),
    moduleProperties: {
      ci: getCIModuleProperties(buildType as BUILD_TYPE, {
        repositoryName,
        sourceBranch,
        targetBranch,
        branch,
        tag
      }),
      cd: {
        serviceDefinitionTypes: deploymentType,
        infrastructureType: infrastructureType,
        serviceIdentifiers: services?.map((service: MultiSelectOption) => service?.value),
        envIdentifiers: environments?.map((env: MultiSelectOption) => env?.value)
      }
    }
  })
}

export type PipelineExecutionFormType = Omit<PipelineExecutionFilterProperties, 'status'> & {
  status?: MultiSelectOption[]
} & BuildTypeContext &
  DeploymentTypeContext

export const createOption = (label: string, value: string, count?: number): MultiSelectOption => {
  const labelWithCount =
    count && count > 0
      ? label
          .concat(' ')
          .concat('(')
          .concat((count || '').toString())
          .concat(')')
      : label
  return {
    label: labelWithCount,
    value: value
  } as MultiSelectOption
}

export const getOptionsForMultiSelect = (): MultiSelectOption[] => {
  return Object.keys(EXECUTION_STATUS).map(key => {
    const text = EXECUTION_STATUS[parseInt(key)] || ''
    return createOption(startCase(text), text)
  })
}

export const createRequestBodyPayload = ({
  isUpdate,
  data,
  projectIdentifier,
  orgIdentifier
}: {
  isUpdate: boolean
  data: FilterDataInterface<PipelineExecutionFormType, FilterInterface>
  projectIdentifier: string
  orgIdentifier: string
}): FilterDTO => {
  const {
    metadata: { name: _name, filterVisibility, identifier },
    formValues
  } = data
  const {
    pipelineName,
    status: _statuses,
    timeRange,
    moduleProperties: _moduleProperties
  } = getValidFilterArguments(formValues)
  return {
    name: _name,
    identifier: isUpdate ? identifier : StringUtils.getIdentifierFromName(_name),
    filterVisibility: filterVisibility,
    projectIdentifier,
    orgIdentifier,
    filterProperties: {
      filterType: 'PipelineExecution',
      pipelineName: pipelineName || '',
      status: _statuses,
      timeRange: timeRange || [],
      moduleProperties: _moduleProperties as PipelineExecutionFilterProperties['moduleProperties']
    } as PipelineExecutionFilterProperties
  }
}

export const getCIModuleProperties = (buildType: BUILD_TYPE, contextInfo: BuildTypeContext): Record<string, any> => {
  const { repositoryName, sourceBranch, targetBranch, branch, tag } = contextInfo
  let moduleProperties = {}
  switch (buildType) {
    case BUILD_TYPE.PULL_OR_MERGE_REQUEST:
      moduleProperties = {
        ciExecutionInfoDTO: {
          event: 'pullRequest',
          pullRequest: { sourceBranch: sourceBranch, targetBranch: targetBranch }
        } as CIWebhookInfoDTO
      }
      break
    case BUILD_TYPE.BRANCH:
      moduleProperties = {
        branch: branch
      }
      break
    case BUILD_TYPE.TAG:
      moduleProperties = {
        tag: tag
      }
      break
  }

  return repositoryName ? Object.assign(moduleProperties, { repoName: repositoryName }) : moduleProperties
}

export const enum BUILD_TYPE {
  PULL_OR_MERGE_REQUEST = 'PULL_OR_MERGE_REQUEST',
  BRANCH = 'BRANCH',
  TAG = 'TAG'
}

export const getBuildType = (moduleProperties: {
  [key: string]: {
    [key: string]: any
  }
}): BUILD_TYPE | undefined => {
  const { branch, tag, ciExecutionInfoDTO } = moduleProperties?.ci || {}
  const { sourceBranch, targetBranch } = ciExecutionInfoDTO?.pullRequest || {}

  return sourceBranch && targetBranch
    ? BUILD_TYPE.PULL_OR_MERGE_REQUEST
    : branch
    ? BUILD_TYPE.BRANCH
    : tag
    ? BUILD_TYPE.TAG
    : undefined
}

export const getMultiSelectFormOptions = (values?: any[]): SelectOption[] | undefined => {
  return values?.map(item => {
    return { label: item.name ?? item, value: item.identifier ?? item }
  })
}

export const getFilterByIdentifier = (identifier: string, filters?: FilterDTO[]): FilterDTO | undefined =>
  filters?.find((filter: FilterDTO) => filter.identifier?.toLowerCase() === identifier.toLowerCase())
