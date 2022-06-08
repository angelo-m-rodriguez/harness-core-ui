/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { UseGetReturnData, UseMutateMockData } from '@common/utils/testUtils'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import type {
  ResponseInputSetResponse,
  ResponseInputSetTemplateResponse,
  ResponseMergeInputSetResponse,
  ResponseOverlayInputSetResponse,
  ResponsePageInputSetSummaryResponse,
  ResponsePMSPipelineResponseDTO
} from 'services/pipeline-ng'

export const TemplateResponse: UseGetReturnData<ResponseInputSetTemplateResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      inputSetTemplateYaml:
        'pipeline:\n  identifier: "testqqq"\n  stages:\n  - stage:\n      identifier: "asd"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "<+input>"\n              namespace: "<+input>"\n              releaseName: "<+input>"\n'
    },
    correlationId: '54a0c3b6-62aa-4f19-ba57-ab69599299b0'
  }
}

export const PipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      yamlPipeline:
        'pipeline:\n    name: testsdfsdf\n    identifier: testqqq\n    allowStageExecutions: false\n    projectIdentifier: Kapil\n    orgIdentifier: default\n    tags: {}\n    stages:\n        - stage:\n              name: asd\n              identifier: asd\n              description: ""\n              type: Deployment\n              spec:\n                  serviceConfig:\n                      serviceRef: <+input>\n                      serviceDefinition:\n                          type: Kubernetes\n                          spec:\n                              variables: []\n                  infrastructure:\n                      environmentRef: <+input>\n                      infrastructureDefinition:\n                          type: KubernetesDirect\n                          spec:\n                              connectorRef: test1111\n                              namespace: name\n                              releaseName: release-<+INFRA_KEY>\n                      allowSimultaneousDeployments: false\n                  execution:\n                      steps:\n                          - step:\n                                name: Rollout Deployment\n                                identifier: rolloutDeployment\n                                type: K8sRollingDeploy\n                                timeout: 10m\n                                spec:\n                                    skipDryRun: false\n                      rollbackSteps:\n                          - step:\n                                name: Rollback Rollout Deployment\n                                identifier: rollbackRolloutDeployment\n                                type: K8sRollingRollback\n                                timeout: 10m\n                                spec: {}\n              tags: {}\n              failureStrategies:\n                  - onFailure:\n                        errors:\n                            - AllErrors\n                        action:\n                            type: StageRollback\n',
      resolvedTemplatesPipelineYaml:
        'pipeline:\n  name: "testsdfsdf"\n  identifier: "testqqq"\n  allowStageExecutions: false\n  projectIdentifier: "Kapil"\n  orgIdentifier: "default"\n  tags: {}\n  stages:\n  - stage:\n      name: "asd"\n      identifier: "asd"\n      description: ""\n      type: "Deployment"\n      spec:\n        serviceConfig:\n          serviceRef: "<+input>"\n          serviceDefinition:\n            type: "Kubernetes"\n            spec:\n              variables: []\n        infrastructure:\n          environmentRef: "<+input>"\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "test1111"\n              namespace: "name"\n              releaseName: "release-<+INFRA_KEY>"\n          allowSimultaneousDeployments: false\n        execution:\n          steps:\n          - step:\n              name: "Rollout Deployment"\n              identifier: "rolloutDeployment"\n              type: "K8sRollingDeploy"\n              timeout: "10m"\n              spec:\n                skipDryRun: false\n          rollbackSteps:\n          - step:\n              name: "Rollback Rollout Deployment"\n              identifier: "rollbackRolloutDeployment"\n              type: "K8sRollingRollback"\n              timeout: "10m"\n              spec: {}\n      tags: {}\n      failureStrategies:\n      - onFailure:\n          errors:\n          - "AllErrors"\n          action:\n            type: "StageRollback"\n',
      entityValidityDetails: {
        valid: true
      },
      modules: ['cd']
    },
    correlationId: '7a84d477-4549-4026-8113-a02730b4f7c5'
  }
}

export const MergedPipelineResponse: UseGetReturnData<ResponsePMSPipelineResponseDTO> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      ngPipeline: {
        pipeline: {
          name: 'testsdfsdf',
          identifier: 'testqqq',
          description: '',
          tags: null,
          variables: null,
          metadata: null
        }
      },
      executionsPlaceHolder: [],
      mergedPipelineYaml:
        'name: testsdfsdf\nidentifier: testqqq\ndescription: ""\nstages:\n  - stage:\n      name: asd\n      identifier: asd\n      description: ""\n      type: Deployment\n      spec:\n        service:\n          identifier: asd\n          name: asd\n          description: ""\n          serviceDefinition:\n            type: Kubernetes\n            spec:\n              artifacts:\n                sidecars: []\n                primary:\n                  type: Dockerhub\n                  spec:\n                    connectorRef: org.docker\n                    imagePath: asd\n              manifests: []\n              artifactOverrideSets: []\n              manifestOverrideSets: []\n        execution:\n          steps:\n            - step:\n                name: Rollout Deployment\n                identifier: rolloutDeployment\n                type: K8sRollingDeploy\n                spec:\n                  timeout: 10m\n                  skipDryRun: false\n          rollbackSteps:\n            - step:\n                name: Rollback Rollout Deployment\n                identifier: rollbackRolloutDeployment\n                type: K8sRollingRollback\n                spec:\n                  timeout: 10m\n        infrastructure:\n          environment:\n            name: qa\n            identifier: qa\n            description: ""\n            type: PreProduction\n          infrastructureDefinition:\n            type: KubernetesDirect\n            spec:\n              connectorRef: <+input>\n              namespace: <+input>\n              releaseName: <+input>\n'
    } as any,
    correlationId: '7a84d477-4549-4026-8113-a02730b4f7c5'
  }
}

export const ConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'tesa1',
        identifier: 'tesa1',
        description: '',
        orgIdentifier: 'Harness11',
        tags: {},
        type: 'K8sCluster',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: {
              masterUrl: 'asd',
              auth: { type: 'UsernamePassword', spec: { username: 'asd', passwordRef: 'account.test1111' } }
            }
          }
        }
      },
      createdAt: 1602062958274,
      lastModifiedAt: 1602062958274
    },
    correlationId: 'e1841cfc-9ed5-4f7c-a87b-c9be1eeaae34'
  }
}

export const GetInputSetsResponse: UseGetReturnData<ResponsePageInputSetSummaryResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      totalPages: 1,
      totalItems: 2,
      pageItemCount: 2,
      pageSize: 100,
      content: [
        {
          identifier: 'asd',
          name: 'asd',
          pipelineIdentifier: 'testqqq',
          description: 'asd',
          inputSetType: 'INPUT_SET'
        },
        {
          identifier: 'test',
          name: 'test',
          pipelineIdentifier: 'testqqq',
          description: 'sdf',
          inputSetType: 'INPUT_SET'
        }
      ],
      pageIndex: 0,
      empty: false
    },
    correlationId: 'dbc7238c-380f-4fe0-b160-a29510cfe0c8'
  }
}

export const GetInputSetEdit: UseGetReturnData<ResponseInputSetResponse> = {
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
        commitId: '4471ec3aa40c26377353974c29a6670d998db0commitid',
        repoIdentifier: 'gitSyncRepo',
        rootFolder: '/rootFolderTest/.harness/'
      }
    },
    correlationId: 'fdb1358f-c3b8-459b-aa89-4e570b7ac6d0'
  }
}

export const GetOverlayInputSetEdit: UseGetReturnData<ResponseOverlayInputSetResponse> = {
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
      identifier: 'OverLayInput',
      name: 'OverLayInput',
      description: 'OverLayInput',
      inputSetReferences: ['asd', 'test'],
      overlayInputSetYaml:
        'overlayInputSet:\n  name: OverLayInput\n  identifier: OverLayInput\n  description: OverLayInput\n  inputSetReferences:\n    - asd\n    - test\n',
      errorResponse: false,
      gitDetails: {
        branch: 'feature',
        filePath: 'asd.yaml',
        objectId: '4471ec3aa40c26377353974c29a6670d998db06g',
        repoIdentifier: 'gitSyncRepo',
        rootFolder: '/rootFolderTest/.harness/'
      }
    },
    correlationId: '4cccf1ad-e86d-4629-9c85-95a23225f2e4'
  }
}

export const MergeInputSetResponse: UseMutateMockData<ResponseMergeInputSetResponse> = {
  loading: false,
  mutate: () =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        pipelineYaml:
          'pipeline:\n  identifier: "testqqq"\n  stages:\n  - stage:\n      identifier: "asd"\n      type: "Deployment"\n      spec:\n        infrastructure:\n          infrastructureDefinition:\n            type: "KubernetesDirect"\n            spec:\n              connectorRef: "org.tesa1"\n              namespace: "asd"\n              releaseName: "asd"\n',
        inputSetErrorWrapper: {},
        errorResponse: false
      },
      correlationId: 'ec1dec41-213d-4164-8cfc-4198d6565f88'
    })
}

export const createInputSetCallFirstArg = `inputSet:
  name: asd
  identifier: asd
  description: asd
  pipeline:
    identifier: testqqq
    stages:
      - stage:
          identifier: asd
          type: Deployment
          spec:
            infrastructure:
              infrastructureDefinition:
                type: KubernetesDirect
                spec:
                  connectorRef: org.tesa1
                  namespace: asd
                  releaseName: asd
`

export const createInputSetCallSecondArg = {
  queryParams: {
    accountIdentifier: 'testAcc',
    branch: 'feature',
    commitMsg: 'common.gitSync.createResource',
    createPr: false,
    filePath: 'asd.yaml',
    isNewBranch: false,
    orgIdentifier: 'testOrg',
    pipelineBranch: 'feature',
    pipelineIdentifier: 'pipeline',
    pipelineRepoID: 'identifier',
    projectIdentifier: 'test',
    repoIdentifier: 'identifier',
    rootFolder: '',
    targetBranch: ''
  }
}

export const updateInputSetCallSecondArg = {
  pathParams: {
    inputSetIdentifier: 'asd'
  },
  queryParams: {
    accountIdentifier: 'testAcc',
    branch: 'feature',
    commitMsg: 'common.gitSync.updateResource',
    createPr: false,
    filePath: 'asd.yaml',
    isNewBranch: false,
    lastObjectId: '4471ec3aa40c26377353974c29a6670d998db06g',
    lastCommitId: '4471ec3aa40c26377353974c29a6670d998db0commitid',
    orgIdentifier: 'testOrg',
    pipelineBranch: 'feature',
    pipelineIdentifier: 'pipeline',
    pipelineRepoID: 'identifier',
    projectIdentifier: 'test',
    repoIdentifier: 'gitSyncRepo',
    rootFolder: '/rootFolderTest/.harness/',
    targetBranch: ''
  }
}

export const updateInputSetCallSecondArgNewBranch = {
  pathParams: {
    inputSetIdentifier: 'asd'
  },
  queryParams: {
    accountIdentifier: 'testAcc',
    branch: 'feature1',
    commitMsg: 'common.gitSync.updateResource',
    createPr: false,
    filePath: 'asd.yaml',
    isNewBranch: true,
    lastObjectId: '4471ec3aa40c26377353974c29a6670d998db06g',
    lastCommitId: '4471ec3aa40c26377353974c29a6670d998db0commitid',
    orgIdentifier: 'testOrg',
    pipelineBranch: 'feature',
    pipelineIdentifier: 'pipeline',
    pipelineRepoID: 'identifier',
    projectIdentifier: 'test',
    repoIdentifier: 'gitSyncRepo',
    rootFolder: '/rootFolderTest/.harness/',
    targetBranch: 'feature',
    baseBranch: 'feature'
  }
}

export const errorResponse = (): Promise<{ status: string }> =>
  Promise.reject({
    data: {
      status: 'ERROR',
      metadata: {
        uuidToErrorResponseMap: {
          field1: { errors: [{ fieldName: 'field1', message: 'field1 error message' }] },
          field2: { errors: [{ fieldName: 'field2', message: 'field2 error message' }] }
        },
        invalidReferences: {
          field1: { errors: [{ fieldName: 'field1', message: 'field1 error message' }] },
          field2: { errors: [{ fieldName: 'field2', message: 'field2 error message' }] }
        }
      }
    }
  })

export const errorResponseWithoutErrorMap = (): Promise<{ status: string }> =>
  Promise.reject({
    data: {
      status: 'ERROR',
      metadata: {}
    }
  })

export const inputSetSanitiseResponse = {
  status: 'SUCCESS',
  data: {
    inputSetUpdateResponse: {
      accountId: 'kmpySmUISimoRrJL6NL73w',
      description: 'asd',
      entityValidityDetails: {
        valid: false
      },
      errorResponse: false,
      gitDetails: {
        branch: 'feature',
        filePath: 'asd.yaml',
        objectId: '4471ec3aa40c26377353974c29a6670d998db06g',
        repoIdentifier: 'gitSyncRepo',
        rootFolder: '/rootFolderTest/.harness/'
      },
      identifier: 'asd56',
      inputSetErrorWrapper: {},
      inputSetYaml:
        'inputSet:\n  name: asd\n  identifier: asd\n  description: asd\n  pipeline:\n    identifier: testqqq\n    stages:\n      - stage:\n          identifier: asd\n          type: Deployment\n          spec:\n            infrastructure:\n              infrastructureDefinition:\n                type: KubernetesDirect\n                spec:\n                  connectorRef: org.tesa1\n                  namespace: asd\n                  releaseName: asd\n',
      name: 'asd',
      orgIdentifier: 'Harness11',
      projectIdentifier: 'Uhat_Project',
      pipelineIdentifier: 'testqqq',
      version: 1
    },
    shouldDeleteInputSet: false
  }
}

export const sourceCodeManage = {
  status: 'SUCCESS',
  data: [
    {
      id: '62284c2d9fc0b41653b10016',
      userIdentifier: 'ZHAbHPxORiGc8McvshFkqA',
      accountIdentifier: 'px7xd_BFRCi-pfWPYXVjvw',
      name: 'dummy_Pipeline',
      createdAt: 1646808109391,
      lastModifiedAt: 1646808109391,
      type: 'GITHUB',
      authentication: {
        type: 'Http',
        spec: {
          type: 'UsernameToken',
          spec: {
            username: 'dummy',
            usernameRef: null,
            tokenRef: 'account.GithubPersonalToken'
          }
        }
      }
    }
  ],
  correlationId: '86eb32ff-8d35-478c-a5b8-bb3e373ad03f'
}
