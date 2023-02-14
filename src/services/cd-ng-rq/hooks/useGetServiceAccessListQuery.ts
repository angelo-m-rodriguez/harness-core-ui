/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { ResponseListServiceResponse } from '../schemas/ResponseListServiceResponse'
import type { Failure } from '../schemas/Failure'
import type { Error } from '../schemas/Error'
import { fetcher, FetcherOptions } from 'services/fetcher'

export interface GetServiceAccessListQueryQueryParams {
  /**
   * @format int32
   * @default 0
   */
  page?: number
  /**
   * @format int32
   * @default 100
   */
  size?: number
  accountIdentifier: string
  orgIdentifier?: string
  projectIdentifier?: string
  searchTerm?: string
  serviceIdentifiers?: string[]
  sort?: string[]
  type?:
    | 'Asg'
    | 'AwsLambda'
    | 'AzureWebApp'
    | 'CustomDeployment'
    | 'ECS'
    | 'Elastigroup'
    | 'GoogleCloudFunctions'
    | 'Kubernetes'
    | 'NativeHelm'
    | 'ServerlessAwsLambda'
    | 'Ssh'
    | 'TAS'
    | 'WinRm'
  gitOpsEnabled?: boolean
  deploymentTemplateIdentifier?: string
  versionLabel?: string
}

export type GetServiceAccessListOkResponse = ResponseListServiceResponse

export type GetServiceAccessListErrorResponse = Failure | Error

export interface GetServiceAccessListProps
  extends Omit<FetcherOptions<GetServiceAccessListQueryQueryParams, unknown>, 'url'> {
  queryParams: GetServiceAccessListQueryQueryParams
}

export function getServiceAccessList(props: GetServiceAccessListProps): Promise<GetServiceAccessListOkResponse> {
  const { ...rest } = props

  return fetcher<GetServiceAccessListOkResponse, GetServiceAccessListQueryQueryParams, unknown>({
    url: `ng/api/servicesV2/list/access`,
    method: 'GET',
    ...rest
  })
}

/**
 *
 */
export function useGetServiceAccessListQuery(
  props: GetServiceAccessListProps,
  options?: Omit<
    UseQueryOptions<GetServiceAccessListOkResponse, GetServiceAccessListErrorResponse>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetServiceAccessListOkResponse, GetServiceAccessListErrorResponse>(
    ['getServiceAccessList', props.queryParams],
    ({ signal }) => getServiceAccessList({ ...props, signal }),
    options
  )
}
