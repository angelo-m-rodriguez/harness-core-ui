/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type {
  ResponseBoolean,
  ResponseListScopeName,
  RestResponseAuthenticationSettingsResponse,
  SAMLSettings
} from 'services/cd-ng'

export const userGroupInfo = {
  status: 'SUCCESS',
  data: {
    userGroupDTO: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'New_RG',
      name: 'New RG',
      users: ['lv0euRhKRCyiXWzS7pOg6g', 'ZqXNvYmURnO46PX7HwgEtQ'],
      notificationConfigs: [],
      description: '',
      tags: {}
    },
    users: [
      { name: 'Admin', email: 'admin@harness.io', uuid: 'lv0euRhKRCyiXWzS7pOg6g' },
      { name: 'default2fa', email: 'default2fa@harness.io', uuid: 'ZqXNvYmURnO46PX7HwgEtQ' }
    ],
    roleAssignmentsMetadataDTO: [
      {
        identifier: 'role_assignment_YQthy4XoyNVcN0tNz2Qf',
        roleIdentifier: '_account_viewer',
        roleName: 'Account Viewer',
        resourceGroupIdentifier: '_all_account_level_resources',
        resourceGroupName: 'All Resources',
        managedRole: true,
        roleAssignmentsMetadataDTO: false
      }
    ],
    lastModifiedAt: 1618931089212
  },
  metaData: '',
  correlationId: ''
}

export const userGroupInfoSSOLinked = {
  status: 'SUCCESS',
  data: {
    userGroupDTO: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'New_RG',
      name: 'New RG',
      users: ['lv0euRhKRCyiXWzS7pOg6g', 'ZqXNvYmURnO46PX7HwgEtQ'],
      notificationConfigs: [
        { type: 'EMAIL', groupEmail: 'email@harness.io' },
        { type: 'SLACK', slackWebhookUrl: 'https://hooks.slack.com/services/dummy' }
      ],
      description: '',
      tags: {},
      ssoLinked: true,
      ssoGroupName: 'mock_group_sso_name',
      linkedSsoDisplayName: 'mock_sso_display_name'
    },
    users: [
      { name: 'Admin', email: 'admin@harness.io', uuid: 'lv0euRhKRCyiXWzS7pOg6g' },
      { name: 'default2fa', email: 'default2fa@harness.io', uuid: 'ZqXNvYmURnO46PX7HwgEtQ' }
    ],
    roleAssignmentsMetadataDTO: [
      {
        identifier: 'role_assignment_YQthy4XoyNVcN0tNz2Qf',
        roleIdentifier: '_account_viewer',
        roleName: 'Account Viewer',
        resourceGroupIdentifier: '_all_account_level_resources',
        resourceGroupName: 'All Resources',
        managedRole: true,
        managedRoleAssignment: false
      }
    ],
    lastModifiedAt: 1618931089212
  },
  metaData: '',
  correlationId: ''
}

export const mockResponse: ResponseBoolean = {
  status: 'SUCCESS',
  data: true,
  metaData: {},
  correlationId: ''
}

export const userInfo = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 2,
    pageItemCount: 2,
    pageSize: 10,
    content: [
      {
        uuid: 'rbac2',
        name: 'rbac1',
        email: 'rbac1@harness.io',
        admin: false,
        twoFactorAuthenticationEnabled: false
      },
      {
        uuid: 'rbac2',
        name: 'rbac2',
        email: 'rbac2@harness.io',
        admin: false,
        twoFactorAuthenticationEnabled: false
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: {},
  correlationId: ''
}

export const mockSSOSettings = {
  data: {
    resource: {
      ngAuthSettings: [
        {
          displayName: 'mock_SSO_Provider',
          identifier: 'mock_sso_id',
          settingsType: 'SAML',
          authorizationEnabled: true
        }
      ] as SAMLSettings[]
    }
  } as RestResponseAuthenticationSettingsResponse,
  error: null,
  loading: false
}

export const userGroupCheckingInfo = {
  status: undefined,
  data: {
    userGroupDTO: {
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      orgIdentifier: 'default',
      projectIdentifier: 'testing',
      identifier: 'user_g_name',
      name: 'user_g_name',
      users: ['lv0euRhKRCyiXWzS7pOg6g'],
      notificationConfigs: [],
      externallyManaged: true,
      description: 'description',
      tags: {
        firsttg: '',
        secondtg: ''
      },
      ssoLinked: false
      // ssoGroupName: 'mock_group_sso_name',
      // linkedSsoDisplayName: 'mock_sso_display_name'
    },
    users: [
      {
        name: 'Admin',
        email: 'admin@harness.io',
        uuid: 'lv0euRhKRCyiXWzS7pOg6g',
        locked: false,
        disabled: false,
        externallyManaged: false
      }
    ],
    roleAssignmentsMetadataDTO: undefined,
    lastModifiedAt: 1651685800532
  },
  metaData: {},
  correlationId: ''
}

export const inheritingChildScopeListData: { data: ResponseListScopeName } = {
  data: {
    status: 'SUCCESS',
    data: [
      {
        accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
        orgName: 'checking org',
        orgIdentifier: 'checking_org'
      },
      {
        accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
        orgName: 'default',
        orgIdentifier: 'default',
        projectName: 'testing',
        projectIdentifier: 'testing'
      }
    ],
    metaData: undefined,
    correlationId: '2217f4b6-92f7-439e-be4b-8d58187d2d4b'
  }
}
