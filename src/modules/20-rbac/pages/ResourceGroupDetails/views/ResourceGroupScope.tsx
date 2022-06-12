/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Button, ButtonVariation, Card, Collapse, Color, DropDown, FontVariation, Layout, Text } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { groupBy } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { ResourceGroupDetailsPathProps, ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useResourceScopeModal } from '@rbac/modals/ResourceScope/ResourceScopeModal'
import type { ResourceGroupV2, ScopeSelector } from 'services/resourcegroups'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getScopeDropDownItems, getSelectedScopeType, includesCurrentScope, SelectorScope } from '../utils'
import OrgSelectionRenderer from './OrgSelectionRenderer'
import ProjectSelectionRenderer from './ProjectSelectionRenderer'
import css from './ResourceGroupScope.module.scss'
interface ResourceGroupScopeProps {
  resourceGroup: ResourceGroupV2
  includedScopes: ScopeSelector[]
  onSuccess: (scopes: ScopeSelector[]) => void
  setIsUpdated: (updated: boolean) => void
}

const ResourceGroupScope: React.FC<ResourceGroupScopeProps> = ({ includedScopes, onSuccess, setIsUpdated }) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ResourceGroupDetailsPathProps & ModulePathParams>()
  const { getString } = useStrings()
  const { CUSTOM_RESOURCEGROUP_SCOPE } = useFeatureFlags()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
  const [selectedScope, setSelectedScope] = useState<SelectorScope>()
  const scopeGroup = Object.keys(groupBy(includedScopes, 'orgIdentifier')).filter(_val => _val !== 'undefined')

  const { openResourceScopeModal } = useResourceScopeModal({
    onSuccess: scopes => {
      setIsUpdated(true)
      onSuccess(scopes)
    }
  })

  useEffect(() => {
    setSelectedScope(getSelectedScopeType(scope, includedScopes))
  }, [includedScopes])

  const header = (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small">
      {Object.keys(scopeGroup).length ? (
        <Text>
          {`${getString('rbac.resourceScope.numberOfOrgsAndProjects', {
            organizations: Object.keys(scopeGroup).length
          })} ${
            includesCurrentScope(includedScopes, scope)
              ? `| ${getString('rbac.resourceScope.accountResourcesIncluded')}`
              : ''
          } `}
        </Text>
      ) : (
        <Text color={Color.GREY_400}> No Specific Organizations</Text>
      )}
      <Button
        icon="Edit"
        text={getString('edit')}
        variation={ButtonVariation.LINK}
        onClick={() => {
          openResourceScopeModal(includedScopes)
        }}
      />
    </Layout.Horizontal>
  )

  return (
    <Card className={css.card}>
      <Layout.Vertical spacing="medium">
        <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
          <Text font={{ variation: FontVariation.H5 }} color={Color.GREY_800}>
            {getString('rbac.resourceScope.label')}
          </Text>
          <DropDown
            items={getScopeDropDownItems(scope, getString, CUSTOM_RESOURCEGROUP_SCOPE)}
            value={selectedScope}
            filterable={false}
            onChange={item => {
              setIsUpdated(true)
              if (item.value !== SelectorScope.CUSTOM) {
                onSuccess([
                  {
                    accountIdentifier: accountId,
                    orgIdentifier,
                    projectIdentifier,
                    filter:
                      item.value === SelectorScope.INCLUDE_CHILD_SCOPES
                        ? 'INCLUDING_CHILD_SCOPES'
                        : 'EXCLUDING_CHILD_SCOPES'
                  }
                ])
              } else {
                setSelectedScope(SelectorScope.CUSTOM)
              }
            }}
          />
        </Layout.Horizontal>
        <Layout.Vertical padding={{ top: 'small' }}>
          {selectedScope === SelectorScope.CUSTOM &&
            (Object.keys(scopeGroup).length ? (
              <Collapse
                collapsedIcon="chevron-right"
                expandedIcon="chevron-up"
                isRemovable={false}
                collapseClassName={css.collapse}
                heading={header}
              >
                {scope === Scope.ACCOUNT && <OrgSelectionRenderer includedScopes={includedScopes} />}
                {scope === Scope.ORG && <ProjectSelectionRenderer includedScopes={includedScopes} />}
              </Collapse>
            ) : (
              header
            ))}
        </Layout.Vertical>
      </Layout.Vertical>
    </Card>
  )
}

export default ResourceGroupScope
