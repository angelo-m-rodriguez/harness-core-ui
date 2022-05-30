/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as Portal from 'services/portal'
import * as cdServices from 'services/cd-ng'

const regionMock = {
  resource: [
    {
      name: 'GovCloud (US-West)',
      value: 'us-gov-west-1'
    },
    {
      name: 'GovCloud (US-East)',
      value: 'us-gov-east-1'
    }
  ]
}

const capMock = {
  data: ['test', 'test-two']
}

const statusMock = {
  data: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
}

export const useCFCapabilitiesForAws = (error = false, loading = false) => {
  return jest.spyOn(cdServices, 'useCFCapabilitiesForAws').mockImplementation(
    () =>
      ({
        loading,
        error: error && { message: 'useCFCapabilitiesForAws error' },
        data: !error && capMock,
        refetch: jest.fn()
      } as any)
  )
}
export const useListAwsRegions = (error = false, loading = false) => {
  return jest.spyOn(Portal, 'useListAwsRegions').mockImplementation(
    () =>
      ({
        loading,
        error: error && { message: 'useListAwsRegions error' },
        data: !error && regionMock,
        refetch: jest.fn()
      } as any)
  )
}
export const useCFStatesForAws = (error = false, loading = false) => {
  return jest.spyOn(cdServices, 'useCFStatesForAws').mockImplementation(
    () =>
      ({
        loading,
        error: error && { message: 'useCFStatesForAws error' },
        data: !error && statusMock,
        refetch: jest.fn()
      } as any)
  )
}
export const useGetIamRolesForAws = (error?: boolean) => {
  return jest.spyOn(cdServices, 'useGetIamRolesForAws').mockImplementation(
    () =>
      ({
        loading: false,
        error: error && { message: 'useGetIamRolesForAws error' },
        data: !error && { data: { iamRole: 'test' } },
        refetch: jest.fn()
      } as any)
  )
}
export const useGetConnector = () => {
  return jest
    .spyOn(cdServices, 'useGetConnector')
    .mockImplementation(() => ({ loading: false, error: null, data: {} } as any))
}
