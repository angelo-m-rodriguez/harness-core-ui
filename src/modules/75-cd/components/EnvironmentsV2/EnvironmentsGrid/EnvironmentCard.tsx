/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, get } from 'lodash-es'
import { Classes, Menu } from '@blueprintjs/core'

import { Card, Text, Container, CardBody, useConfirmationDialog, Intent } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { EnvironmentResponse } from 'services/cd-ng'

import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'

import { EnvironmentName, EnvironmentTypes, LastUpdatedBy } from '../EnvironmentsList/EnvironmentsListColumns'

import css from './EnvironmentsGrid.module.scss'

export interface EnvironmentCardProps {
  response: EnvironmentResponse
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function EnvironmentCard({ response, onEdit, onDelete }: EnvironmentCardProps): React.ReactElement {
  const { getString } = useStrings()
  const { openDialog } = useConfirmationDialog({
    titleText: getString('cd.environment.delete'),
    contentText: getString('cd.environment.deleteConfirmation'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      /* istanbul ignore else */
      if (isConfirmed) {
        await onDelete(get(response, 'environment.identifier', ''))
      }
    }
  })

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    openDialog()
  }

  return (
    <Card
      className={css.environmentCard}
      interactive
      onClick={() => onEdit(get(response, 'environment.identifier', ''))}
    >
      <Container padding={'xlarge'} border={{ bottom: true }}>
        <CardBody.Menu
          menuContent={
            <Menu style={{ minWidth: 'unset' }}>
              <RbacMenuItem
                icon="edit"
                text={getString('edit')}
                onClick={() => onEdit(get(response, 'environment.identifier', ''))}
                permission={{
                  resource: {
                    resourceType: ResourceType.ENVIRONMENT
                  },
                  permission: PermissionIdentifier.EDIT_ENVIRONMENT
                }}
              />
              <RbacMenuItem
                icon="trash"
                text={getString('delete')}
                onClick={handleDelete}
                permission={{
                  resource: {
                    resourceType: ResourceType.ENVIRONMENT
                  },
                  permission: PermissionIdentifier.DELETE_ENVIRONMENT
                }}
              />
            </Menu>
          }
          menuPopoverProps={{
            className: Classes.DARK
          }}
        />
        <EnvironmentName environment={defaultTo(response.environment, {})} />
        <Container margin={{ top: 'medium' }}>
          <EnvironmentTypes environment={defaultTo(response.environment, {})} />
        </Container>
      </Container>
      <Container padding={'xlarge'}>
        <Text margin={{ bottom: 'small' }}>{getString('lastUpdated')}</Text>
        <LastUpdatedBy lastModifiedAt={response.lastModifiedAt} />
      </Container>
    </Card>
  )
}
