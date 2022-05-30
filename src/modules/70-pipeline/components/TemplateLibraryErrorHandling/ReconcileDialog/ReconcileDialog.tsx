/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Container, Layout, Text, useToaster } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Color } from '@wings-software/design-system'
import { clone, defaultTo, isEmpty, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { PageSpinner } from '@harness/uicore'
import {
  refreshAndUpdateTemplateInputsPromise as refreshAndUpdateTemplate,
  refreshAllPromise as refreshAllTemplatePromise,
  ErrorNodeSummary,
  TemplateInfo
} from 'services/template-ng'
import { YamlDiffView } from '@pipeline/components/TemplateLibraryErrorHandling/YamlDiffView/YamlDiffView'
import { ErrorNode } from '@pipeline/components/TemplateLibraryErrorHandling/ErrorDirectory/ErrorNode'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { String, useStrings } from 'framework/strings'
import {
  refreshAndUpdateTemplateInputsPromise as refreshAndUpdatePipeline,
  refreshAllPromise as refreshAllPipelinePromise
} from 'services/pipeline-ng'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useQueryParams } from '@common/hooks'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { getFirstLeafNode } from '@pipeline/components/TemplateLibraryErrorHandling/TemplateLibraryErrorHandlingUtils'

export interface ReconcileDialogProps {
  templateInputsErrorNodeSummary: ErrorNodeSummary
  entity: 'Pipeline' | 'Template'
  setResolvedTemplateInfos: (resolvedTemplateInfos: TemplateInfo[]) => void
  reload: () => void
}

export function ReconcileDialog({
  templateInputsErrorNodeSummary,
  entity,
  setResolvedTemplateInfos: setResolvedTemplates,
  reload
}: ReconcileDialogProps) {
  const hasChildren = !isEmpty(templateInputsErrorNodeSummary.childrenErrorNodes)
  const [selectedErrorNodeSummary, setSelectedErrorNodeSummary] = React.useState<ErrorNodeSummary>()
  const [resolvedTemplateInfos, setResolvedTemplateInfos] = React.useState<TemplateInfo[]>([])
  const params = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const { showError } = useToaster()
  const { isGitSyncEnabled } = useAppStore()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()

  const [canEditTemplate] = usePermission({
    resource: {
      resourceType: ResourceType.TEMPLATE
    },
    permissions: [PermissionIdentifier.EDIT_TEMPLATE]
  })

  const updateButtonEnabled = React.useMemo(() => {
    if (isGitSyncEnabled) {
      return false
    } else if (entity === 'Pipeline' && hasChildren) {
      return canEditTemplate
    } else {
      return true
    }
  }, [])

  React.useEffect(() => {
    setResolvedTemplates(resolvedTemplateInfos)
  }, [resolvedTemplateInfos])

  React.useEffect(() => {
    setSelectedErrorNodeSummary(getFirstLeafNode(templateInputsErrorNodeSummary))
  }, [])

  const onUpdateAll = async (): Promise<void> => {
    setLoading(true)
    if (templateInputsErrorNodeSummary.templateInfo) {
      const templateRef = defaultTo(templateInputsErrorNodeSummary.templateInfo.templateIdentifier, '')
      const scope = getScopeFromValue(templateRef)
      try {
        const response = await refreshAllTemplatePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, scope),
            templateIdentifier: getIdentifierFromValue(templateRef),
            versionLabel: defaultTo(templateInputsErrorNodeSummary.templateInfo.versionLabel, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.refresh.all.error')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await refreshAllPipelinePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
            identifier: defaultTo(templateInputsErrorNodeSummary?.nodeInfo?.identifier, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'pipeline.refresh.all.error')
      } finally {
        setLoading(false)
      }
    }
  }

  const onUpdateNode = async (): Promise<void> => {
    setLoading(true)
    if (selectedErrorNodeSummary?.templateInfo) {
      const templateRef = defaultTo(selectedErrorNodeSummary.templateInfo.templateIdentifier, '')
      const scope = getScopeFromValue(templateRef)
      try {
        const response = await refreshAndUpdateTemplate({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, scope),
            templateIdentifier: getIdentifierFromValue(templateRef),
            versionLabel: defaultTo(selectedErrorNodeSummary.templateInfo.versionLabel, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          if (isEqual(selectedErrorNodeSummary.nodeInfo, templateInputsErrorNodeSummary.nodeInfo)) {
            reload()
          } else if (selectedErrorNodeSummary.templateInfo) {
            setResolvedTemplateInfos([...resolvedTemplateInfos, clone(selectedErrorNodeSummary.templateInfo)])
          }
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.refresh.error')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await refreshAndUpdatePipeline({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
            identifier: defaultTo(selectedErrorNodeSummary?.nodeInfo?.identifier, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'pipeline.refresh.error')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Container>
      {loading && <PageSpinner />}
      <Layout.Vertical>
        <Container
          border={{ bottom: true }}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'large', left: 'xxxlarge' }}
        >
          <Text font={{ variation: FontVariation.H4 }}>{getString('pipeline.reconcileDialog.title')}</Text>
        </Container>
        <Container
          background={Color.FORM_BG}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'xxxlarge', left: 'xxxlarge' }}
        >
          <Layout.Horizontal spacing={'huge'}>
            <Container width={376}>
              <Layout.Vertical spacing={'xlarge'}>
                <Container>
                  <Layout.Vertical spacing={'medium'}>
                    <Text font={{ variation: FontVariation.H5 }}>{getString('pipeline.reconcileDialog.subtitle')}</Text>
                    <Text font={{ variation: FontVariation.BODY }}>
                      <String
                        stringID={
                          hasChildren
                            ? 'pipeline.reconcileDialog.unsyncedTemplateInfo'
                            : 'pipeline.reconcileDialog.updatedTemplateInfo'
                        }
                        vars={{
                          name: `${entity}: ${templateInputsErrorNodeSummary.nodeInfo?.name}`
                        }}
                        useRichText={true}
                      />
                    </Text>
                  </Layout.Vertical>
                </Container>
                <Button
                  text={
                    hasChildren
                      ? getString('pipeline.reconcileDialog.updateAllLabel')
                      : getString('pipeline.reconcileDialog.updateEntityLabel', { entity })
                  }
                  variation={ButtonVariation.PRIMARY}
                  width={248}
                  disabled={!updateButtonEnabled}
                  onClick={onUpdateAll}
                />
                {hasChildren && (
                  <ErrorNode
                    templateInputsErrorNodeSummary={templateInputsErrorNodeSummary}
                    resolvedTemplateInfos={resolvedTemplateInfos}
                    selectedErrorNodeSummary={selectedErrorNodeSummary}
                    setSelectedErrorNodeSummary={setSelectedErrorNodeSummary}
                  />
                )}
              </Layout.Vertical>
            </Container>
            <Container style={{ flex: 1 }}>
              <YamlDiffView
                errorNodeSummary={selectedErrorNodeSummary}
                resolvedTemplateInfos={resolvedTemplateInfos}
                onUpdate={onUpdateNode}
              />
            </Container>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
