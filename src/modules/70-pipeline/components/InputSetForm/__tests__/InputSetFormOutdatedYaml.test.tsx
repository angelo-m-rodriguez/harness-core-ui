/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, getByText as getByTextGlobal, fireEvent, act } from '@testing-library/react'
import { noop } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import routes from '@common/RouteDefinitions'
import * as pipelineng from 'services/pipeline-ng'
import { accountPathProps, pipelineModuleParams, inputSetFormPathProps } from '@common/utils/routeUtils'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { EnhancedInputSetForm } from '../InputSetForm'
import {
  TemplateResponse,
  PipelineResponse,
  ConnectorResponse,
  GetInputSetsResponse,
  MergeInputSetResponse,
  GetOverlayInputSetEdit,
  inputSetSanitiseResponse,
  MergedPipelineResponse
} from './InputSetMocks'

const successResponse = (): Promise<{ status: string }> => Promise.resolve({ status: 'SUCCESS' })
jest.mock('@common/utils/YamlUtils', () => ({}))
const GetInputSetEdit = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      accountId: 'kmpySmUISimoRrJL6NL73w',
      orgIdentifier: 'Harness11',
      projectIdentifier: 'Uhat_Project',
      pipelineIdentifier: 'testqqq',
      identifier: 'asd',
      inputSetYaml:
        'inputSet:\n  name: asd\n  identifier: asd\n  description: asd\n  pipeline:\n    identifier: testqqq\n    stages:\n      - stage:\n          identifier: asd\n          type: Deployment\n          spec:\n            infrastructure:\n              infrastructureDefinition:\n                type: KubernetesDirect\n                spec:\n                  connectorRef: org.tesa1\n                  namespace: asd\n                  releaseName: asd\n',
      name: 'asd',
      description: 'asd',
      errorResponse: false,
      gitDetails: {
        branch: 'feature',
        filePath: 'asd.yaml',
        objectId: '4471ec3aa40c26377353974c29a6670d998db06g',
        repoIdentifier: 'gitSyncRepo',
        rootFolder: '/rootFolderTest/.harness/'
      },
      outdated: true
    },
    correlationId: 'fdb1358f-c3b8-459b-aa89-4e570b7ac6d0'
  }
}

jest.mock(
  '@common/components/YAMLBuilder/YamlBuilder',
  () =>
    ({ children, bind }: { children: JSX.Element; bind: YamlBuilderProps['bind'] }) => {
      const handler = React.useMemo(
        () =>
          ({
            getLatestYaml: () => GetInputSetEdit.data?.data?.inputSetYaml || '',
            getYAMLValidationErrorMap: () => new Map()
          } as YamlBuilderHandlerBinding),
        []
      )

      React.useEffect(() => {
        bind?.(handler)
      }, [bind, handler])
      return (
        <div>
          <span>Yaml View</span>
          {children}
        </div>
      )
    }
)

jest.useFakeTimers()

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse),
  useCreatePR: jest.fn(() => noop),
  useCreatePRV2: jest.fn(() => noop),
  useGetFileContent: jest.fn(() => noop),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  }),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitConfigs, refetch: getListGitSync }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn().mockImplementation(props => {
    if (props.name === 'useGetYamlWithTemplateRefsResolved') {
      return MergedPipelineResponse
    } else {
      return TemplateResponse
    }
  })
}))

jest.mock('services/pipeline-ng', () => ({
  useGetInputSetForPipeline: jest.fn(() => GetInputSetEdit),
  useCreateVariablesV2: () => jest.fn(() => ({})),
  useGetMergeInputSetFromPipelineTemplateWithListInput: jest.fn(() => MergeInputSetResponse),
  useGetPipeline: jest.fn(() => PipelineResponse),
  useSanitiseInputSet: jest.fn(() => PipelineResponse),
  useDeleteInputSetForPipeline: jest.fn(() => ({ mutate: jest.fn() })),
  useGetTemplateFromPipeline: jest.fn(() => TemplateResponse),
  useGetStagesExecutionList: jest.fn(() => ({})),
  useGetOverlayInputSetForPipeline: jest.fn(() => GetOverlayInputSetEdit),
  useCreateInputSetForPipeline: jest.fn(() => ({ mutate: jest.fn() })),
  useUpdateInputSetForPipeline: jest.fn().mockImplementation(() => ({ mutate: successResponse })),
  useUpdateOverlayInputSetForPipeline: jest.fn().mockImplementation(() => ({ mutate: successResponse })),
  useCreateOverlayInputSetForPipeline: jest.fn(() => ({})),
  useGetInputSetsListForPipeline: jest.fn(() => GetInputSetsResponse),
  useGetSchemaYaml: jest.fn(() => ({}))
}))

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

const TEST_INPUT_SET_FORM_PATH = routes.toInputSetForm({
  ...accountPathProps,
  ...inputSetFormPathProps,
  ...pipelineModuleParams
})

const renderSetup = () =>
  render(
    <TestWrapper
      path={TEST_INPUT_SET_FORM_PATH}
      pathParams={{
        accountId: 'testAcc',
        orgIdentifier: 'testOrg',
        projectIdentifier: 'test',
        pipelineIdentifier: 'pipeline',
        inputSetIdentifier: 'test_input_set',
        module: 'cd'
      }}
      defaultAppStoreValues={defaultAppStoreValues}
    >
      <PipelineContext.Provider
        value={
          {
            state: { pipeline: { name: '', identifier: '' } } as any,
            getStageFromPipeline: jest.fn((_stageId, pipeline) => ({
              stage: pipeline.stages[0],
              parent: undefined
            }))
          } as any
        }
      >
        <EnhancedInputSetForm />
      </PipelineContext.Provider>
    </TestWrapper>
  )

describe('Input Set - Invalid YAML Flow', () => {
  test('invalid yaml flow - should open yaml view and render invalid fields dialog', async () => {
    jest.spyOn(pipelineng, 'useSanitiseInputSet').mockImplementation((): any => {
      return { mutate: () => Promise.resolve(inputSetSanitiseResponse), loading: false }
    })
    renderSetup()
    jest.runOnlyPendingTimers()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.removeInvalidFields')).toBeDefined()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.invalidInputSet1')).toBeDefined()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.invalidFields')).toBeDefined()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.editInYamlView')).toBeDefined()
    expect(document.getElementsByClassName('bp3-dialog')[0]).toMatchSnapshot('invalid yaml dialog')

    await act(() => {
      fireEvent.click(getByTextGlobal(document.body, 'pipeline.inputSets.removeInvalidFields'))
    })
    expect(pipelineng.useSanitiseInputSet).toHaveBeenCalled()

    //check if dailog closed
    expect(document.getElementsByClassName('bp3-dialog')[0]).toBeFalsy()
  })

  test('invalid yaml flow - should open DeleteInputSetModal', async () => {
    jest.spyOn(pipelineng, 'useSanitiseInputSet').mockImplementation((): any => {
      return {
        mutate: () =>
          Promise.resolve({
            status: 'SUCCESS',
            data: {
              inputSetUpdateResponse: inputSetSanitiseResponse.data.inputSetUpdateResponse,
              shouldDeleteInputSet: true
            }
          }),
        loading: false
      }
    })
    jest.spyOn(pipelineng, 'useGetPipeline').mockImplementation((): any => {
      return {
        data: {
          status: 'SUCCESS',
          data: {
            ...PipelineResponse,
            gitDetails: {
              branch: 'feature',
              filePath: 'asd.yaml',
              objectId: '4471ec3aa40c26377353974c29a6670d998db06g',
              repoIdentifier: 'gitSyncRepo',
              rootFolder: '/rootFolderTest/.harness/'
            }
          }
        },
        loading: false,
        refetch: jest.fn()
      }
    })
    renderSetup()
    jest.runOnlyPendingTimers()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.removeInvalidFields')).toBeDefined()
    expect(document.getElementsByClassName('bp3-dialog')[0]).toMatchSnapshot('invalid yaml dialog')

    await act(() => {
      fireEvent.click(getByTextGlobal(document.body, 'pipeline.inputSets.removeInvalidFields'))
    })
    expect(pipelineng.useSanitiseInputSet).toHaveBeenCalled()

    //check if invalidFieldModal closed
    expect(document.getElementsByClassName('bp3-dialog')[0]).toBeFalsy()

    // open deleteInputSetModal
    jest.runOnlyPendingTimers()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.deleteInputSet')).toBeDefined()
    expect(document.getElementsByClassName('bp3-dialog')[0]).toMatchSnapshot()
    await act(() => {
      fireEvent.click(getByTextGlobal(document.body, 'pipeline.inputSets.deleteInputSet'))
    })
    expect(pipelineng.useDeleteInputSetForPipeline).toHaveBeenCalled()

    //check if dailog closed
    expect(document.getElementsByClassName('bp3-dialog')[0]).toBeFalsy()
  })

  test('invalid yaml flow - should close modal through button', async () => {
    jest.spyOn(pipelineng, 'useSanitiseInputSet').mockImplementation((): any => {
      return { mutate: () => Promise.resolve(), loading: false }
    })
    renderSetup()
    jest.runOnlyPendingTimers()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.removeInvalidFields')).toBeDefined()
    expect(getByTextGlobal(document.body, 'pipeline.inputSets.editInYamlView')).toBeDefined()
    expect(document.getElementsByClassName('bp3-dialog')[0]).toMatchSnapshot('invalid yaml dialog')

    await act(() => {
      fireEvent.click(getByTextGlobal(document.body, 'pipeline.inputSets.editInYamlView'))
    })

    //check if dailog closed
    expect(document.getElementsByClassName('bp3-dialog')[0]).toBeFalsy()
  })
})
