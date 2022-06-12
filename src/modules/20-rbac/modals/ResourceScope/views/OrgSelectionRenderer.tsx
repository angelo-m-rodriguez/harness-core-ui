/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Checkbox, Radio, Button, ButtonVariation } from '@harness/uicore'
import { SelectionType } from '@rbac/utils/utils'
import { useStrings } from 'framework/strings'
import type { ScopeSelector } from 'services/resourcegroups'
import { useProjectSelectionModal } from '@rbac/modals/ProjectSelectionRenderer/useProjectSelection'
import AccountProjectSelectionRenderer from './AccountProjectSelectionRenderer'

interface OrgSelectionRendererProps {
  accountIdentifier: string
  orgIdentifier: string
  onChange: (scopes: ScopeSelector[]) => void
  includeProjects?: boolean
  projects?: string[]
}

const OrgSelectionRenderer: React.FC<OrgSelectionRendererProps> = ({
  accountIdentifier,
  orgIdentifier,
  includeProjects,
  projects = [],
  onChange
}) => {
  const { getString } = useStrings()
  const [includeProjectResources, setIncludeProjectResources] = useState(includeProjects)
  const [projectSelection, setProjectSelection] = useState<SelectionType>(
    projects?.length ? SelectionType.SPECIFIED : SelectionType.ALL
  )

  const onProjectChange = (items: string[]): void => {
    onChange(
      items.length === 0
        ? [including_child_scopes]
        : [
            excluding_child_scopes,
            ...items.map(
              item =>
                ({
                  accountIdentifier,
                  orgIdentifier,
                  projectIdentifier: item,
                  filter: 'EXCLUDING_CHILD_SCOPES'
                } as ScopeSelector)
            )
          ]
    )
  }

  const { openProjectSelectionModal } = useProjectSelectionModal({
    onSuccess: onProjectChange
  })

  const excluding_child_scopes: ScopeSelector = {
    accountIdentifier,
    orgIdentifier,
    filter: 'EXCLUDING_CHILD_SCOPES'
  }
  const including_child_scopes: ScopeSelector = {
    accountIdentifier,
    orgIdentifier,
    filter: 'INCLUDING_CHILD_SCOPES'
  }

  return (
    <Layout.Vertical padding={{ top: 'medium' }}>
      <Checkbox
        label={getString('rbac.resourceScope.includeProjResources')}
        data-testid={`${orgIdentifier}-INCLUDE-PROJECTS`}
        checked={includeProjectResources}
        onChange={event => {
          setIncludeProjectResources(event.currentTarget.checked)
          onChange([
            {
              accountIdentifier,
              orgIdentifier,
              filter: event?.currentTarget?.checked ? 'INCLUDING_CHILD_SCOPES' : 'EXCLUDING_CHILD_SCOPES'
            }
          ])
        }}
      />
      {includeProjectResources && (
        <Layout.Vertical spacing="small" padding={{ top: 'xsmall' }}>
          <Layout.Horizontal
            spacing="huge"
            margin={{ left: 'xxlarge' }}
            padding={{ left: 'large' }}
            flex={{ justifyContent: 'flex-start' }}
          >
            <Radio
              label={getString('rbac.resourceGroup.all')}
              data-testid={`${orgIdentifier}-INCLUDE-ALL-PROJECTS`}
              inline={true}
              value={SelectionType.ALL}
              checked={projectSelection === SelectionType.ALL}
              onChange={e => {
                onChange([including_child_scopes])
                setProjectSelection(e.currentTarget.value as SelectionType)
              }}
            />
            <Radio
              label={getString('common.specified')}
              inline={true}
              data-testid={`${orgIdentifier}-INCLUDE-SPECFIED-PROJECTS`}
              value={SelectionType.SPECIFIED}
              checked={projectSelection === SelectionType.SPECIFIED}
              onChange={e => {
                onChange([excluding_child_scopes])
                setProjectSelection(e.currentTarget.value as SelectionType)
              }}
            />
            {projectSelection === SelectionType.SPECIFIED && (
              <Button
                text={getString('plusNumber', { number: getString('add') })}
                variation={ButtonVariation.LINK}
                onClick={() => {
                  openProjectSelectionModal(projects, { accountIdentifier, orgIdentifier })
                }}
              />
            )}
          </Layout.Horizontal>
        </Layout.Vertical>
      )}
      <AccountProjectSelectionRenderer
        projects={projects}
        onDelete={project => {
          onProjectChange(projects.filter(id => id !== project))
        }}
      />
    </Layout.Vertical>
  )
}

export default OrgSelectionRenderer
