/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { useGetInheritingChildScopeList } from 'services/cd-ng'
import { PrincipalScope } from '@common/interfaces/SecretsInterface'
import UserGroupRefScopeList from '../UserGroupRefScopeList'

const errorResponse = {
  status: 'ERROR',
  code: 'INVALID_REQUEST',
  message: 'Invalid request: User Group is not available kmpySmUISimoRrJL6NL73w:null:null:UG1',
  correlationId: '644c7d3d-0344-4cae-b3af-e3d4260c1ab9',
  detailedMessage: null,
  responseMessages: [
    {
      code: 'INVALID_REQUEST',
      level: 'ERROR',
      message: 'Invalid request: User Group is not available kmpySmUISimoRrJL6NL73w:null:null:UG1',
      exception: null,
      failureTypes: []
    }
  ],
  metadata: null
}

const blankInheritingChildScopeListData = {
  data: {
    status: 'SUCCESS',
    data: [],
    metaData: undefined,
    correlationId: '2217f4b6-92f7-439e-be4b-8d58187d2d4b'
  }
}

jest.mock('services/cd-ng')
const useGetInheritingChildScopeListMock = useGetInheritingChildScopeList as jest.MockedFunction<any>

jest.mock('framework/strings', () => ({
  ...(jest.requireActual('framework/strings') as any),
  useStrings: jest.fn().mockReturnValue({
    getString: jest.fn().mockImplementation(val => val)
  })
}))

describe('Scope list of a user group', () => {
  test('renders error module with retry', () => {
    const accountId = 'lorem',
      orgIdentifier = 'lorem',
      projectIdentifier = 'lorem',
      userGroupIdentifier = 'lorem',
      parentScope = PrincipalScope.ORG

    useGetInheritingChildScopeListMock.mockImplementation(() => {
      return {
        loading: false,
        error: errorResponse
      }
    })

    const { container } = render(
      <UserGroupRefScopeList {...{ accountId, orgIdentifier, projectIdentifier, userGroupIdentifier, parentScope }} />
    )

    expect(container).toHaveTextContent('Invalid request: User Group is not available')
  })

  test('renders blank results card', () => {
    const accountId = 'lorem',
      orgIdentifier = 'lorem',
      projectIdentifier = 'lorem',
      userGroupIdentifier = 'lorem',
      parentScope = PrincipalScope.ORG

    useGetInheritingChildScopeListMock.mockImplementation(() => {
      return blankInheritingChildScopeListData
    })

    const { container } = render(
      <UserGroupRefScopeList {...{ accountId, orgIdentifier, projectIdentifier, userGroupIdentifier, parentScope }} />
    )

    expect(container).toMatchSnapshot('Blank results card')
  })
})
