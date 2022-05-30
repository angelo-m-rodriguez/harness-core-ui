/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'

import { Text, Container, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { noop } from 'lodash-es'
import { Callout } from '@blueprintjs/core'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useCreateGitSyncModal from '@gitsync/modals/useCreateGitSyncModal'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import css from './NewUserView.module.scss'

const NewUserView: React.FC = () => {
  const { updateAppStore, selectedProject, selectedOrg, isGitSimplificationEnabled } = useAppStore()
  const { refreshStore } = useGitSyncStore()
  const { projectIdentifier } = useParams<ProjectPathProps & ModulePathParams>()

  const { openGitSyncModal } = useCreateGitSyncModal({
    onSuccess: () => {
      refreshStore()
      updateAppStore({ isGitSyncEnabled: true, selectedOrg, selectedProject })
    },
    onClose: noop
  })
  const { getString } = useStrings()
  return (
    <>
      {isGitSimplificationEnabled && (
        <Callout intent="primary" className={css.callout}>
          {getString('gitsync.newGitExperienceMessage')}
        </Callout>
      )}
      <Container className={css.pageContainer}>
        <Container padding={{ bottom: 'large' }}>
          <Icon size={120} name="git-landing-page" />
        </Container>

        <Text margin="medium" color={Color.GREY_600} font={{ size: 'large', weight: 'semi-bold' }}>
          {getString('enableGitExperience')}
        </Text>
        <Text>{getString('gitExperienceNewUserText')}</Text>
        <RbacButton
          intent="primary"
          margin="large"
          font={{ size: 'medium' }}
          className={css.gitEnableBtn}
          disabled={isGitSimplificationEnabled}
          text={getString('enableGitExperience')}
          onClick={() => openGitSyncModal(true, false, undefined)}
          permission={{
            permission: PermissionIdentifier.UPDATE_PROJECT,
            resource: {
              resourceType: ResourceType.PROJECT,
              resourceIdentifier: projectIdentifier
            }
          }}
        />
      </Container>
    </>
  )
}

export default NewUserView
