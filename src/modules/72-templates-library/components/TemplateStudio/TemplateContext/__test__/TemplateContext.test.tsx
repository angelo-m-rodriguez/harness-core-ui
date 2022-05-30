/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { act } from 'react-test-renderer'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import * as templateServices from 'services/template-ng'
import type { TemplateViewData } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateReducer'
import { TemplateContext, TemplateProvider } from '../TemplateContext'

function useTemplateContext() {
  return useContext(TemplateContext)
}

jest.mock('idb', () => ({
  ...(jest.requireActual('idb') as Record<string, any>),
  openDB: jest.fn(async () => ({
    put: jest.fn().mockImplementation(() => Promise.resolve({})),
    get: jest.fn().mockImplementation(() => Promise.resolve({})),
    close: jest.fn().mockImplementation(() => Promise.resolve({})),
    delete: jest.fn().mockImplementation(() => Promise.resolve({}))
  }))
}))

const wrapper = ({ children }: React.PropsWithChildren<unknown>) => (
  <TestWrapper
    pathParams={{
      accountId: '1234',
      folderId: '5678',
      projectIdentifier: 'projectIdentifier',
      orgIdentifier: 'orgIdentifier',
      connectorId: 'connectorId'
    }}
    queryParams={{ repoIdentifier: 'firstRepo', branch: 'master' }}
  >
    <TemplateProvider
      queryParams={{
        accountIdentifier: '1234',
        orgIdentifier: 'someOrgIdentifier',
        projectIdentifier: 'someProjectIdentifier',
        repoIdentifier: 'firstRepo',
        branch: 'master'
      }}
      templateIdentifier={'someTemplateIdentifier'}
      versionLabel={'someVersionLabel'}
      templateType={'Pipeline'}
    >
      {children}
    </TemplateProvider>
  </TestWrapper>
)

jest.spyOn(templateServices, 'validateTemplateInputsPromise').mockImplementation(() => {
  return Promise.resolve({
    status: 'SUCCESS',
    data: {}
  })
})

describe('TemplateContext', () => {
  test('tests initial state', async () => {
    jest.spyOn(templateServices, 'getTemplateListPromise').mockImplementation(() => {
      return Promise.resolve({
        status: 'SUCCESS',
        data: {
          content: [
            {
              accountId: 'accountId',
              createdAt: 1602062958274,
              orgIdentifier: 'orgIdentifier',
              projectIdentifier: 'projectIdentifier',
              versionLabel: 'someVersionLabel'
            }
          ]
        }
      })
    })

    const { result } = renderHook(() => useTemplateContext(), { wrapper })

    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        template: {
          projectIdentifier: 'someProjectIdentifier',
          orgIdentifier: 'someOrgIdentifier'
        },
        originalTemplate: {
          projectIdentifier: 'someProjectIdentifier',
          orgIdentifier: 'someOrgIdentifier'
        }
      })
    )
  })

  test('should update the context with desired values when corresponding methods are called when content is present', async () => {
    jest.spyOn(templateServices, 'getTemplateListPromise').mockImplementation(() => {
      return Promise.resolve({
        status: 'SUCCESS',
        data: {
          content: [
            {
              accountId: 'accountId',
              createdAt: 1602062958274,
              orgIdentifier: 'orgIdentifier',
              projectIdentifier: 'projectIdentifier'
            }
          ]
        }
      })
    })

    const { result } = renderHook(() => useTemplateContext(), { wrapper })

    await act(async () => {
      result.current.updateTemplateView({
        isDrawerOpened: true,
        isYamlEditable: false,
        drawerData: {
          type: 'TemplateInputs'
        }
      } as TemplateViewData)

      await result.current.updateTemplate({
        identifier: 'templateIdentifier',
        name: 'template name',
        orgIdentifier: 'someOrgIdentifier',
        projectIdentifier: 'someProjectIdentifier',
        type: 'Stage',
        versionLabel: 'someVersionLabel'
      })

      result.current.setYamlHandler({
        getLatestYaml: jest.fn(),
        getYAMLValidationErrorMap: () => new Map(),
        setLatestYaml: () => ''
      })

      result.current.setLoading(false)

      await result.current.fetchTemplate({
        branch: 'main',
        repoIdentifier: 'repoIdentifier',
        forceUpdate: true
      })

      await result.current.deleteTemplateCache({
        branch: 'main',
        filePath: '/main/test',
        objectId: 'someObjectId',
        repoIdentifier: 'repoIdentifier',
        repoName: 'testing',
        rootFolder: 'src'
      })

      await result.current.updateGitDetails({
        branch: 'main',
        filePath: '/main/test',
        objectId: 'someObjectId',
        repoIdentifier: 'repoIdentifier',
        repoName: 'testing',
        rootFolder: 'src'
      })

      await waitFor(() =>
        expect(result.current.state).toMatchObject({
          templateView: {
            isDrawerOpened: true,
            isYamlEditable: false,
            drawerData: {
              type: 'TemplateInputs'
            }
          },
          gitDetails: {
            branch: 'main',
            filePath: '/main/test',
            objectId: 'someObjectId',
            repoIdentifier: 'repoIdentifier',
            repoName: 'testing',
            rootFolder: 'src'
          }
        })
      )
    })
  })

  test('should update the context with desired values when corresponding methods are called when data is not present', async () => {
    jest.spyOn(templateServices, 'getTemplateListPromise').mockImplementation(() => {
      return Promise.resolve({
        status: 'SUCCESS',
        data: undefined
      })
    })

    const { result } = renderHook(() => useTemplateContext(), { wrapper })

    await act(async () => {
      await result.current.updateTemplate({
        identifier: 'templateIdentifier',
        name: 'template name',
        orgIdentifier: 'someOrgIdentifier',
        projectIdentifier: 'someProjectIdentifier',
        type: 'Stage',
        versionLabel: 'someVersionLabel'
      })

      await result.current.updateGitDetails({
        branch: 'main',
        filePath: '/main/test',
        objectId: 'someObjectId',
        repoIdentifier: 'repoIdentifier',
        repoName: 'testing',
        rootFolder: 'src'
      })

      await waitFor(() =>
        expect(result.current.state).toMatchObject({
          gitDetails: {
            branch: 'main',
            filePath: '/main/test',
            objectId: 'someObjectId',
            repoIdentifier: 'repoIdentifier',
            repoName: 'testing',
            rootFolder: 'src'
          }
        })
      )
    })
  })

  test('should update the context with desired values when corresponding methods are called when get template fails', async () => {
    jest.spyOn(templateServices, 'getTemplateListPromise').mockImplementation(() => {
      return Promise.resolve({
        status: 'FAILURE',
        data: undefined
      })
    })

    const { result } = renderHook(() => useTemplateContext(), { wrapper })

    await act(async () => {
      await result.current.updateGitDetails({
        branch: undefined,
        filePath: '/main/test',
        objectId: 'someObjectId',
        repoIdentifier: undefined,
        repoName: 'testing',
        rootFolder: 'src'
      })

      await waitFor(() =>
        expect(result.current.state).toMatchObject({
          gitDetails: {
            filePath: '/main/test',
            objectId: 'someObjectId',
            repoName: 'testing',
            rootFolder: 'src'
          }
        })
      )
    })
  })

  test('should update the context with desired values when corresponding methods are called when get template promise gets rejected', async () => {
    jest.spyOn(templateServices, 'getTemplateListPromise').mockImplementation(() => {
      return Promise.reject('Some error occurred')
    })

    const { result } = renderHook(() => useTemplateContext(), { wrapper })

    await act(async () => {
      await result.current.updateGitDetails({
        branch: 'main',
        filePath: '/main/test',
        objectId: 'someObjectId',
        repoIdentifier: 'repoIdentifier',
        repoName: 'testing',
        rootFolder: 'src'
      })

      await waitFor(() =>
        expect(result.current.state).toMatchObject({
          gitDetails: {
            branch: 'main',
            filePath: '/main/test',
            objectId: 'someObjectId',
            repoIdentifier: 'repoIdentifier',
            repoName: 'testing',
            rootFolder: 'src'
          }
        })
      )
    })
  })
})
