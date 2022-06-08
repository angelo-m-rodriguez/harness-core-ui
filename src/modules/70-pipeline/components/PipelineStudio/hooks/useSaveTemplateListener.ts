/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useConfirmationDialog } from '@wings-software/uicore'
import { Intent } from '@blueprintjs/core'
import { defaultTo, set } from 'lodash-es'
import produce from 'immer'
import { createTemplate } from '@pipeline/utils/templateUtils'
import { getStepFromStage } from '@pipeline/components/PipelineStudio/StepUtil'
import { useGlobalEventListener } from '@common/hooks'
import { updateStepWithinStage } from '@pipeline/components/PipelineStudio/RightDrawer/RightDrawer'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useStrings } from 'framework/strings'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'

export function useSaveTemplateListener(): void {
  const [savedTemplate, setSavedTemplate] = React.useState<TemplateSummaryResponse>()
  const { getString } = useStrings()
  const {
    state,
    state: {
      selectionState: { selectedStageId = '' },
      pipelineView: { drawerData }
    },
    updatePipeline,
    updateStage,
    updatePipelineView,
    getStageFromPipeline
  } = usePipelineContext()
  const { stage: selectedStage } = getStageFromPipeline(selectedStageId)
  const { pipeline, pipelineView } = state

  const updatePipelineTemplate = async (): Promise<void> => {
    const processNode = createTemplate(pipeline, savedTemplate)
    processNode.description = pipeline.description
    processNode.tags = pipeline.tags
    processNode.projectIdentifier = pipeline.projectIdentifier
    processNode.orgIdentifier = pipeline.orgIdentifier
    await updatePipeline(processNode)
  }

  const updateStageTemplate = async () => {
    if (selectedStage?.stage) {
      const processNode = createTemplate(selectedStage.stage, savedTemplate)
      await updateStage(processNode)
    }
  }

  const updateStepTemplate = async (): Promise<void> => {
    const selectedStepId = defaultTo(drawerData.data?.stepConfig?.node.identifier, '')
    const selectedStep = getStepFromStage(selectedStepId, [
      ...defaultTo(selectedStage?.stage?.spec?.execution?.steps, []),
      ...defaultTo(selectedStage?.stage?.spec?.execution?.rollbackSteps, [])
    ])
    if (selectedStep?.step) {
      const processNode = createTemplate(selectedStep.step, savedTemplate)
      const newPipelineView = produce(pipelineView, draft => {
        set(draft, 'drawerData.data.stepConfig.node', processNode)
      })
      updatePipelineView(newPipelineView)
      const stageData = produce(selectedStage, draft => {
        if (draft?.stage?.spec?.execution) {
          updateStepWithinStage(draft.stage.spec.execution, selectedStepId, processNode)
        }
      })
      if (stageData?.stage) {
        await updateStage(stageData.stage)
      }
    }
  }

  const onUseTemplateConfirm = async (): Promise<void> => {
    switch (savedTemplate?.templateEntityType) {
      case 'Pipeline':
        await updatePipelineTemplate()
        break
      case 'Stage':
        await updateStageTemplate()
        break
      case 'Step':
        await updateStepTemplate()
        break
      default:
        break
    }
  }

  const { openDialog: openUseTemplateDialog } = useConfirmationDialog({
    intent: Intent.WARNING,
    cancelButtonText: getString('no'),
    contentText: getString('pipeline.templateSaved', {
      name: savedTemplate?.name,
      entity: savedTemplate?.templateEntityType?.toLowerCase()
    }),
    titleText: `Use Template ${defaultTo(savedTemplate?.name, '')}?`,
    confirmButtonText: getString('yes'),
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        onUseTemplateConfirm()
      }
    }
  })

  useGlobalEventListener('TEMPLATE_SAVED', event => {
    const { detail: newTemplate } = event
    if (newTemplate) {
      setSavedTemplate(newTemplate)
      setTimeout(() => {
        openUseTemplateDialog()
      }, 0)
    }
  })
}
