/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo } from 'react'
import { Layout, shouldShowError, useToaster } from '@harness/uicore'

import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty } from 'lodash-es'
import {
  useGetConnectorListV2,
  PageConnectorResponse,
  useGetServiceV2,
  ServiceResponseDTO,
  NGServiceConfig
} from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'

import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { getIdentifierFromValue, getScopeFromValue } from '@common/components/EntityReference/EntityReference'
import { isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'

import type { Scope } from '@common/interfaces/SecretsInterface'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { useDeepCompareEffect } from '@common/hooks'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import type { ManifestSelectionProps } from './ManifestInterface'
import ManifestListView from './ManifestListView/ManifestListView'

export default function ManifestSelection({
  isPropagating,
  deploymentType,
  readonly: isReadOnlyServiceMode
}: ManifestSelectionProps): JSX.Element | null {
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updateStage,
    allowableTypes,
    isReadonly
  } = usePipelineContext()

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const [fetchedConnectorResponse, setFetchedConnectorResponse] = React.useState<PageConnectorResponse | undefined>()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const { accountId, orgIdentifier, projectIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()
  const defaultQueryParams = {
    pageIndex: 0,
    pageSize: 10,
    searchTerm: '',
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    includeAllConnectorsAvailableAtScope: true
  }
  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  /*************************************Service Entity Related code********************************************************/
  // This is temporary code to fetch the manifest data from service api. It will be replaced once caching is implemented for service entity
  const {
    data: selectedServiceResponse,
    refetch: refetchServiceData,
    loading: serviceLoading
  } = useGetServiceV2({
    serviceIdentifier: (stage?.stage?.spec as any)?.service?.serviceRef,
    queryParams: { accountIdentifier: accountId, orgIdentifier: orgIdentifier, projectIdentifier: projectIdentifier },
    lazy: true
  })

  useEffect(() => {
    if (!isReadonly && isReadOnlyServiceMode) {
      refetchServiceData()
    }
  }, [isReadOnlyServiceMode, (stage?.stage?.spec as any)?.service?.serviceRef])

  /*************************************Service Entity Related code********************************************************/

  const listOfManifests = useMemo(() => {
    if (!isReadonly && isReadOnlyServiceMode) {
      const serviceData = selectedServiceResponse?.data?.service as ServiceResponseDTO
      if (!isEmpty(serviceData?.yaml)) {
        const parsedYaml = yamlParse<NGServiceConfig>(defaultTo(serviceData.yaml, ''))
        const serviceInfo = parsedYaml.service?.serviceDefinition
        return serviceInfo?.spec.manifests
      }
      return []
    }
    if (isPropagating) {
      return get(stage, 'stage.spec.serviceConfig.stageOverrides.manifests', [])
    }

    return get(stage, 'stage.spec.serviceConfig.serviceDefinition.spec.manifests', [])
  }, [isPropagating, isReadonly, isReadOnlyServiceMode, selectedServiceResponse?.data?.service])

  useDeepCompareEffect(() => {
    refetchConnectorList()
  }, [stage, listOfManifests])

  const getConnectorList = (): Array<{ scope: Scope; identifier: string }> => {
    return listOfManifests?.length
      ? listOfManifests.map((data: any) => ({
          scope: getScopeFromValue(data?.manifest?.spec?.store?.spec?.connectorRef),
          identifier: getIdentifierFromValue(data?.manifest?.spec?.store?.spec?.connectorRef)
        }))
      : []
  }

  const refetchConnectorList = async (): Promise<void> => {
    try {
      const connectorList = getConnectorList()
      const connectorIdentifiers = connectorList.map((item: { scope: string; identifier: string }) => item.identifier)
      const response = await fetchConnectors({ filterType: 'Connector', connectorIdentifiers })
      if (response?.data) {
        const { data: connectorResponse } = response
        setFetchedConnectorResponse(connectorResponse)
      }
    } catch (e) {
      if (shouldShowError(e)) {
        showError(getRBACErrorMessage(e))
      }
    }
  }

  if (serviceLoading) {
    return null
  }

  return (
    <Layout.Vertical>
      <ManifestListView
        isPropagating={isPropagating}
        pipeline={pipeline}
        updateStage={updateStage}
        stage={stage}
        connectors={fetchedConnectorResponse}
        refetchConnectors={refetchConnectorList}
        listOfManifests={listOfManifests}
        isReadonly={isReadOnlyServiceMode}
        deploymentType={deploymentType}
        allowableTypes={allowableTypes}
        allowOnlyOne={isServerlessDeploymentType(deploymentType)}
      />
    </Layout.Vertical>
  )
}
