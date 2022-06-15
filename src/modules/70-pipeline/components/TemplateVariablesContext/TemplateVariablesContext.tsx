/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get } from 'lodash-es'
import { parse } from 'yaml'
import { useMutateAsGet, useQueryParams } from '@common/hooks'
import type { GitQueryParams, TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import {
  Failure,
  NGTemplateInfoConfig,
  useCreateVariables,
  useGetYamlWithTemplateRefsResolved,
  VariableMergeServiceResponse
} from 'services/template-ng'
import type { UseMutateAsGetReturn } from '@common/hooks/useMutateAsGet'
import type { StageElementConfig, StepElementConfig } from 'services/cd-ng'
import type { AllNGVariables } from '@pipeline/utils/types'

const monitoredServiceYamlKey = 'monitoredService'

export interface MonitoredServiceConfig {
  environmentRef: string
  identifier: string
  name: string
  serviceRef: string
  sources: string
  type: string
  variables: AllNGVariables[]
  __uuid: string
  spec?: any
}

export interface TemplateVariablesData {
  variablesTemplate: StepElementConfig | StageElementConfig | MonitoredServiceConfig
  originalTemplate: NGTemplateInfoConfig
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  error?: UseMutateAsGetReturn<Failure | Error>['error'] | null
  initLoading: boolean
  loading: boolean
}

export const TemplateVariablesContext = React.createContext<TemplateVariablesData>({
  variablesTemplate: { name: '', identifier: '' },
  originalTemplate: { name: '', identifier: '', versionLabel: '', type: 'Step' },
  metadataMap: {},
  error: null,
  initLoading: true,
  loading: false
})

export function useTemplateVariables(): TemplateVariablesData {
  return React.useContext(TemplateVariablesContext)
}

export function TemplateVariablesContextProvider(
  props: React.PropsWithChildren<{ template: NGTemplateInfoConfig }>
): React.ReactElement {
  const { template: originalTemplate } = props
  const [{ variablesTemplate, metadataMap }, setTemplateVariablesData] = React.useState<
    Pick<TemplateVariablesData, 'metadataMap' | 'variablesTemplate'>
  >({
    variablesTemplate: { name: '', identifier: '' },
    metadataMap: {}
  })
  const { accountId, orgIdentifier, projectIdentifier } = useParams<TemplateStudioPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [resolvedTemplate, setResolvedTemplate] = React.useState<NGTemplateInfoConfig>(originalTemplate)

  const { data, error, initLoading, loading } = useMutateAsGet(useCreateVariables, {
    body: yamlStringify({ template: resolvedTemplate }) as unknown as void,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    },
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    debounce: 800
  })

  const {
    data: resolvedTemplateResponse,
    initLoading: initLoadingResolvedTemplate,
    loading: loadingResolvedTemplate
  } = useMutateAsGet(useGetYamlWithTemplateRefsResolved, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    },
    body: {
      originalEntityYaml: yamlStringify(originalTemplate)
    }
  })

  React.useEffect(() => {
    if (resolvedTemplateResponse?.data?.mergedPipelineYaml) {
      setResolvedTemplate(parse(resolvedTemplateResponse.data.mergedPipelineYaml))
    }
  }, [resolvedTemplateResponse])

  React.useEffect(() => {
    const templateType =
      resolvedTemplate.type.toLowerCase() === monitoredServiceYamlKey.toLowerCase()
        ? monitoredServiceYamlKey
        : resolvedTemplate.type.toLowerCase()
    setTemplateVariablesData({
      metadataMap: defaultTo(data?.data?.metadataMap, {}),
      variablesTemplate: get(parse(defaultTo(data?.data?.yaml, '')), templateType)
    })
  }, [data?.data?.metadataMap, data?.data?.yaml])

  return (
    <TemplateVariablesContext.Provider
      value={{
        variablesTemplate,
        originalTemplate: resolvedTemplate,
        metadataMap,
        error,
        initLoading: initLoading || initLoadingResolvedTemplate,
        loading: loading || loadingResolvedTemplate
      }}
    >
      {props.children}
    </TemplateVariablesContext.Provider>
  )
}
