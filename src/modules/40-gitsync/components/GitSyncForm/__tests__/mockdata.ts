/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const mockRepos = {
  status: 'SUCCESS',
  data: [{ name: 'repo1' }, { name: 'repo2' }, { name: 'repo3' }, { name: 'repotest1' }, { name: 'repotest2' }],
  metaData: null,
  correlationId: 'correlationId'
}

export const mockBranches = {
  status: 'SUCCESS',
  data: {
    branches: [{ name: 'main' }, { name: 'main-demo' }, { name: 'main-patch' }, { name: 'dev' }],
    defaultBranch: { name: 'main' }
  },
  metaData: null,
  correlationId: 'correlationId'
}

export const gitConnectorMock = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 2,
    pageItemCount: 2,
    pageSize: 100,
    content: [
      {
        connector: {
          name: 'ValidGitAccount',
          identifier: 'ValidGitRepo',
          description: '',
          orgIdentifier: 'default',
          projectIdentifier: 'DevX',
          tags: {},
          type: 'Github',
          spec: {
            url: 'https://github.com/wings-software',
            authentication: {
              type: 'Http',
              spec: {
                type: 'UsernamePassword',
                spec: { username: 'harnessDev', usernameRef: null, passwordRef: 'githubToken' }
              }
            },
            apiAccess: { type: 'Token', spec: { tokenRef: 'githubToken' } },
            delegateSelectors: [],
            type: 'Account'
          }
        },
        createdAt: 1618848332466,
        lastModifiedAt: 1618848363159,
        status: {
          status: 'FAILURE',
          errorSummary: 'Error Encountered (Invalid git repo https://github.com/wings-software)',
          errors: [
            { reason: 'Unexpected Error', message: 'Invalid git repo https://github.com/wings-software', code: 450 }
          ],
          testedAt: 1619685989716,
          lastTestedAt: 0,
          lastConnectedAt: 1619626567468
        },
        activityDetails: { lastActivityTime: 1618848363165 },
        harnessManaged: false,
        gitDetails: { objectId: null, branch: null, repoIdentifier: null }
      },
      {
        connector: {
          name: 'ValidGithubRepo',
          identifier: 'ValidGithubRepo',
          description: 'Used in gitSync',
          orgIdentifier: 'default',
          projectIdentifier: 'DevX',
          tags: {},
          type: 'Github',
          spec: {
            url: 'https://github.com/wings-software/sunnykesh-gitSync',
            authentication: {
              type: 'Http',
              spec: {
                type: 'UsernamePassword',
                spec: { username: 'harnessDev', usernameRef: null, passwordRef: 'githubToken' }
              }
            },
            apiAccess: { type: 'Token', spec: { tokenRef: 'githubToken' } },
            delegateSelectors: [],
            type: 'Repo'
          }
        },
        createdAt: 1618848214482,
        lastModifiedAt: 1618848214472,
        status: {
          status: 'SUCCESS',
          errorSummary: null,
          errors: null,
          testedAt: 1619685421630,
          lastTestedAt: 0,
          lastConnectedAt: 1619685421630
        },
        activityDetails: { lastActivityTime: 1618848214504 },
        harnessManaged: false,
        gitDetails: { objectId: null, branch: null, repoIdentifier: null }
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: 'b966360a-06b4-4c7a-8509-7d5d6d848548'
}
