/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import ProjectSetupMenu from '../ProjectSetupMenu'

jest.mock('framework/PreferenceStore/PreferenceStoreContext')
;(usePreferenceStore as jest.Mock).mockImplementation(() => {
  return {
    setPreference: () => {
      // empty
    },
    preference: {
      collapseSideNav: true
    },
    clearPreference: jest.fn
  }
})

jest.mock('services/cd-ng')

describe('Project Setup Menu', () => {
  test('should render correctly condensed', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId" pathParams={{ accountId: 'dummy' }}>
        <ProjectSetupMenu />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render correctly expanded', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId" pathParams={{ accountId: 'dummy' }}>
        <ProjectSetupMenu defaultExpanded />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Templates should show if module is CV and CVNG_TEMPLATE_MONITORED_SERVICE flag is enabled', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          CVNG_TEMPLATE_MONITORED_SERVICE: true
        }}
      >
        <ProjectSetupMenu module="cv" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.templates')).toBeInTheDocument()
  })

  test('Policy should show if module is CD and license is ENTERPRISE', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultLicenseStoreValues={{
          licenseInformation: {
            CD: { edition: 'ENTERPRISE', status: 'ACTIVE' }
          }
        }}
      >
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.governance')).toBeInTheDocument()
  })

  test('Policy should not show if module is CD and license is FREE', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultLicenseStoreValues={{
          licenseInformation: {
            CD: { edition: 'FREE', status: 'ACTIVE' }
          }
        }}
      >
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.governance')).not.toBeInTheDocument()
  })

  test('Policy should not show if module is CHAOS and license is any', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          CVNG_TEMPLATE_MONITORED_SERVICE: true
        }}
      >
        <ProjectSetupMenu module="chaos" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.governance')).not.toBeInTheDocument()
  })

  test('Show Deployment Freeze Window Link if module is CD and license is ENTERPRISE', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultLicenseStoreValues={{
          licenseInformation: {
            CD: { edition: 'ENTERPRISE', status: 'ACTIVE' }
          }
        }}
      >
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.freezeWindows')).toBeInTheDocument()
  })

  test('Show Git Management Link if isGitSyncSupported is true and gitSyncEnabledOnlyForFF is false', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultAppStoreValues={{
          isGitSyncEnabled: true,
          gitSyncEnabledOnlyForFF: false
        }}
      >
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('gitManagement')).toBeInTheDocument()
  })

  test('Show Git Management Link if USE_OLD_GIT_SYNC is true and isGitSimplificationEnabled is disabled', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          USE_OLD_GIT_SYNC: true
        }}
        defaultAppStoreValues={{
          isGitSyncEnabled: true,
          isGitSimplificationEnabled: false
        }}
      >
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('gitManagement')).toBeInTheDocument()
  })

  test('Show Templates and FileStore if module is CI or CD', async () => {
    const { queryByText } = render(
      <TestWrapper>
        <ProjectSetupMenu module="cd" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.templates')).toBeInTheDocument()
    expect(queryByText('resourcePage.fileStore')).toBeInTheDocument()
  })

  test('Show STO Downtime Link if SRM_DOWNTIME is true and module is CV', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          SRM_DOWNTIME: true
        }}
      >
        <ProjectSetupMenu module="cv" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.sloDowntimeLabel')).toBeInTheDocument()
  })

  test('Show STO JIRA Integration link if STO_JIRA_INTEGRATION is true and module is STO', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          STO_JIRA_INTEGRATION: true
        }}
      >
        <ProjectSetupMenu module="sto" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.tickets.externalTickets')).toBeInTheDocument()
  })

  test('Show Discovery link if PL_DISCOVERY_ENABLE is true and module is chaos', async () => {
    const { queryByText } = render(
      <TestWrapper
        defaultFeatureFlagValues={{
          PL_DISCOVERY_ENABLE: true
        }}
      >
        <ProjectSetupMenu module="chaos" defaultExpanded />
      </TestWrapper>
    )
    expect(queryByText('common.discovery')).toBeInTheDocument()
  })
})
