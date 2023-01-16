/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  Container,
  Icon,
  Layout,
  Popover,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@harness/uicore'
import { Classes, Menu, Position } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { get, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { PipelineType, ProjectPathProps, TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import {
  GetErrorResponse,
  SaveTemplateHandle,
  SaveTemplatePopoverWithRef
} from '@templates-library/components/TemplateStudio/SaveTemplatePopover/SaveTemplatePopover'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import {
  TemplateStudioSubHeaderLeftViewHandle,
  TemplateStudioSubHeaderLeftViewWithRef
} from '@templates-library/components/TemplateStudio/TemplateStudioSubHeader/views/TemplateStudioSubHeaderLeftView/TemplateStudioSubHeaderLeftView'
import useDiffDialog from '@common/hooks/useDiffDialog'
import { stringify } from '@common/utils/YamlHelperMethods'
import EndOfLifeBanner from '@pipeline/components/PipelineStudio/PipelineCanvas/EndOfLifeBanner'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { StoreType } from '@common/constants/GitSyncTypes'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import css from './TemplateStudioSubHeader.module.scss'

export interface TemplateStudioSubHeaderProps {
  onViewChange: (view: SelectedView) => boolean
  getErrors: () => Promise<GetErrorResponse>
  onGitBranchChange: (selectedFilter: GitFilterScope) => void
  onReconcile(): void
}

export type TemplateStudioSubHeaderHandle = {
  updateTemplate: (templateYaml: string) => Promise<void>
}

function TemplateStudioSubHeader(
  props: TemplateStudioSubHeaderProps,
  ref: React.ForwardedRef<TemplateStudioSubHeaderHandle>
): React.ReactElement {
  const { onViewChange, getErrors, onGitBranchChange, onReconcile } = props
  const { state, fetchTemplate, view, isReadonly } = React.useContext(TemplateContext)
  const { template, originalTemplate, isUpdated, entityValidityDetails, templateYamlError, storeMetadata } = state
  const { getString } = useStrings()
  const { templateIdentifier, accountId, projectIdentifier, orgIdentifier } = useParams<TemplateStudioPathProps>()
  const { module } = useParams<PipelineType<ProjectPathProps>>()
  const isYaml = view === SelectedView.YAML
  const isVisualViewDisabled = React.useMemo(() => entityValidityDetails.valid === false, [entityValidityDetails.valid])
  const saveTemplateHandleRef = React.useRef<SaveTemplateHandle | null>(null)
  const templateStudioSubHeaderLeftViewHandleRef = React.useRef<TemplateStudioSubHeaderLeftViewHandle | null>(null)
  const isPipelineGitCacheEnabled = useFeatureFlag(FeatureFlag.PIE_NG_GITX_CACHING)
  const { supportingGitSimplification } = useAppStore()
  const isPipelineRemote = supportingGitSimplification && storeMetadata?.storeType === StoreType.REMOTE
  const [showBanner, setShowbanner] = React.useState(false)
  const isNewTemplate = templateIdentifier === DefaultNewTemplateId

  //Banner Effect
  React.useEffect(() => {
    if (!isEmpty(projectIdentifier)) {
      if (module === 'cd' && (template.type === 'Pipeline' || template.type === 'Stage')) setShowbanner(true)

      if (module !== 'cd' && template.spec) {
        if (template.type === 'Pipeline') {
          //check deployment type stages in non-cd module pipeline template
          const pipelineTemplateCdStageCheck = get(template, 'spec.stages')?.filter(
            (stage: any) =>
              get(stage, 'stage.spec.serviceConfig') !== undefined ||
              get(stage, 'parallel')?.some(
                (parallelStage: any) => get(parallelStage, 'stage.spec.serviceConfig') !== undefined
              )
          )
          if (pipelineTemplateCdStageCheck.length > 0) setShowbanner(true)
          else setShowbanner(false)
        }
        if (template.type === 'Stage') {
          //check deployment type stage in non-cd module stage template
          const stageTemplateCdStageCheck = get(template, 'spec.spec.serviceConfig') !== undefined
          if (stageTemplateCdStageCheck) setShowbanner(true)
          else setShowbanner(false)
        }
      }
    }
  }, [template, template.spec, module, projectIdentifier])

  React.useImperativeHandle(
    ref,
    () => ({
      updateTemplate: async (templateYaml: string) => {
        await saveTemplateHandleRef.current?.updateTemplate(templateYaml)
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveTemplateHandleRef.current]
  )

  const { open: openDiffModal } = useDiffDialog({
    originalYaml: stringify(originalTemplate),
    updatedYaml: stringify(template),
    title: getString('templatesLibrary.diffTitle')
  })

  function handleReloadFromGitClick(): void {
    templateStudioSubHeaderLeftViewHandleRef.current?.openReconcileConfirmation()
  }

  return (
    <Layout.Vertical>
      <Container
        className={css.subHeader}
        height={49}
        padding={{ right: 'medium', left: 'xlarge' }}
        border={{ bottom: true, color: Color.GREY_200 }}
        background={Color.WHITE}
      >
        <Layout.Horizontal height={'100%'} flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <TemplateStudioSubHeaderLeftViewWithRef
            ref={templateStudioSubHeaderLeftViewHandleRef}
            onGitBranchChange={onGitBranchChange}
          />
          {!templateYamlError && (
            <Container>
              <VisualYamlToggle
                className={css.visualYamlToggle}
                selectedView={isYaml || isVisualViewDisabled ? SelectedView.YAML : SelectedView.VISUAL}
                onChange={nextMode => {
                  onViewChange(nextMode)
                }}
                disableToggle={isVisualViewDisabled}
              />
            </Container>
          )}
          <Container>
            <Layout.Horizontal spacing={'medium'} flex={{ alignItems: 'center' }}>
              {!templateYamlError && (
                <Layout.Horizontal spacing={'medium'} flex={{ alignItems: 'center' }}>
                  {isReadonly && (
                    <Container>
                      <Layout.Horizontal spacing={'small'}>
                        <Icon name="eye-open" size={16} color={Color.ORANGE_800} />
                        <Text color={Color.ORANGE_800} font={{ size: 'small' }}>
                          {getString('common.readonlyPermissions')}
                        </Text>
                      </Layout.Horizontal>
                    </Container>
                  )}
                  {isUpdated && !isReadonly && (
                    <Button
                      variation={ButtonVariation.LINK}
                      intent="warning"
                      className={css.tagRender}
                      onClick={openDiffModal}
                    >
                      {getString('unsavedChanges')}
                    </Button>
                  )}
                  {!isReadonly && (
                    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'center' }}>
                      <SaveTemplatePopoverWithRef getErrors={getErrors} ref={saveTemplateHandleRef} />
                      {isNewTemplate ? null : (
                        <React.Fragment>
                          <Button
                            disabled={!isUpdated}
                            onClick={() => {
                              fetchTemplate({ forceFetch: true, forceUpdate: true })
                            }}
                            variation={ButtonVariation.SECONDARY}
                            text={getString('common.discard')}
                          />
                          <Popover className={Classes.DARK} position={Position.LEFT}>
                            <Button
                              variation={ButtonVariation.ICON}
                              icon="Options"
                              aria-label="pipeline menu actions"
                            />
                            <Menu style={{ backgroundColor: 'unset' }}>
                              {isPipelineRemote && isPipelineGitCacheEnabled ? (
                                <RbacMenuItem
                                  icon="repeat"
                                  text={getString('common.reloadFromGit')}
                                  onClick={handleReloadFromGitClick}
                                  permission={{
                                    resourceScope: {
                                      accountIdentifier: accountId,
                                      orgIdentifier,
                                      projectIdentifier
                                    },
                                    resource: {
                                      resourceType: ResourceType.TEMPLATE,
                                      resourceIdentifier: template?.identifier
                                    },
                                    permission: PermissionIdentifier.VIEW_TEMPLATE
                                  }}
                                />
                              ) : null}
                              <RbacMenuItem
                                icon="refresh"
                                text={getString('pipeline.outOfSyncErrorStrip.reconcile')}
                                onClick={onReconcile}
                                permission={{
                                  resourceScope: {
                                    accountIdentifier: accountId,
                                    orgIdentifier,
                                    projectIdentifier
                                  },
                                  resource: {
                                    resourceType: ResourceType.TEMPLATE,
                                    resourceIdentifier: template?.identifier
                                  },
                                  permission: PermissionIdentifier.EDIT_TEMPLATE
                                }}
                              />
                            </Menu>
                          </Popover>
                        </React.Fragment>
                      )}
                    </Layout.Horizontal>
                  )}
                </Layout.Horizontal>
              )}
            </Layout.Horizontal>
          </Container>
        </Layout.Horizontal>
      </Container>
      {showBanner && <EndOfLifeBanner />}
    </Layout.Vertical>
  )
}

export const TemplateStudioSubHeaderWithRef = React.forwardRef(TemplateStudioSubHeader)
